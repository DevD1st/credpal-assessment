# CredPal FX Trading App (Backend Assessment)

A production-style, **proto-first microservices workspace** for an FX trading platform, built with NestJS + TypeScript.

The solution is structured to reflect how real financial systems are built: strongly-typed contracts, service boundaries, async event workflows, transactional consistency, and deliberate choices for SQL + NoSQL workloads.

---

## 1) Project Summary

This repository implements the core backend capabilities for an FX trading assessment:

- Account registration + OTP verification + token issuance
- Wallet creation and retrieval
- Wallet funding with idempotency protection
- FX quote creation
- FX trade execution (wallet-to-wallet conversion)
- Transaction and ledger persistence
- Event publication for downstream consumers

Design goals:

- Correctness of financial operations
- Scalability and extension readiness (currencies, pairs, services)
- Resilience with asynchronous workflows
- Clear service ownership and separation of concerns

---

## 2) Proto-First Workspace

This project is **proto-first**:

- Service contracts are defined in `protobuf/*.proto`
- TypeScript definitions/clients are generated into `packages/proto/src/generated`
- Services and gateway consume shared generated contracts from `@credpal-fx-trading-app/proto`

Why this matters:

- Enforces explicit service contracts early
- Reduces integration drift between services
- Makes service evolution safer as the system grows

---

## 3) Architecture Overview

### Services

- **Gateway** (`services/gateway`)
  - HTTP edge service
  - API validation, swagger docs, request context extraction
  - Forwards to internal gRPC services

- **Accounts** (`services/accounts`)
  - Registration + OTP verification flow
  - User persistence (PostgreSQL)
  - JWT issuance with token versioning
  - Publishes account lifecycle events via RabbitMQ

- **Wallets** (`services/wallets`)
  - Wallet domain and transactional core
  - Funding and trade flows
  - BullMQ workers for async post-acceptance processing
  - Wallet, transaction, and ledger persistence (PostgreSQL)

- **Analytics** (`services/analytics`)
  - MongoDB-backed analytics/log modeling
  - Contains schemas and repositories for activity/trade/FX trend capture
  - Included to demonstrate SQL + NoSQL workload separation

- **Notifications** (`services/notifications`)
  - Service scaffold in place for event-driven notifications

### Shared Packages

- `packages/common`: errors, logger, utility helpers, DTO contracts
- `packages/constants`: topics, cache keys, queue names, domain constants
- `packages/runtime`: decorators, filters, middleware, global logging module
- `packages/proto`: generated protobuf types

### Infrastructure

- PostgreSQL (transactional relational data)
- Redis (cache, quote cache, idempotency cache, token state)
- RabbitMQ (event-driven workflows)
- MongoDB (analytics/log-oriented document workloads)
- Docker Compose orchestration

### Request + Processing Flow (High-Level)

```mermaid
flowchart LR
	A[Client] --> B[Gateway HTTP API]
	B -->|gRPC| C[Accounts Service]
	B -->|gRPC| D[Wallets Service]

	C -->|SQL| E[(PostgreSQL)]
	D -->|SQL| E

	D -->|Cache / Idempotency / Quotes| F[(Redis)]
	C -->|OTP / Token State| F

	C -->|Events| G[(RabbitMQ)]
	D -->|Events| G
	D -->|BullMQ Jobs| H[Transaction Worker]
	H -->|Update tx + ledgers| E

	G --> I[Notifications Service]
	G --> J[Analytics Service]
	J -->|Document logs/analytics| K[(MongoDB)]
```

---

## 4) Why Microservices Here?

The microservice architecture is intentional for two reasons:

1. To mirror an actual production application architecture.
2. To demonstrate practical coexistence of SQL and NoSQL data stores in the same platform.

It also aligns with distributed, event-driven backend expectations for the role:

- asynchronous processing
- clear domain boundaries
- independently scalable components
- fault isolation

Relevant role context: [Backend Developer JD (CredPal)](https://credpal.zohorecruit.com/jobs/Careers/712621000006540011/Backend-Developer)

---

## 5) Data Model (Tables, Relationships, and Constraints)

### PostgreSQL Tables

#### `users` (Accounts service)

- `id` (UUID, primary key)
- `email` (unique)
- `password_hash`
- `role` (`USER | ADMIN` check constraint)
- `is_verified`
- `token_version`
- timestamps

#### `wallets` (Wallets service)

- `id` (UUID, primary key)
- `user_id` (owner)
- `currency`
- `balance` (decimal 18,4, non-negative constraint)
- `status` (`ACTIVE | DISABLED` check constraint)
- timestamps

#### `transactions` (Wallets service)

- `id` (UUID, primary key)
- `user_id`
- `base_wallet_id`
- `target_wallet_id` (nullable for some operation types)
- `type` (`FUNDING | CONVERSION`)
- `status` (`PENDING | SUCCESS | FAILED`)
- `base_currency`, `target_currency`
- `base_amount`, `target_amount`
- `exchange_rate`, `exchange_rate_with_spread`, `percentage_spread`
- `reference` (unique business reference)
- timestamps

#### `ledgers` (Wallets service)

- `id` (UUID, primary key)
- `wallet_id`
- `transaction_id`
- `type` (`CREDIT | DEBIT`)
- `currency`
- `amount`
- `running_balance`
- `created_at`

### Key Relationships

- One `user` → many `wallets`
- One `wallet` → many `transactions` (as base and/or target)
- One `transaction` → many `ledger` entries
- One `wallet` → many `ledger` entries

This structure supports traceable movement accounting and reconciliation.

### Assumption

- A user cannot have multiple wallets of the same currency.
  - Enforced by unique constraint on (`user_id`, `currency`).

---

## 6) MongoDB in Analytics (Why It Is a Good Fit)

The analytics microservice is included to show why MongoDB is practical for logs/analytics workloads:

- High-write, append-heavy event/activity records
- Flexible schema for evolving analytics payloads
- Better fit for heterogeneous/non-transactional documents
- Separation from critical transactional SQL paths

Collections/schemas in place:

- `user_activities`
- `trade_analytics`
- `fx_trends`

This directly addresses the assessment requirement to use MongoDB for non-relational workloads, while the transactional core remains in PostgreSQL.

> Note: analytics ingestion handlers/controllers were not completed in this iteration.

---

## 7) Indexing Strategy and Why It Matters

Indexes and constraints were intentionally added to support correctness and scale:

- `users.email` unique index
- `wallets.user_id` index
- `wallets(user_id, currency)` unique constraint
- `transactions.user_id` index
- `transactions.base_wallet_id` index
- `transactions.reference` index + uniqueness
- `ledgers.wallet_id` index
- `ledgers.transaction_id` index

Benefits:

- faster account/wallet/transaction lookups
- safer idempotent transaction creation
- predictable query latency under higher load
- stronger data integrity guarantees

---

## 8) UUIDv7 as Primary Key (Scalability Choice)

Primary entities default to **UUIDv7**.

Why:

- Retains global uniqueness like UUIDs
- Time-ordered characteristics improve index locality compared with fully random UUIDv4
- Better insertion behavior at scale for write-heavy tables
- Supports distributed ID generation without central coordination

This is one deliberate response to the assessment’s scaling direction.

---

## 9) Idempotency and Duplicate-Protection in Transactions

Funding flow uses **two-level duplicate checks**:

1. **Level 1: Persistent check (database)**
   - transaction `reference` uniqueness check blocks replay with same reference.

2. **Level 2: Short-window cache check (Redis)**
   - temporary key guards against rapid duplicate submission bursts.

Combined with `PENDING → SUCCESS/FAILED` state transitions and worker-side locking, this reduces duplicate processing risk and strengthens consistency.

---

## 10) Endpoint Interpretation Assumption

The brief is ambiguous about the distinction between:

- `POST /wallet/convert`
- `POST /wallet/trade`

Assumption used in this implementation:

- `POST /wallet/convert` → quote request
- `POST /wallet/trade` → actual trade/conversion execution

---

## 11) Scalability and Extensibility Notes

The solution is designed to scale from the start and to support future growth (including large user volumes):

- domain-isolated services with explicit contracts
- event-driven messaging via RabbitMQ
- async background processing via BullMQ workers
- Redis caching for hot/ephemeral data
- relational integrity for money movement records
- NoSQL analytics partitioning for non-transactional workloads
- centralized constants/config and shared runtime primitives

The system is also easy to extend for additional currencies/trading pairs:

- supported currencies are centralized in constants
- quote and exchange-rate logic is modularized
- additional market/provider integrations can be added behind existing service boundaries

---

## 12) Alignment to Assessment + Architecture Decisions

Assumption made for technology choices:

> Other technologies can be used as long as recommended tools are included and architecture/technology decisions are justified. In this solution, the microservices architecture is justified by production realism, clear service boundaries, async workflows, and combined SQL/NoSQL demonstration aligned to role expectations.

Reference for role expectations: [CredPal Backend Developer JD](https://credpal.zohorecruit.com/jobs/Careers/712621000006540011/Backend-Developer)

---

## 13) Current Scope Status

### Implemented core

- Auth registration + OTP verification
- Wallet creation/listing
- Funding request + async worker finalization
- Quote creation + FX rate retrieval/caching
- Trade request + async worker finalization
- Transaction and ledger persistence

### Partially implemented / scaffolded

- Gateway currently exposes auth HTTP routes; additional HTTP surface can be expanded
- Analytics service has schema/repository foundation but not complete ingestion/query handlers
- Notifications service scaffold exists but handlers are pending

### Testing

- Automated test suite coverage is planned as a follow-up iteration.

---

## 14) Run Instructions

### Environment File Structure

Environment values are organized per service under `env/`:

```text
env/
	root.env           # shared values (DB, Redis, RabbitMQ, JWT secrets, NODE_ENV)
	gateway.env        # SERVICE=gateway, PORT, ACCOUNTS_SERVICE_URL
	accounts.env       # SERVICE=accounts, ACCOUNTS_SERVICE_URL, MASTER_OTP
	wallets.env        # SERVICE=wallets, WALLETS_SERVICE_URL, EXCHANGE_RATE_API_KEY
	analytics.env      # SERVICE=analytics, ANALYTICS_SERVICE_URL, MONGODB_URI
	notifications.env  # SERVICE=notifications, NOTIFICATIONS_SERVICE_URL
```

`root.env` should contain shared values used by multiple services, for example:

```env
NODE_ENV=development
ACCESS_TOKEN_SECRET=ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET=REFRESH_TOKEN_SECRET

POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=credpal
POSTGRES_USER=credpal
POSTGRES_PASSWORD=credpal

REDIS_HOST=redis
REDIS_PORT=6379

RABBITMQ_URL=amqp://credpal:credpal@rabbit:5672
RABBITMQ_EXCHANGE=credpal_events
```

### Prerequisites

- Node.js `>=24`
- npm workspaces
- Docker + Docker Compose
- `protoc` available in environment (for proto generation)

### Local setup

```bash
npm run install:all
npm run build:pkgs
docker compose up --build
```

Then:

1. Wait until the gateway logs indicate startup (e.g., gateway running on port `3000`).
2. Open `http://localhost:3000` in your browser.
3. Refresh the browser once services finish warming up to confirm gateway readiness.
4. Open Swagger docs at `http://localhost:3000/api/docs`.

This starts infrastructure and services:

- Gateway: `http://localhost:3000`
- Swagger: `http://localhost:3000/api/docs`
- Accounts gRPC: `:50051`
- Analytics gRPC: `:50052`
- Notifications gRPC: `:50053`
- Wallets gRPC: `:50054`

---

## 15) Repository Layout

```text
packages/
	common/        # shared utils, errors, logger, DTOs
	constants/     # topics, keys, domain constants
	runtime/       # decorators, middleware, filters, logging module
	proto/         # generated protobuf TS contracts

services/
	gateway/       # HTTP edge + gRPC clients
	accounts/      # auth + users
	wallets/       # wallets + transactions + FX + workers
	analytics/     # Mongo analytics foundations
	notifications/ # notification service scaffold

protobuf/        # source protobuf contracts (proto-first)
env/             # service env configs
scripts/         # DB init, instrumentation
```

---

## 16) Final Notes

This solution is intentionally architected like a real fintech backend: contract-first interfaces, safe transaction handling, asynchronous workflows, and scalable storage patterns.

It is structured for extension and production hardening without requiring foundational redesign.

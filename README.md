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

## 4) Implemented API Endpoints

### Authentication (`/v1/auth`)

- **POST** `/auth/register/individual` – Register with email and password
- **POST** `/auth/verify-otp` – Verify OTP and receive access/refresh tokens
- **POST** `/auth/login` – Login with email and password
- **POST** `/auth/refresh-token` – Refresh access and refresh tokens (Bearer required)

### Wallets (`/v1/wallet`)

- **POST** `/wallet` – Create wallet for a supported currency (Bearer required)
- **GET** `/wallet` – Fetch user wallets with optional filters (currency, status, pagination)
- **POST** `/wallet/fund` – Fund wallet with idempotency protection (Bearer required)
- **POST** `/wallet/convert` – Create FX quote for currency conversion (Bearer required)
- **POST** `/wallet/trade` – Execute FX trade/conversion (Bearer required)

### Exchange Rates (`/v1/fx`)

- **GET** `/fx/rates` – Fetch current exchange rates for all supported currencies (Bearer required)

### Transactions (`/v1/transactions`)

- **GET** `/transactions` – Retrieve transaction history with filtering and pagination (Bearer required)

---

## 5) Why Microservices Here?

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

## 6) Data Model (Tables, Relationships, and Constraints)

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

## 7) MongoDB in Analytics (Why It Is a Good Fit)

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

## 8) Indexing Strategy and Why It Matters

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

## 9) UUIDv7 as Primary Key (Scalability Choice)

Primary entities default to **UUIDv7**.

Why:

- Retains global uniqueness like UUIDs
- Time-ordered characteristics improve index locality compared with fully random UUIDv4
- Better insertion behavior at scale for write-heavy tables
- Supports distributed ID generation without central coordination

This is one deliberate response to the assessment's scaling direction.

---

## 10) Idempotency and Duplicate-Protection in Transactions

Funding flow uses **two-level duplicate checks**:

1. **Level 1: Persistent check (database)**
   - transaction `reference` uniqueness check blocks replay with same reference.

2. **Level 2: Short-window cache check (Redis)**
   - temporary key guards against rapid duplicate submission bursts.

Combined with `PENDING → SUCCESS/FAILED` state transitions and worker-side locking, this reduces duplicate processing risk and strengthens consistency.

---

## 11) Authentication & Authorization

### JWT Token Architecture

- **Access Tokens**: 15-minute expiration with JWT ID (JTI) and token version tracking
- **Refresh Tokens**: 30-day expiration with persistent Redis validation state (VALID/REVOKED)
- **Token Versioning**: Automatic session invalidation on new login by incrementing stored `tokenVersion`
- **Token Structure**: Includes metadata - account type (USER/ADMIN), profile ID, JTI for refresh validation

### Authorization Guard Chain

1. **AccessTokenGuard** – Validates JWT access token, extracts user identity, populates request context
2. **RefreshTokenGuard** – Validates refresh token from Bearer header, checks Redis state
3. **UserGuard** – Enforces account type is USER (blocks admin/system accounts from user-facing endpoints)

### Master OTP (Development Only)

- Non-production environment support for testing OTP flows without email delivery
- Logs warnings for audit trails
- Configurable via `MASTER_OTP` environment variable

---

## 12) Financial Precision & Decimal Math

All monetary calculations use **Decimal.js** to prevent floating-point rounding errors:

- Wallet balance updates maintain 18.4 decimal precision
- FX rate calculations scaled by 10,000 for integer representation
- Quote amount calculations precise to smallest currency unit
- Ledger running balance snapshots accurate for reconciliation

This is critical for financial compliance and audit accuracy.

---

## 13) CQRS Pattern (Command Query Responsibility Segregation)

The application cleanly separates commands (mutations) from queries (reads):

**Commands** (state changes):

- `CreateWalletCommand`, `FundWalletCommand`, `TradeCurrencyCommand`
- `VerifyOTPCommand`, `LoginCommand`, `RegisterAccountCommand`

**Queries** (state reads):

- `GetWalletsQuery`, `FetchExchangeRatesQuery`, `GetTransactionsQuery`
- `ValidateAccessTokenQuery`, `ValidateRefreshTokenQuery`

**Buses**: `CommandBus` and `QueryBus` centralize routing and dependency injection.

Benefits: Clear responsibility, easier testing, better separation of concerns, scalability for read/write optimization.

---

## 14) Asynchronous Processing with BullMQ Workers

Wallet funding and currency trades are processed asynchronously to ensure reliability and scalability:

**Job Types**:

- `FUND_WALLET_JOB` – Funds wallet with pessimistic locking and ledger generation
- `TRADE_CURRENCY_JOB` – Executes multi-wallet conversion with decimal precision

**Features**:

- Pessimistic write locks during wallet updates
- Automatic retry on transient failures
- Rollback with status update to FAILED on fatal errors
- Separation of request acceptance from processing completion

---

## 15) Redis Caching Strategy

Cache keys with intentional TTLs for different use cases:

| Use Case                 | TTL        | Purpose                                                      |
| ------------------------ | ---------- | ------------------------------------------------------------ |
| **Exchange Rates**       | 2 hours    | Global rate cache, reduces API calls to exchangerate-api.com |
| **User Quotes**          | 10 minutes | Per-user, per-currency-pair quote requests                   |
| **OTP Verification**     | 60 minutes | Email-based account verification codes                       |
| **Refresh Tokens**       | 30 days    | JTI state tracking (VALID/REVOKED)                           |
| **Wallet Funding Cache** | 60 seconds | Idempotency burst protection                                 |

---

## 16) Error Handling & Custom Validation

### Custom Error Classes

- `ValidationError` (400) – DTO validation failures
- `BadRequestError` (400) – Invalid request data
- `UnauthorizedError` (401) – Missing/invalid auth
- `ForbiddenError` (403) – Insufficient permissions
- `NotFoundError` (404) – Resource not found
- `ConflictError` (409) – Business logic conflict (e.g., duplicate wallet currency)
- `InsufficientFundsError` (409) – Wallet balance insufficient

### Custom Validators

- **@IsDifferentFrom()** – Cross-field validation ensuring base ≠ target currency
- **@Matches()** – UUID regex validation for wallet/quote IDs
- **@IsEnum()** – Required for all enums (SupportedCurrencies, WalletStatus, TransactionStatus)
- **@Transform()** – Uppercase normalization for currency codes

### Global Exception Filters

- HTTP exception filter – Catches all exceptions and formats consistent error responses
- gRPC exception filter – Formats gRPC errors with proper status codes

---

## 17) Request Middleware & Context Extraction

### RequestIdMiddleware

- Generates unique request IDs for every incoming request
- Propagates via HTTP headers for distributed tracing

### ContextHttp Decorator

- Extracts client metadata from request:
  - IP address
  - User agent
  - Country (geolocation)
  - Device info
- Available to all endpoint handlers via `@ContextHttp()` parameter

### Serialization & Versioning

- **ClassSerializerInterceptor** with `@Expose()` decorators filters response fields
- **API Versioning** via `@Controller({ version: "1" })` enables future v2 compatibility

---

## 18) Exchange Rate Integration

### Real-Time Rate Fetching

- Integrates with **exchangerate-api.com** for live FX rates
- Supports: USD, NGN, AUD, GBP, EUR, CAD
- Automatic rate scaling (×10,000 stored as integer for precision)

### Rate Caching & Events

- Global cache with 2-hour TTL reduces API call volume
- Event-driven cache refresh via `FxListener` on `exchange.rate.fetched` topic
- Enables real-time updates across distributed instances

---

## 19) Structured Logging & Observability

### Winston Logger

- JSON-formatted logs in production, colorized in development
- Service name and environment automatically tagged
- Request context automatically included (request ID, user ID, IP, session ID)

### Log Coverage

- Auth flows (registration, OTP, login, token refresh)
- Wallet operations (creation, funding, trading)
- FX rate fetches and quote generation
- Transaction processing and ledger updates
- Error stack traces with request context

---

## 20) Endpoint Interpretation Assumption

The brief is ambiguous about the distinction between:

- `POST /wallet/convert`
- `POST /wallet/trade`

Assumption used in this implementation:

- `POST /wallet/convert` → quote request
- `POST /wallet/trade` → actual trade/conversion execution

---

## 21) Scalability and Extensibility Notes

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

## 22) Alignment to Assessment + Architecture Decisions

Assumption made for technology choices:

> Other technologies can be used as long as recommended tools are included and architecture/technology decisions are justified. In this solution, the microservices architecture is justified by production realism, clear service boundaries, async workflows, and combined SQL/NoSQL demonstration aligned to role expectations.

Reference for role expectations: [CredPal Backend Developer JD](https://credpal.zohorecruit.com/jobs/Careers/712621000006540011/Backend-Developer)

---

## 23) Current Scope Status

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

## 24) Run Instructions

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

## 25) Repository Layout

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

## 26) Final Notes

This solution is intentionally architected like a real fintech backend: contract-first interfaces, safe transaction handling, asynchronous workflows, and scalable storage patterns.

It is structured for extension and production hardening without requiring foundational redesign.

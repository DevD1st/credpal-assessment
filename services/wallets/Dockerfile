FROM node:24-slim

WORKDIR /app

# 1. Install root workspace dependencies
COPY package*.json ./
COPY packages/common/package.json      ./packages/common/package.json
COPY packages/constants/package.json   ./packages/constants/package.json
COPY packages/proto/package.json       ./packages/proto/package.json
COPY packages/runtime/package.json     ./packages/runtime/package.json
COPY services/wallets/package.json     ./services/wallets/package.json

RUN npm ci

# 2. Copy source needed to build shared packages
COPY tsconfig.json ./
COPY packages/     ./packages/
COPY protobuf/     ./protobuf/
COPY packages/proto/src/ ./packages/proto/src/

# 3. Build shared packages in dependency order
RUN npm run build -w @credpal-fx-trading-app/constants
RUN npm run build -w @credpal-fx-trading-app/proto
RUN npm run build -w @credpal-fx-trading-app/common
RUN npm run build -w @credpal-fx-trading-app/runtime

# 4. Copy service source + runtime assets
COPY services/wallets/ ./services/wallets/
COPY scripts/          ./scripts/
COPY env/              ./env/

EXPOSE 50054

CMD ["npm", "run", "dev", "-w", "@credpal-fx-trading-app/wallets"]

FROM node:24-slim

WORKDIR /app

# 1. Install root workspace dependencies
#    Copy manifests first to leverage layer caching
COPY package*.json ./
COPY packages/common/package.json        ./packages/common/package.json
COPY packages/constants/package.json     ./packages/constants/package.json
COPY packages/proto/package.json         ./packages/proto/package.json
COPY packages/runtime/package.json       ./packages/runtime/package.json
COPY services/accounts/package.json      ./services/accounts/package.json

RUN npm ci

# 2. Copy source needed to build shared packages
COPY tsconfig.json ./
COPY packages/      ./packages/
COPY protobuf/      ./protobuf/
COPY packages/proto/src/ ./packages/proto/src/

# 3. Build shared packages in dependency order (no protoc needed — uses pre-generated files)
RUN npm run build -w @credpal-fx-trading-app/constants
RUN npm run build -w @credpal-fx-trading-app/proto
RUN npm run build -w @credpal-fx-trading-app/common
RUN npm run build -w @credpal-fx-trading-app/runtime

# 4. Copy service source + runtime assets
COPY services/accounts/  ./services/accounts/
COPY scripts/             ./scripts/
COPY env/                 ./env/

EXPOSE 50051

# Dev command — hot reload via nest --watch
# The bind mount in compose overlays the source so edits are picked up live.
CMD ["npm", "run", "dev", "-w", "@credpal-fx-trading-app/accounts"]

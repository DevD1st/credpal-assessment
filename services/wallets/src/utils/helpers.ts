// a simple way to organize config with dot notation
export const getConfig = (key: string) => {
  const config = {
    service: process.env.SERVICE || "wallets",
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    datastores: {
      postgres: {
        isReplicated: false,
        write: {
          host: process.env.POSTGRES_HOST || "localhost",
          port: parseInt(process.env.POSTGRES_PORT || "5432"),
          database: process.env.POSTGRES_DB || "transactease",
          user: process.env.POSTGRES_USER || "transactease",
          password: process.env.POSTGRES_PASSWORD || "transactease_dev",
          ssl: { rejectUnauthorized: false },
        },
      },
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    },
    grpc: {
      url: process.env.WALLETS_SERVICE_URL || "0.0.0.0:50054",
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || "amqp://credpal:credpal@localhost:5672",
      exchange: process.env.RABBITMQ_EXCHANGE || "credpal_events",
      queue: process.env.SERVICE || "wallets",
    },
    exchangeRate: {
      apiKey: process.env.EXCHANGE_RATE_API_KEY || "",
    },
  };
  return key.split(".").reduce((obj, k) => obj?.[k], config as any);
};

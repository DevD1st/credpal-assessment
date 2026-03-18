// a simple way to organize config with dot notation
export const getConfig = (key: string) => {
  const config = {
    service: process.env.SERVICE || "gateway",
    app: {
      port: parseInt(process.env.PORT!) || 3000,
    },
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    auth: {
      tokens: {
        refreshSecret: process.env.REFRESH_TOKEN_SECRET,
        accessSecret: process.env.ACCESS_TOKEN_SECRET,
      },
    },
    datastores: {
      redis: {
        host: process.env.REDIS_HOST || "localhost",
        port: parseInt(process.env.REDIS_PORT || "6379"),
      },
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || "amqp://credpal:credpal@localhost:5672",
      exchange: process.env.RABBITMQ_EXCHANGE || "credpal_events",
      queue: process.env.SERVICE || "gateway",
    },
  };
  return key.split(".").reduce((obj, k) => obj?.[k], config as any);
};

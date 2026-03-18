// a simple way to organize config with dot notation
export const getConfig = (key: string) => {
  const config = {
    service: process.env.SERVICE || "notifications",
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    grpc: {
      url: process.env.NOTIFICATIONS_SERVICE_URL || "0.0.0.0:50053",
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL || "amqp://credpal:credpal@localhost:5672",
      exchange: process.env.RABBITMQ_EXCHANGE || "credpal_events",
      queue: process.env.SERVICE || "notifications",
    },
  };
  return key.split(".").reduce((obj, k) => obj?.[k], config as any);
};

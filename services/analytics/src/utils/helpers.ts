// a simple way to organize config with dot notation
export const getConfig = (key: string) => {
  const config = {
    service: "analytics",
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    // TODO: Analytics uses mongodb
    datastores: {
      mongodb: {},
    },
    grpc: {
      url: process.env.ANALYTICS_SERVICE_URL || "0.0.0.0:50052",
    },
  };
  return key.split(".").reduce((obj, k) => obj?.[k], config as any);
};

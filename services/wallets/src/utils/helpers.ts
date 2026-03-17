// a simple way to organize config with dot notation
export const getConfig = (key: string) => {
  const config = {
    service: "wallets",
    environment: process.env.NODE_ENV || "development",
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    grpc: {
      url: process.env.WALLETS_SERVICE_URL || "0.0.0.0:50054",
    },
  };
  return key.split(".").reduce((obj, k) => obj?.[k], config as any);
};

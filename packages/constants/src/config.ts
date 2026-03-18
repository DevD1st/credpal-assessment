export const RABBITMQ_TOPICS = {
  ACCOUNT_CREATION_REQUEST: "account.creation.request",
  ACCOUNT_CREATION_COMPLETE: "account.creation.complete",
  WALLET_CREATED: "wallet.created",
  WALLET_FUNDED: "wallet.funded",
} as const;

export const REDIS_KEYS = {
  ACCOUNT_VERIFICATION: (phone: string, acctType: string) =>
    `account:verification:${phone}:${acctType}`,
  ACCOUNT_VERIFICATION_EMAIL: (email: string) =>
    `account:verification:email:${email}`,
  REFRESH_TOKEN: (jti: string) => `auth:refresh_token:${jti}`,
  FUND_WALLET: (userId: string, walletId: string, amount: number | string) =>
    `wallet:fund:${userId}:${walletId}:${amount}`,
} as const;

export const BULLMQ_QUEUES = {
  TRANSACTIONS: "{transactions_queue}",
} as const;

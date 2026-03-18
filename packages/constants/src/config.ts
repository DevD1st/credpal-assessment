export const RABBITMQ_TOPICS = {
  ACCOUNT_CREATION_REQUEST: "account.creation.request",
  ACCOUNT_CREATION_COMPLETE: "account.creation.complete",
  WALLET_CREATED: "wallet.created",
  WALLET_FUNDED: "wallet.funded",
  EXCHANGE_RATE_FETCHED: "exchange.rate.fetched",
  CURRENCY_TRADED: "currency.traded",
} as const;

export const REDIS_KEYS = {
  ACCOUNT_VERIFICATION: (phone: string, acctType: string) =>
    `account:verification:${phone}:${acctType}`,
  ACCOUNT_VERIFICATION_EMAIL: (email: string) =>
    `account:verification:email:${email}`,
  REFRESH_TOKEN: (jti: string) => `auth:refresh_token:${jti}`,
  FUND_WALLET: (userId: string, walletId: string, amount: number | string) =>
    `wallet:fund:${userId}:${walletId}:${amount}`,
  GLOBAL_EXCHANGE_RATE: (base: string, target: string) =>
    `exchange-rate:${base}:${target}`,
  USER_QUOTE: (userId: string, base: string, target: string) =>
    `quote:${userId}:${base}:${target}`,
} as const;

export const BULLMQ_QUEUES = {
  TRANSACTIONS: "{transactions_queue}",
} as const;

export enum SupportedCurrencies {
  USD = "USD",
  NGN = "NGN",
  AUD = "AUD",
  GBP = "GBP",
  EUR = "EUR",
  CAD = "CAD",
}

export const RABBITMQ_TOPICS = {
  ACCOUNT_CREATION_REQUEST: 'account.creation.request',
  ACCOUNT_CREATION_COMPLETE: 'account.creation.complete',
  WALLET_CREATED: 'wallet.created',
} as const;

export const REDIS_KEYS = {
  ACCOUNT_VERIFICATION: (phone: string, acctType: string) => `account:verification:${phone}:${acctType}`,
  ACCOUNT_VERIFICATION_EMAIL: (email: string) => `account:verification:email:${email}`,
  REFRESH_TOKEN: (jti: string) => `auth:refresh_token:${jti}`,
} as const;
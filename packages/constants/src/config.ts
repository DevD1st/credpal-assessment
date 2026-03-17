export const RABBITMQ_TOPICS = {
  ACCOUNT_CREATION_REQUEST: 'account.creation.request',
  ACCOUNT_CREATION_COMPLETE: 'account.creation.complete',
} as const;

export const REDIS_KEYS = {
  ACCOUNT_VERIFICATION: (phone: string, acctType: string) => `account:verification:${phone}:${acctType}`,
} as const;
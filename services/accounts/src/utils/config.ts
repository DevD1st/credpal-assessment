export const OTP_EXP_IN_SEC = 15 * 60; // 15min
/**
 * account creation request is saved in redis until account is verified
 * unverified account is deleted after INCOMPLETE_ACCT_CREATION_EXP_IN_SEC
 */
export const INCOMPLETE_ACCT_CREATION_EXP_IN_SEC = 12 * 60 * 60; // 12 hrs

/** Injection token for the RabbitMQ ClientProxy used by the Accounts service */
export const RABBIT_MQ_CLIENT = 'RABBIT_MQ_CLIENT';

/** Queue name the Accounts service publishes to */
export const ACCOUNTS_RMQ_QUEUE = 'accounts_queue';

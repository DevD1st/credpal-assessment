export const OTP_EXP_IN_SEC = 15 * 60; // 15min
/**
 * account creation request is saved in redis until account is verified
 * unverified account is deleted after INCOMPLETE_ACCT_CREATION_EXP_IN_SEC
 */
export const INCOMPLETE_ACCT_CREATION_EXP_IN_SEC = 12 * 60 * 60; // 12 hrs

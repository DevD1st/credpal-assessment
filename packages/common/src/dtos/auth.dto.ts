export class AccountVerificationCacheDto {
  email!: string;
  hashedPassword?: string;
  hashedOtp!: string;
  otpExpDate!: string;
  ipAddress!: string;

  constructor(partial: Partial<AccountVerificationCacheDto>) {
    Object.assign(this, partial);
  }
}

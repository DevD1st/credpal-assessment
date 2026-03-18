export interface FundWalletJobPayload {
  userId: string;
  baseWalletId: string;
  amount: number | string;
  reference: string;
}

export interface FundWalletJobPayload {
  userId: string;
  baseWalletId: string;
  amount: number;
  reference: string;
}

export interface TradeCurrencyJobPayload {
  userId: string;
  baseWalletId: string;
  targetWalletId: string;
  baseAmount: number;
  targetAmount: number;
  exchangeRate: number;
  reference: string;
  quoteId: string;
}

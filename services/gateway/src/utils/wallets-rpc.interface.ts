import { Wallets } from "@credpal-fx-trading-app/proto";
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export interface IRPCWalletsService {
  CreateWallet(
    data: Wallets.CreateWalletInput,
    meta: Metadata,
  ): Observable<Wallets.CreateWalletResponse>;
  GetWallets(
    data: Wallets.GetWalletsInput,
    meta: Metadata,
  ): Observable<Wallets.GetWalletsResponse>;
  FundWallet(
    data: Wallets.FundWalletInput,
    meta: Metadata,
  ): Observable<Wallets.FundWalletResponse>;
  CreateQuote(
    data: Wallets.CreateQuoteInput,
    meta: Metadata,
  ): Observable<Wallets.CreateQuoteResponse>;
  TradeCurrency(
    data: Wallets.TradeCurrencyInput,
    meta: Metadata,
  ): Observable<Wallets.TradeCurrencyResponse>;
}

export interface IRPCFxService {
  FetchExchangeRates(
    data: Wallets.FetchExchangeRatesInput,
    meta: Metadata,
  ): Observable<Wallets.FetchExchangeRatesResponse>;
}

export interface IRPCTransactionService {
  GetTransactions(
    data: Wallets.GetTransactionsInput,
    meta: Metadata,
  ): Observable<Wallets.GetTransactionsResponse>;
}

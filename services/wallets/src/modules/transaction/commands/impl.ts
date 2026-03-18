import { FundWalletJobPayload, TradeCurrencyJobPayload } from "@credpal-fx-trading-app/common";

export class ProcessFundWalletCommand {
  constructor(public readonly payload: FundWalletJobPayload) {}
}

export class ProcessTradeCurrencyCommand {
  constructor(public readonly payload: TradeCurrencyJobPayload) {}
}

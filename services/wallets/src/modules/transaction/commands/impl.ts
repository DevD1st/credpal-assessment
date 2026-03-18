import { FundWalletJobPayload } from "@credpal-fx-trading-app/common";

export class ProcessFundWalletCommand {
  constructor(public readonly payload: FundWalletJobPayload) {}
}

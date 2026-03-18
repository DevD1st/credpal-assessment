import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { CommandBus } from "@nestjs/cqrs";
import {
  BULLMQ_QUEUES,
} from "@credpal-fx-trading-app/constants";
import { FundWalletJobPayload, TradeCurrencyJobPayload } from "@credpal-fx-trading-app/common";
import { FUND_WALLET_JOB, TRADE_CURRENCY_JOB } from "../../../utils/index.js";
import { ProcessFundWalletCommand, ProcessTradeCurrencyCommand } from "../commands/impl.js";

@Processor(BULLMQ_QUEUES.TRANSACTIONS)
export class TransactionWorker extends WorkerHost {
  constructor(private readonly commandBus: CommandBus) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    if (job.name === FUND_WALLET_JOB) {
      await this.commandBus.execute(
        new ProcessFundWalletCommand(job.data as FundWalletJobPayload),
      );
    } else if (job.name === TRADE_CURRENCY_JOB) {
      await this.commandBus.execute(
        new ProcessTradeCurrencyCommand(job.data as TradeCurrencyJobPayload),
      );
    }
  }
}

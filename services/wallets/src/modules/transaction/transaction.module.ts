import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { TransactionRepository } from "./repositories/transaction.repository.js";
import { TRANSACTION_REPOSITORY_TOKEN } from "./repositories/transaction.repository.interface.js";
import { LedgerRepository } from "./repositories/ledger.repository.js";
import { LEDGER_REPOSITORY_TOKEN } from "./repositories/ledger.repository.interface.js";
import { ProcessFundWalletHandler } from "./commands/handlers/process-fund-wallet.handler.js";
import { TransactionWorker } from "./services/transaction.worker.js";
import { RABBIT_MQ_CLIENT } from "../../utils/index.js";
import { getConfig } from "../../utils/index.js";

const CommandHandlers = [ProcessFundWalletHandler];
const QueryHandlers: any[] = [];

@Module({
  imports: [
    CqrsModule,
    ClientsModule.register([
      {
        name: RABBIT_MQ_CLIENT,
        transport: Transport.RMQ,
        options: {
          urls: [getConfig("rabbitmq.url")],
          queue: getConfig("rabbitmq.queue"),
          exchange: getConfig("rabbitmq.exchange"),
          exchangeType: "topic",
          prefetchCount: 1,
          persistent: true,
          wildcards: true,
          noAck: false,
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    TransactionWorker,
    {
      provide: TRANSACTION_REPOSITORY_TOKEN,
      useClass: TransactionRepository,
    },
    {
      provide: LEDGER_REPOSITORY_TOKEN,
      useClass: LedgerRepository,
    },
  ],
  controllers: [],
  exports: [TRANSACTION_REPOSITORY_TOKEN, LEDGER_REPOSITORY_TOKEN],
})
export class TransactionModule {}

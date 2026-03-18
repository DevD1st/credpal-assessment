import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { BullModule } from "@nestjs/bullmq";
import { BULLMQ_QUEUES } from "@credpal-fx-trading-app/constants";
import { WalletRepository } from "./repositories/wallet.repository.js";
import { WALLET_REPOSITORY_TOKEN } from "./repositories/wallet.repository.interface.js";
import { WalletController } from "./controllers/wallet.controller.js";
import { CreateWalletHandler } from "./commands/handlers/create-wallet.handler.js";
import { FundWalletHandler } from "./commands/handlers/fund-wallet.handler.js";
import { GetWalletsHandler } from "./queries/handlers/get-wallets.handler.js";
import { RABBIT_MQ_CLIENT } from "../../utils/index.js";
import { getConfig } from "../../utils/index.js";

const CommandHandlers = [CreateWalletHandler, FundWalletHandler];
const QueryHandlers = [GetWalletsHandler];

@Module({
  imports: [
    CqrsModule,
    BullModule.registerQueue({
      name: BULLMQ_QUEUES.TRANSACTIONS,
    }),
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
    {
      provide: WALLET_REPOSITORY_TOKEN,
      useClass: WalletRepository,
    },
  ],
  controllers: [WalletController],
  exports: [WALLET_REPOSITORY_TOKEN],
})
export class WalletModule {}

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { HttpModule } from "@nestjs/axios";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CreateQuoteHandler } from "./commands/handlers/create-quote.handler.js";
import { FxListener } from "./listeners/fx.listener.js";
import { getConfig, RABBIT_MQ_CLIENT } from "../../utils/index.js";
import { FetchExchangeRatesHandler } from "./queries/handlers/fetch-exchange-rates.handler.js";
import { FxController } from "./controllers/fx.controller.js";

const CommandHandlers = [CreateQuoteHandler];
const QueryHandlers = [FetchExchangeRatesHandler];

@Module({
  imports: [
    CqrsModule,
    HttpModule,
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
  providers: [...CommandHandlers, ...QueryHandlers, FxListener],
  controllers: [FxController],
})
export class FxModule {}

import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { CreateQuoteCommand } from "../impl.js";
import { HttpService } from "@nestjs/axios";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ClientProxy } from "@nestjs/microservices";
import { RABBITMQ_TOPICS, REDIS_KEYS } from "@credpal-fx-trading-app/constants";
import {
  getConfig,
  RABBIT_MQ_CLIENT,
  ExchangeRateResponseDto,
} from "../../../../utils/index.js";
import { v7 as uuidv7 } from "uuid";
import { Decimal } from "decimal.js";

@CommandHandler(CreateQuoteCommand)
export class CreateQuoteHandler implements ICommandHandler<
  CreateQuoteCommand,
  Wallets.CreateQuoteResponse
> {
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(
    command: CreateQuoteCommand,
  ): Promise<Wallets.CreateQuoteResponse> {
    const { request, meta } = command;
    const { baseCurrency, targetCurrency } = request;

    const userId = meta.userId;
    if (!userId) {
      throw new InternalServerErrorException(
        "User identity could not be resolved from request context",
      );
    }

    this.logger.log({
      message: "Processing create quote request",
      userId,
      baseCurrency,
      targetCurrency,
    });

    let rateVal: number | null = null;

    try {
      const apiKey = getConfig("exchangeRate.apiKey");
      if (!apiKey) {
        throw new Error("Exchange rate API key is missing");
      }

      const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${baseCurrency}/${targetCurrency}`;

      const response =
        await this.httpService.axiosRef.get<ExchangeRateResponseDto>(url);

      if (response.data && response.data.result === "success") {
        const dto = response.data;
        rateVal = dto.conversion_rate;

        // Emit internal event for background global caching
        this.eventEmitter.emit(RABBITMQ_TOPICS.EXCHANGE_RATE_FETCHED, dto);

        // Emit to RabbitMQ
        this.rabbitClient.emit(RABBITMQ_TOPICS.EXCHANGE_RATE_FETCHED, {
          baseCurrency: dto.base_code,
          targetCurrency: dto.target_code,
          rate: dto.conversion_rate,
          timestamp: new Date().toISOString(),
        });
      } else {
        throw new Error(
          `External API returned unsuccessful result: ${response.data?.result}`,
        );
      }
    } catch (error) {
      this.logger.warn({
        message:
          "Failed to fetch from external exchange rate API, falling back to cache",
        baseCurrency,
        targetCurrency,
        error: error instanceof Error ? error.message : error,
      });

      // Fallback: Check global cache
      const globalKey = REDIS_KEYS.GLOBAL_EXCHANGE_RATE(
        baseCurrency,
        targetCurrency,
      );
      const cachedData =
        await this.cacheManager.get<ExchangeRateResponseDto>(globalKey);

      if (cachedData && cachedData.conversion_rate) {
        rateVal = cachedData.conversion_rate;
      } else {
        this.logger.error({
          message: "No fallback cache available for exchange rate",
          baseCurrency,
          targetCurrency,
        });
        throw new InternalServerErrorException(
          "Exchange rate is currently unavailable.",
        );
      }
    }

    if (rateVal == null) {
      throw new InternalServerErrorException(
        "Failed to determine conversion rate",
      );
    }

    // Amount scaling and precision: Multiply by 10,000 using Decimal for safe float math
    const scaledAmount = new Decimal(rateVal).times(10000).toNumber();

    const quoteId = uuidv7();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    const quoteObj: Wallets.Quote = {
      id: quoteId,
      baseCurrency,
      targetCurrency,
      amount: scaledAmount, // Use the converted strict integer amount
      expiresAt,
    };

    // Cache user's unique quote properly
    const userQuoteKey = REDIS_KEYS.USER_QUOTE(
      userId,
      baseCurrency,
      targetCurrency,
    );
    await this.cacheManager.set(userQuoteKey, quoteObj, 600000); // 10 min TTL

    this.logger.log({
      message: "Quote generated and cached successfully",
      quoteId,
      userId,
      baseCurrency,
      targetCurrency,
      scaledAmount,
    });

    return {
      data: quoteObj,
    };
  }
}

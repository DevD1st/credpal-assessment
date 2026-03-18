import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject, InternalServerErrorException } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { FetchExchangeRatesQuery } from "../impl.js";
import { HttpService } from "@nestjs/axios";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ClientProxy } from "@nestjs/microservices";
import { RABBITMQ_TOPICS, REDIS_KEYS, SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { getConfig, RABBIT_MQ_CLIENT, ExchangeRateResponseDto } from "../../../../utils/index.js";
import { Decimal } from "decimal.js";

@QueryHandler(FetchExchangeRatesQuery)
export class FetchExchangeRatesHandler
  implements IQueryHandler<FetchExchangeRatesQuery, Wallets.FetchExchangeRatesResponse>
{
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    private readonly httpService: HttpService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly eventEmitter: EventEmitter2,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(query: FetchExchangeRatesQuery): Promise<Wallets.FetchExchangeRatesResponse> {
    const { request, meta } = query;
    const { baseCurrency } = request;

    const apiKey = getConfig("exchangeRate.apiKey");
    if (!apiKey) {
      this.logger.error({ message: "Exchange rate API key is missing from environment" });
      throw new InternalServerErrorException("Configuration error preventing rate fetches.");
    }

    this.logger.log({
      message: "Fetching exchange rates for supported currencies",
      baseCurrency,
      userId: meta.userId,
    });

    const ratesList: Wallets.ExchangeRate[] = [];

    // Loop through all supported Target currencies natively
    for (const targetCurrency of Object.values(SupportedCurrencies)) {
      if (targetCurrency === baseCurrency) {
        continue;
      }

      const globalKey = REDIS_KEYS.GLOBAL_EXCHANGE_RATE(baseCurrency, targetCurrency);
      let rateVal: number | null = null;
      let cachedDto = await this.cacheManager.get<ExchangeRateResponseDto>(globalKey);

      if (cachedDto && cachedDto.conversion_rate) {
        rateVal = cachedDto.conversion_rate;
      } else {
        // Fallback: Perform graceful Axios request for missing cache individually
        try {
          const url = `https://v6.exchangerate-api.com/v6/${apiKey}/pair/${baseCurrency}/${targetCurrency}`;
          const response = await this.httpService.axiosRef.get<ExchangeRateResponseDto>(url);

          if (response.data && response.data.result === "success") {
            const dto = response.data;
            rateVal = dto.conversion_rate;

            // Immediately emit event indicating we just fetched a fresh cache payload for the FxListener to capture via Redis
            this.eventEmitter.emit(RABBITMQ_TOPICS.EXCHANGE_RATE_FETCHED, dto);

            // Broadcast outwards
            this.rabbitClient.emit(RABBITMQ_TOPICS.EXCHANGE_RATE_FETCHED, {
              baseCurrency: dto.base_code,
              targetCurrency: dto.target_code,
              rate: dto.conversion_rate,
              timestamp: new Date().toISOString(),
            });
          } else {
             throw new Error(`Invalid response or non-success code. API Res: ${response.data?.result}`);
          }
        } catch (error) {
          this.logger.warn({
            message: "Failed to fetch exchange rate for currency pair natively from external endpoint",
            baseCurrency,
            targetCurrency,
            error: error instanceof Error ? error.message : error,
          });
          // Gracefully continue to the next SupportedCurrency iteration without throwing out to context scope
          continue; 
        }
      }

      if (rateVal !== null) {
        // Standardize calculation representing 4 dec spaces float math: `rate * 10000`
        const safeAmountScaled = new Decimal(rateVal).times(10000).toNumber();

        const exchangeRateFormat: Wallets.ExchangeRate = {
          baseCurrency,
          targetCurrency,
          exchangeRate: safeAmountScaled,
          exchangeRateWithSpread: safeAmountScaled, // Not deploying random spreads
          percentageSpread: 0,
        };
        
        ratesList.push(exchangeRateFormat);
      }
    }

    return {
      data: {
        exchangeRates: ratesList,
      },
    } as any;
  }
}

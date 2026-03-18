import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { RABBITMQ_TOPICS, REDIS_KEYS } from "@credpal-fx-trading-app/constants";
import { ExchangeRateResponseDto } from "../../../utils/index.js";

@Injectable()
export class FxListener {
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @OnEvent(RABBITMQ_TOPICS.EXCHANGE_RATE_FETCHED)
  async handleExchangeRateFetched(payload: ExchangeRateResponseDto) {
    try {
      const { base_code, target_code } = payload;
      const cacheKey = REDIS_KEYS.GLOBAL_EXCHANGE_RATE(base_code, target_code);
      
      // Cache globally for 2 hours (7200000 milliseconds)
      await this.cacheManager.set(cacheKey, payload, 7200000);

      this.logger.debug({
        message: "Successfully globally cached exchange rate",
        baseCurrency: base_code,
        targetCurrency: target_code,
        rate: payload.conversion_rate,
      });
    } catch (error) {
      this.logger.error({
        message: "Failed to globally cache exchange rate",
        error: error instanceof Error ? error.message : error,
      });
    }
  }
}

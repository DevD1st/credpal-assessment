import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class ExchangeRateDto implements Wallets.ExchangeRate {
  @Expose()
  @ApiProperty()
  baseCurrency: string;

  @Expose()
  @ApiProperty()
  targetCurrency: string;

  @Expose()
  @ApiProperty()
  exchangeRate: number;

  @Expose()
  @ApiProperty()
  exchangeRateWithSpread: number;

  @Expose()
  @ApiProperty()
  percentageSpread: number;
}

export class ExchangeRatesDto implements Wallets.ExchangeRates {
  @Expose()
  @Type(() => ExchangeRateDto)
  @ApiProperty({ type: ExchangeRateDto, isArray: true })
  exchangeRates: ExchangeRateDto[];
}

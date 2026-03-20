import { SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsString } from "class-validator";

export class FetchExchangeRatesDto implements Wallets.FetchExchangeRatesInput {
  @ApiProperty({
    enum: SupportedCurrencies,
    description: "Base currency used to fetch exchange rates",
    example: SupportedCurrencies.USD,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Base currency must be a string" })
  @IsEnum(SupportedCurrencies, {
    message: `Base currency must be one of: ${Object.values(SupportedCurrencies).join(", ")}`,
  })
  baseCurrency: string;
}

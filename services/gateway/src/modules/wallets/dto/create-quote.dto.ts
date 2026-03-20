import { SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsString, NotEquals } from "class-validator";

export class CreateQuoteDto implements Wallets.CreateQuoteInput {
  @ApiProperty({
    enum: SupportedCurrencies,
    description: "Base currency",
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

  @ApiProperty({
    enum: SupportedCurrencies,
    description: "Target currency",
    example: SupportedCurrencies.NGN,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Target currency must be a string" })
  @IsEnum(SupportedCurrencies, {
    message: `Target currency must be one of: ${Object.values(SupportedCurrencies).join(", ")}`,
  })
  @NotEquals("baseCurrency", {
    message: "Target currency must be different from base currency",
  })
  targetCurrency: string;
}

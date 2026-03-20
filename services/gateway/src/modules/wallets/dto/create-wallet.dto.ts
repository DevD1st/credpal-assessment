import { SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsEnum, IsString } from "class-validator";

export class CreateWalletDto implements Wallets.CreateWalletInput {
  @ApiProperty({
    example: SupportedCurrencies.USD,
    enum: SupportedCurrencies,
    description: "Wallet currency",
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Currency must be a string" })
  @IsEnum(SupportedCurrencies, {
    message: `Currency must be one of: ${Object.values(SupportedCurrencies).join(", ")}`,
  })
  currency: string;
}

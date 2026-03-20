import { SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsString,
  Matches,
  Min,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from "class-validator";

function IsDifferentFrom(
  property: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: "isDifferentFrom",
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const relatedPropertyName = args.constraints[0] as string;
          const relatedValue = (args.object as Record<string, unknown>)[
            relatedPropertyName
          ];
          return value !== relatedValue;
        },
      },
    });
  };
}

export class TradeCurrencyDto implements Wallets.TradeCurrencyInput {
  @ApiProperty({
    description: "Quote identifier",
    example: "0195f31c-aea7-7b7c-8706-6f98fa324e2d",
  })
  @IsString({ message: "Quote ID must be a string" })
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: "Quote ID must be a valid UUID",
  })
  quoteId: string;

  @ApiProperty({
    enum: SupportedCurrencies,
    description: "Source currency to debit",
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
    description: "Target currency to credit",
    example: SupportedCurrencies.NGN,
  })
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Target currency must be a string" })
  @IsEnum(SupportedCurrencies, {
    message: `Target currency must be one of: ${Object.values(SupportedCurrencies).join(", ")}`,
  })
  @IsDifferentFrom("baseCurrency", {
    message: "Target currency must be different from base currency",
  })
  targetCurrency: string;

  @ApiProperty({
    description: "Amount in the lowest currency unit",
    example: 5000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: "Amount must be an integer" })
  @Min(1, { message: "Amount must be greater than 0" })
  amount: number;
}

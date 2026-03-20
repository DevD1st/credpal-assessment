import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class FundWalletDto implements Wallets.FundWalletInput {
  @ApiProperty({
    description: "Wallet identifier",
    example: "0195f31c-aea7-7b7c-8706-6f98fa324e2d",
  })
  @IsString({ message: "Wallet ID must be a string" })
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: "Wallet ID must be a valid UUID",
  })
  walletId: string;

  @ApiProperty({
    description: "Amount in the lowest currency unit",
    example: 500000,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: "Amount must be an integer" })
  @Min(1, { message: "Amount must be greater than 0" })
  amount: number;

  @ApiProperty({
    description: "Client-provided idempotency key",
    example: "fund-wallet-0195f31caea7",
    maxLength: 128,
  })
  @IsString({ message: "Idempotency key must be a string" })
  @IsNotEmpty({ message: "Idempotency key is required" })
  @MaxLength(128, { message: "Idempotency key must not exceed 128 characters" })
  idempotencyKey: string;
}

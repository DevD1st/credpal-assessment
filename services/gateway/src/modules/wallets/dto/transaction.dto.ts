import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class TransactionDto implements Wallets.Transaction {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  baseWalletId: string;

  @Expose()
  @ApiProperty()
  targetWalletId: string;

  @Expose()
  @ApiProperty()
  type: string;

  @Expose()
  @ApiProperty()
  baseCurrency: string;

  @Expose()
  @ApiProperty()
  targetCurrency: string;

  @Expose()
  @ApiProperty()
  baseAmount: number;

  @Expose()
  @ApiProperty()
  targetAmount: number;

  @Expose()
  @ApiProperty()
  status: string;

  @Expose()
  @ApiProperty()
  exchangeRate: number;

  @Expose()
  @ApiProperty()
  exchangeRateWithSpread: number;

  @Expose()
  @ApiProperty()
  percentageSpread: number;

  @Expose()
  @ApiProperty()
  reference: string;

  @Expose()
  @ApiProperty()
  createdAt: string;

  @Expose()
  @ApiProperty()
  updatedAt: string;
}

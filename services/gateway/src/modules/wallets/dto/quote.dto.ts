import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class QuoteDto implements Wallets.Quote {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  baseCurrency: string;

  @Expose()
  @ApiProperty()
  targetCurrency: string;

  @Expose()
  @ApiProperty({ description: "Quoted amount in the lowest currency unit" })
  amount: number;

  @Expose()
  @ApiProperty({ description: "Quote expiration time in ISO format" })
  expiresAt: string;
}

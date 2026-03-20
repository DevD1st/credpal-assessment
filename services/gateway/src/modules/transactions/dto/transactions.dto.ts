import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { TransactionDto } from "./transaction.dto.js";

export class TransactionsDto implements Wallets.Transactions {
  @Expose()
  @Type(() => TransactionDto)
  @ApiProperty({ type: [TransactionDto] })
  transactions: TransactionDto[];

  @Expose()
  @ApiProperty()
  total: number;
}

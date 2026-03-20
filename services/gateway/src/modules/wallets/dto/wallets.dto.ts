import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { WalletDto } from "./wallet.dto";

export class WalletsDto implements Wallets.Wallets {
  @Expose()
  @Type(() => WalletDto)
  @ApiProperty({ type: WalletDto, isArray: true })
  wallets: WalletDto[];

  @Expose()
  @ApiProperty({ description: "Total number of wallets matching filter" })
  total: number;
}

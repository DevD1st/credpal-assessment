import { Accounts } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class OTPExpirationDto implements Accounts.OTPExpiration {
  @ApiProperty({ type: String, example: "2026-06-30T12:00:00Z" })
  @Expose()
  expAt: string;
}

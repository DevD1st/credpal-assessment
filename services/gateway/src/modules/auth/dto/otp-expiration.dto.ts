import { Accounts } from "@credpal-fx-trading-app/proto";
import { Expose } from "class-transformer";

export class OTPExpirationDto implements Accounts.OTPExpiration {
  @Expose()
  expAt: string;
}

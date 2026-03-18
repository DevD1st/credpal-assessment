import { Accounts } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class AuthTokenDto implements Accounts.AuthToken {
  @Expose()
  @ApiProperty({ description: "Signed JWT token string" })
  token: string;

  @Expose()
  @ApiProperty({ description: "Token expiry as ISO date string" })
  expiresIn: string;
}

export class AuthCredentialsDto implements Accounts.AuthCredentials {
  @Expose()
  @Type(() => AuthTokenDto)
  @ApiProperty({ type: AuthTokenDto })
  accessToken: AuthTokenDto;

  @Expose()
  @Type(() => AuthTokenDto)
  @ApiProperty({ type: AuthTokenDto })
  refreshToken: AuthTokenDto;
}

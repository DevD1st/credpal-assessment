import { Accounts } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, Length } from "class-validator";

export class VerifyOTPDto implements Accounts.VerifyOTPInput {
  @ApiProperty({
    example: "user@example.com",
    description: "Email address used during registration",
  })
  @IsEmail(undefined, { message: "Invalid email address" })
  email: string;

  @ApiProperty({
    example: "123456",
    description: "OTP code sent to the registered email",
  })
  @IsString()
  @Length(4, 8, { message: "OTP must be between 4 and 8 characters" })
  otp: string;
}

import { Accounts } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginDto implements Accounts.LoginInput {
  @ApiProperty({
    example: "user@example.com",
    description: "Email address",
  })
  @IsEmail(undefined, {
    message: "Invalid email address",
  })
  email: string;

  @ApiProperty({
    example: "password",
    description: "Password",
  })
  @IsString({
    message: "Password must be a string",
  })
  password: string;
}

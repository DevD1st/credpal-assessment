import { Accounts } from "@credpal-fx-trading-app/proto";
import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class RegisterIndividualDto implements Accounts.RegisterAccountInput {
  @ApiProperty({
    example: "[EMAIL_ADDRESS]",
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

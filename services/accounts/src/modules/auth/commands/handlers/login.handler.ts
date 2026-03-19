import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from "@nestjs/cqrs";
import bcrypt from "bcrypt";
import { UnauthorizedError } from "@credpal-fx-trading-app/common";
import { INCORRECT_LOGIN } from "@credpal-fx-trading-app/constants";
import { Accounts } from "@credpal-fx-trading-app/proto";
import { LoginCommand } from "../impl.js";
import { GetAccountByEmailQuery } from "../../../user/queries/impl.js";
import { GenerateAuthTokenForProfileCommand } from "../generate-token.js";

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<
  LoginCommand,
  Accounts.AuthCredentials
> {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: LoginCommand): Promise<Accounts.AuthCredentials> {
    const { request, meta } = command;

    const account = await this.queryBus.execute(
      new GetAccountByEmailQuery(request.email, meta),
    );

    if (!account) throw new UnauthorizedError(INCORRECT_LOGIN);

    const isPasswordValid = await bcrypt.compare(
      request.password,
      account.passwordHash,
    );

    if (!isPasswordValid) throw new UnauthorizedError(INCORRECT_LOGIN);

    return this.commandBus.execute(
      new GenerateAuthTokenForProfileCommand(account, meta),
    );
  }
}

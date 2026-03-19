import {
  CommandBus,
  CommandHandler,
  ICommandHandler,
  QueryBus,
} from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "@credpal-fx-trading-app/common";
import { ITokenMakeup } from "@credpal-fx-trading-app/common";
import { REDIS_KEYS, UNAUTHORIZED } from "@credpal-fx-trading-app/constants";
import { Accounts } from "@credpal-fx-trading-app/proto";
import { RefreshTokenCommand } from "../impl.js";
import { GetAccountByIdQuery } from "../../../user/queries/impl.js";
import { GenerateAuthTokenForProfileCommand } from "../generate-token.js";
import { getConfig } from "../../../../utils/index.js";

@CommandHandler(RefreshTokenCommand)
export class RefreshTokenHandler implements ICommandHandler<
  RefreshTokenCommand,
  Accounts.AuthCredentials
> {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async execute(
    command: RefreshTokenCommand,
  ): Promise<Accounts.AuthCredentials> {
    const { request, meta } = command;

    const refreshTokenSecret =
      getConfig("auth.tokens.refreshSecret") || "refresh_secret";

    let payload: ITokenMakeup;
    try {
      payload = jwt.verify(
        request.refreshToken,
        refreshTokenSecret,
      ) as ITokenMakeup;
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    if (!payload?.jti || payload.type !== "refresh" || !payload.profileId) {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    const tokenState = await this.cacheManager.get<string>(
      REDIS_KEYS.REFRESH_TOKEN(payload.jti),
    );
    if (tokenState !== "VALID") throw new UnauthorizedError(UNAUTHORIZED);

    const account = await this.queryBus.execute(
      new GetAccountByIdQuery(payload.profileId, meta),
    );
    if (!account) throw new UnauthorizedError(UNAUTHORIZED);

    if (account.tokenVersion !== payload.tokenVersion) {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    await this.cacheManager.del(REDIS_KEYS.REFRESH_TOKEN(payload.jti));

    return this.commandBus.execute(
      new GenerateAuthTokenForProfileCommand(account, meta),
    );
  }
}

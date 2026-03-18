import { CommandHandler, ICommandHandler, CommandBus } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GenerateAuthTokenForProfileCommand } from "../generate-token.js";
import { IncrementAuthTokenVersionCommand } from "../../../user/commands/impl.js";
import { Accounts, Common } from "@credpal-fx-trading-app/proto";
import { ITokenMakeup } from "@credpal-fx-trading-app/common";
import { REDIS_KEYS } from "@credpal-fx-trading-app/constants";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { getConfig } from "../../../../utils/index.js";

const REFRESH_TOKEN_EXP_IN_SEC = 30 * 24 * 60 * 60; // 30 days
const ACCESS_TOKEN_EXP_IN_SEC = 15 * 60; // 15 mins

@CommandHandler(GenerateAuthTokenForProfileCommand)
export class GenerateAuthTokenForProfileHandler implements ICommandHandler<GenerateAuthTokenForProfileCommand> {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: GenerateAuthTokenForProfileCommand) {
    const { user, meta } = command;

    const accessTokenSecret =
      getConfig("auth.tokens.accessSecret") || "access_secret";
    const refreshTokenSecret =
      getConfig("auth.tokens.refreshSecret") || "refresh_secret";

    const tokenVersion = (user.tokenVersion || 0) + 1;

    const refreshToken: ITokenMakeup = {
      type: "refresh",
      jti: uuidv4(),
      acctType: "USER",
      profileId: user.id,
      tokenVersion: tokenVersion,
    };

    const accessToken: ITokenMakeup = {
      type: "access",
      jti: uuidv4(),
      acctType: "USER",
      profileId: user.id,
      tokenVersion: tokenVersion,
      r_jti: refreshToken.jti,
    };

    const refreshTokenTTL = REFRESH_TOKEN_EXP_IN_SEC * 1000;
    const accessTokenTTL = ACCESS_TOKEN_EXP_IN_SEC * 1000;

    const signedRefreshToken = jwt.sign(refreshToken, refreshTokenSecret, {
      expiresIn: REFRESH_TOKEN_EXP_IN_SEC,
    });
    const signedAccessToken = jwt.sign(accessToken, accessTokenSecret, {
      expiresIn: ACCESS_TOKEN_EXP_IN_SEC,
    });

    await this.cacheManager.set(
      REDIS_KEYS.REFRESH_TOKEN(refreshToken.jti),
      "VALID",
      REFRESH_TOKEN_EXP_IN_SEC * 1000,
    );

    // Persist the new tokenVersion to the DB so that:
    // - The auth guard can compare the token's `tokenVersion` claim against the DB value.
    // - Any token issued before this login (with an older version) will automatically fail
    //   on the next authenticated request, effectively invalidating all prior sessions.
    await this.commandBus.execute(
      new IncrementAuthTokenVersionCommand(user.id, meta),
    );

    return {
      accessToken: {
        token: signedAccessToken,
        expiresIn: new Date(Date.now() + accessTokenTTL).toISOString(),
      },
      refreshToken: {
        token: signedRefreshToken,
        expiresIn: new Date(Date.now() + refreshTokenTTL).toISOString(),
      },
    } as Accounts.AuthCredentials;
  }
}

import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import jwt from "jsonwebtoken";
import {
  ITokenMakeup,
  UnauthorizedError,
} from "@credpal-fx-trading-app/common";
import { REDIS_KEYS, UNAUTHORIZED } from "@credpal-fx-trading-app/constants";
import { ValidateRefreshTokenQuery, ValidateTokenResult } from "../impl.js";
import { getConfig } from "../../../../utils/index.js";

@QueryHandler(ValidateRefreshTokenQuery)
export class ValidateRefreshTokenHandler implements IQueryHandler<
  ValidateRefreshTokenQuery,
  ValidateTokenResult
> {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async execute(
    query: ValidateRefreshTokenQuery,
  ): Promise<ValidateTokenResult> {
    const refreshTokenSecret =
      getConfig("auth.tokens.refreshSecret") || "refresh_secret";

    let payload: ITokenMakeup;
    try {
      payload = jwt.verify(
        query.input.token,
        refreshTokenSecret,
      ) as ITokenMakeup;
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    if (payload.type !== "refresh" || !payload.profileId || !payload.jti) {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    const tokenState = await this.cacheManager.get<string>(
      REDIS_KEYS.REFRESH_TOKEN(payload.jti),
    );

    if (tokenState !== "VALID") throw new UnauthorizedError(UNAUTHORIZED);

    // We could also validate tokenVersion against a source of truth,
    // but we intentionally skip that here to keep this flow simple.
    return payload;
  }
}

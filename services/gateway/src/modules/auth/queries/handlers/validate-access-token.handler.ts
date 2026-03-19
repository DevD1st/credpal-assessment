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
import { ValidateAccessTokenQuery, ValidateTokenResult } from "../impl.js";
import { getConfig } from "../../../../utils/index.js";

@QueryHandler(ValidateAccessTokenQuery)
export class ValidateAccessTokenHandler implements IQueryHandler<
  ValidateAccessTokenQuery,
  ValidateTokenResult
> {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  async execute(query: ValidateAccessTokenQuery): Promise<ValidateTokenResult> {
    const accessTokenSecret =
      getConfig("auth.tokens.accessSecret") || "access_secret";

    let payload: ITokenMakeup;
    try {
      payload = jwt.verify(
        query.input.token,
        accessTokenSecret,
      ) as ITokenMakeup;
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    if (payload.type !== "access" || !payload.profileId || !payload.r_jti) {
      throw new UnauthorizedError(UNAUTHORIZED);
    }

    const tokenState = await this.cacheManager.get<string>(
      REDIS_KEYS.REFRESH_TOKEN(payload.r_jti),
    );

    if (tokenState !== "VALID") throw new UnauthorizedError(UNAUTHORIZED);

    // We could also validate tokenVersion against a source of truth,
    // but we intentionally skip that here to keep this flow simple.
    return payload;
  }
}

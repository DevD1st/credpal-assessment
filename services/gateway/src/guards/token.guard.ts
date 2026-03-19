import { UnauthorizedError } from "@credpal-fx-trading-app/common";
import { UNAUTHORIZED } from "@credpal-fx-trading-app/constants";
import { getContextHttp } from "@credpal-fx-trading-app/runtime";
import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { Request } from "express";
import {
  ValidateAccessTokenQuery,
  ValidateRefreshTokenQuery,
} from "../modules/auth/queries/impl.js";

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const reqContext = getContextHttp(request);

      const authHeader = request.headers.authorization;
      const token = authHeader?.split(" ")[1];
      if (!token) throw new UnauthorizedError(UNAUTHORIZED);

      const decodedToken = await this.queryBus.execute(
        new ValidateAccessTokenQuery({ token }, reqContext),
      );

      request.userId = decodedToken.profileId;
      request.rJti = decodedToken.r_jti;
      request.tokenVersion = decodedToken.tokenVersion;
      request.acctType = decodedToken.acctType;

      return true;
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }
  }
}

@Injectable()
export class RefreshTokenGuard implements CanActivate {
  constructor(private readonly queryBus: QueryBus) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      const reqContext = getContextHttp(request);

      const authHeader = request.headers.authorization;
      const token = authHeader?.split(" ")[1];
      if (!token) throw new UnauthorizedError(UNAUTHORIZED);

      const decodedToken = await this.queryBus.execute(
        new ValidateRefreshTokenQuery({ token }, reqContext),
      );

      request.userId = decodedToken.profileId;
      request.rJti = decodedToken.jti;
      request.tokenVersion = decodedToken.tokenVersion;
      request.acctType = decodedToken.acctType;

      return true;
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }
  }
}

@Injectable()
export class UserGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest<Request>();
      return request.acctType === "USER";
    } catch {
      throw new UnauthorizedError(UNAUTHORIZED);
    }
  }
}

import { ClientMetadata } from "@credpal-fx-trading-app/common";
import { User } from "../entities/user.entity.js";

export class IsEmailUsedForAccountQuery {
  constructor(
    public readonly email: string,
    public readonly meta: ClientMetadata,
  ) {}
}

export class GetAccountByEmailQuery {
  constructor(
    public readonly email: string,
    public readonly meta: ClientMetadata,
  ) {}
}

export type GetAccountByEmailQueryResult = User | null;

export class GetAccountByIdQuery {
  constructor(
    public readonly id: string,
    public readonly meta: ClientMetadata,
  ) {}
}

export type GetAccountByIdQueryResult = User | null;

import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  GetAccountByEmailQuery,
  GetAccountByEmailQueryResult,
} from "../impl.js";
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from "../../repositories/user.repository.interface.js";

@QueryHandler(GetAccountByEmailQuery)
export class GetAccountByEmailHandler implements IQueryHandler<
  GetAccountByEmailQuery,
  GetAccountByEmailQueryResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: GetAccountByEmailQuery,
  ): Promise<GetAccountByEmailQueryResult> {
    return this.userRepository.findOne({ where: { email: query.email } });
  }
}

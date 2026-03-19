import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetAccountByIdQuery, GetAccountByIdQueryResult } from "../impl.js";
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from "../../repositories/user.repository.interface.js";

@QueryHandler(GetAccountByIdQuery)
export class GetAccountByIdHandler implements IQueryHandler<
  GetAccountByIdQuery,
  GetAccountByIdQueryResult
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(
    query: GetAccountByIdQuery,
  ): Promise<GetAccountByIdQueryResult> {
    return this.userRepository.findById(query.id);
  }
}

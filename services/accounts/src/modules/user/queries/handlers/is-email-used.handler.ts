import { IQueryHandler, QueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { IsEmailUsedForAccountQuery } from "../impl.js";
import {
  IUserRepository,
  USER_REPOSITORY_TOKEN,
} from "../../repositories/user.repository.interface.js";

@QueryHandler(IsEmailUsedForAccountQuery)
export class IsEmailUsedForAccountHandler implements IQueryHandler<
  IsEmailUsedForAccountQuery,
  boolean
> {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN)
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(query: IsEmailUsedForAccountQuery): Promise<boolean> {
    const isUsed = await this.userRepository.findOne({
      where: { email: query.email },
    });
    return !!isUsed;
  }
}

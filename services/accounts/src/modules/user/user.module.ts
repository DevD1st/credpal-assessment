import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { IsEmailUsedForAccountHandler } from "./queries/handlers/is-email-used.handler.js";
import { CreateUserHandler } from "./commands/handlers/create-user.handler.js";
import { IncrementAuthTokenVersionHandler } from "./commands/handlers/increment-token-version.handler.js";
import { UserRepository } from "./repositories/user.repository.js";
import { USER_REPOSITORY_TOKEN } from "./repositories/user.repository.interface.js";

const CommandHandlers: any[] = [CreateUserHandler, IncrementAuthTokenVersionHandler];
const QueryHandlers: any[] = [IsEmailUsedForAccountHandler];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: USER_REPOSITORY_TOKEN,
      useClass: UserRepository,
    },
  ],
  controllers: [],
  exports: [USER_REPOSITORY_TOKEN],
})
export class UserModule {}

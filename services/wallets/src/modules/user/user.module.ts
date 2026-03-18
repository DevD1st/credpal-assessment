import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { UserRepository } from "./repositories/user.repository.js";
import { USER_REPOSITORY_TOKEN } from "./repositories/user.repository.interface.js";

const CommandHandlers: any[] = [];
const QueryHandlers: any[] = [];

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

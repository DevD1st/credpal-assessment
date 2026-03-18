import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

const CommandHandlers: [] = [];
const QueryHandlers: [] = [];

@Module({
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  controllers: [],
})
export class UserModule {}

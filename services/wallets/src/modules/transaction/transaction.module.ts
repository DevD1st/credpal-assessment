import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";

const CommandHandlers: any[] = [];
const QueryHandlers: any[] = [];

@Module({
  imports: [CqrsModule],
  providers: [...CommandHandlers, ...QueryHandlers],
  controllers: [],
})
export class TransactionModule {}

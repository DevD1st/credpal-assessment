import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { TransactionRepository } from "./repositories/transaction.repository.js";
import { TRANSACTION_REPOSITORY_TOKEN } from "./repositories/transaction.repository.interface.js";
import { LedgerRepository } from "./repositories/ledger.repository.js";
import { LEDGER_REPOSITORY_TOKEN } from "./repositories/ledger.repository.interface.js";

const CommandHandlers: any[] = [];
const QueryHandlers: any[] = [];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: TRANSACTION_REPOSITORY_TOKEN,
      useClass: TransactionRepository,
    },
    {
      provide: LEDGER_REPOSITORY_TOKEN,
      useClass: LedgerRepository,
    },
  ],
  controllers: [],
  exports: [TRANSACTION_REPOSITORY_TOKEN, LEDGER_REPOSITORY_TOKEN],
})
export class TransactionModule {}

import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { WalletRepository } from "./repositories/wallet.repository.js";
import { WALLET_REPOSITORY_TOKEN } from "./repositories/wallet.repository.interface.js";

const CommandHandlers: any[] = [];
const QueryHandlers: any[] = [];

@Module({
  imports: [CqrsModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    {
      provide: WALLET_REPOSITORY_TOKEN,
      useClass: WalletRepository,
    },
  ],
  controllers: [],
  exports: [WALLET_REPOSITORY_TOKEN],
})
export class WalletModule {}

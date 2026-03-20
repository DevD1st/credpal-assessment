import {
  BaseError,
  ClientMetadata,
  convertClientMetaToRPCMeta,
} from "@credpal-fx-trading-app/common";
import { ContextHttp } from "@credpal-fx-trading-app/runtime";
import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ClientGrpc } from "@nestjs/microservices";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { lastValueFrom } from "rxjs";
import { plainToInstance } from "class-transformer";
import { AccessTokenGuard, UserGuard } from "src/guards/token.guard";
import { IRPCTransactionsService, RPC_WALLETS_SERVICE } from "src/utils";
import { GetTransactionsDto } from "../dto/get-transactions.dto.js";
import { TransactionsDto } from "../dto/transactions.dto.js";

@ApiTags("Transactions")
@Controller({ path: "transactions", version: "1" })
export class TransactionsController {
  private transactionsService: IRPCTransactionsService;

  constructor(
    @Inject(RPC_WALLETS_SERVICE) private readonly walletssClient: ClientGrpc,
  ) {
    this.transactionsService =
      this.walletssClient.getService<IRPCTransactionsService>(
        "TransactionsService",
      );
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Get transactions" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Transactions fetched successfully",
    type: TransactionsDto,
  })
  async getTransactions(
    @Query() input: GetTransactionsDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.transactionsService.GetTransactions(
        input,
        convertClientMetaToRPCMeta(ctx),
      ),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(TransactionsDto, data, {
      excludeExtraneousValues: true,
    });
  }
}

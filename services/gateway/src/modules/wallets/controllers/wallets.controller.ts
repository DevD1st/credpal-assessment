import {
  BaseError,
  ClientMetadata,
  convertClientMetaToRPCMeta,
} from "@credpal-fx-trading-app/common";
import { ContextHttp } from "@credpal-fx-trading-app/runtime";
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
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
import { IRPCWalletsService, RPC_WALLETS_SERVICE } from "src/utils";
import { CreateWalletDto } from "../dto/create-wallet.dto";
import { WalletDto } from "../dto/wallet.dto";
import { GetWalletsDto } from "../dto/get-wallets.dto";
import { WalletsDto } from "../dto/wallets.dto";
import { FundWalletDto } from "../dto/fund-wallet.dto";
import { CreateQuoteDto } from "../dto/create-quote.dto";
import { QuoteDto } from "../dto/quote.dto";
import { TradeCurrencyDto } from "../dto/trade-currency.dto";
import { TransactionDto } from "../dto/transaction.dto";

@ApiTags("Wallet")
@Controller({ path: "wallet", version: "1" })
export class WalletsController {
  private walletsService: IRPCWalletsService;

  constructor(
    @Inject(RPC_WALLETS_SERVICE) private readonly walletssClient: ClientGrpc,
  ) {
    this.walletsService =
      this.walletssClient.getService<IRPCWalletsService>("WalletsService");
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Create wallet" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Wallet created successfully",
    type: WalletDto,
  })
  async createWallet(
    @Body() input: CreateWalletDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.walletsService.CreateWallet(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(WalletDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Get wallets" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Wallets fetched successfully",
    type: WalletsDto,
  })
  async getWallets(
    @Query() input: GetWalletsDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.walletsService.GetWallets(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(WalletsDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("fund")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Fund wallet" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Wallet funding request accepted",
    type: WalletDto,
  })
  async fundWallet(
    @Body() input: FundWalletDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.walletsService.FundWallet(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(WalletDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("convert")
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Create quote" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Quote created successfully",
    type: QuoteDto,
  })
  async createQuote(
    @Body() input: CreateQuoteDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.walletsService.CreateQuote(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(QuoteDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("trade")
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Trade currency" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Currency trade accepted",
    type: TransactionDto,
  })
  async tradeCurrency(
    @Body() input: TradeCurrencyDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.walletsService.TradeCurrency(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(TransactionDto, data, {
      excludeExtraneousValues: true,
    });
  }
}

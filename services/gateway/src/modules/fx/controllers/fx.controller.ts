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
import { plainToInstance } from "class-transformer";
import { lastValueFrom } from "rxjs";
import { AccessTokenGuard, UserGuard } from "src/guards/token.guard";
import { IRPCFxService, RPC_WALLETS_SERVICE } from "src/utils";
import { ExchangeRatesDto } from "../dto/exchange-rates.dto";
import { FetchExchangeRatesDto } from "../dto/fetch-exchange-rates.dto";

@ApiTags("FX")
@Controller({ path: "fx", version: "1" })
export class FxController {
  private fxService: IRPCFxService;

  constructor(
    @Inject(RPC_WALLETS_SERVICE) private readonly walletsClient: ClientGrpc,
  ) {
    this.fxService = this.walletsClient.getService<IRPCFxService>("FxService");
  }

  @Get("rates")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("Bearer")
  @UseGuards(AccessTokenGuard, UserGuard)
  @ApiOperation({ summary: "Fetch exchange rates" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Exchange rates fetched successfully",
    type: ExchangeRatesDto,
  })
  async fetchExchangeRates(
    @Query() input: FetchExchangeRatesDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.fxService.FetchExchangeRates(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(ExchangeRatesDto, data, {
      excludeExtraneousValues: true,
    });
  }
}

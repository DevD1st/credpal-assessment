import {
  BaseError,
  ClientMetadata,
  convertClientMetaToRPCMeta,
} from "@credpal-fx-trading-app/common";
import { ContextHttp } from "@credpal-fx-trading-app/runtime";
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { ClientGrpc } from "@nestjs/microservices";
import {
  extractBearerToken,
  IRPCAuthService,
  RPC_ACCOUNTS_SERVICE,
} from "../../../utils/index.js";
import { RegisterIndividualDto } from "../dto/register-individual.dto.js";
import { OTPExpirationDto } from "../dto/otp-expiration.dto.js";
import { VerifyOTPDto } from "../dto/verify-otp.dto.js";
import { AuthCredentialsDto } from "../dto/auth-credentials.dto.js";
import { LoginDto } from "../dto/login.dto.js";
import { lastValueFrom } from "rxjs";
import { plainToInstance } from "class-transformer";
import { Request } from "express";
import { RefreshTokenGuard, UserGuard } from "../../../guards/token.guard.js";

@ApiTags("Authentication")
@Controller({ path: "auth", version: "1" })
export class AuthController {
  private authService: IRPCAuthService;

  constructor(
    @Inject(RPC_ACCOUNTS_SERVICE) private readonly accountsClient: ClientGrpc,
  ) {
    this.authService =
      this.accountsClient.getService<IRPCAuthService>("AuthService");
  }

  @Post("register/individual")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Register a new user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "User successfully registered. Verify OTP to continue account createion.  To resend OTP, hit this endpont by resending all data (again)",
    type: OTPExpirationDto,
  })
  async registerIndividual(
    @Body() input: RegisterIndividualDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.authService.RegisterAccount(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(OTPExpirationDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("verify-otp")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Verify OTP and complete account creation" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      "OTP verified successfully. Returns access and refresh tokens.",
    type: AuthCredentialsDto,
  })
  async verifyOTP(
    @Body() input: VerifyOTPDto,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const result = await lastValueFrom(
      this.authService.VerifyOTP(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(AuthCredentialsDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login user" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Login successful. Returns access and refresh tokens.",
    type: AuthCredentialsDto,
  })
  async login(@Body() input: LoginDto, @ContextHttp() ctx: ClientMetadata) {
    const result = await lastValueFrom(
      this.authService.Login(input, convertClientMetaToRPCMeta(ctx)),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(AuthCredentialsDto, data, {
      excludeExtraneousValues: true,
    });
  }

  @Post("refresh-token")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth("Bearer")
  @UseGuards(RefreshTokenGuard, UserGuard)
  @ApiOperation({ summary: "Refresh access and refresh tokens" })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      "Refresh successful. Returns a new access token and refresh token.",
    type: AuthCredentialsDto,
  })
  async refreshToken(
    @Req() request: Request,
    @ContextHttp() ctx: ClientMetadata,
  ) {
    const refreshToken = extractBearerToken(request.headers.authorization);

    const result = await lastValueFrom(
      this.authService.RefreshToken(
        { refreshToken },
        convertClientMetaToRPCMeta(ctx),
      ),
    );

    if (result.error) {
      const { code, message, statusCode, details } = result.error;
      throw new BaseError(message, code, statusCode, details);
    }

    const data = result.data!;
    return plainToInstance(AuthCredentialsDto, data, {
      excludeExtraneousValues: true,
    });
  }
}

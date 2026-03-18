import {
  CommandHandler,
  ICommandHandler,
  CommandBus,
  QueryBus,
} from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import {
  LOGGING_SERVICE_TOKEN,
  LoggingService,
} from "@credpal-fx-trading-app/runtime";
import { VerifyOTPCommand } from "../impl.js";
import { CreateUserCommand } from "../../../user/commands/impl.js";
import { IsEmailUsedForAccountQuery } from "../../../user/queries/impl.js";
import { GenerateAuthTokenForProfileCommand } from "../generate-token.js";
import { ValidationError, ConflictError } from "@credpal-fx-trading-app/common";
import { AccountVerificationCacheDto } from "@credpal-fx-trading-app/common";
import {
  REDIS_KEYS,
  RABBITMQ_TOPICS,
  DUPLICATE_EMAIL,
  INVALID_OTP,
} from "@credpal-fx-trading-app/constants";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { ClientProxy } from "@nestjs/microservices";
import bcrypt from "bcrypt";
import { v7 as uuidv7 } from "uuid";
import { Accounts } from "@credpal-fx-trading-app/proto";
import { RABBIT_MQ_CLIENT } from "../../../../utils/index.js";
import { getConfig } from "../../../../utils/index.js";

@CommandHandler(VerifyOTPCommand)
export class VerifyOTPHandler implements ICommandHandler<
  VerifyOTPCommand,
  Accounts.AuthCredentialsResponse
> {
  constructor(
    @Inject(LOGGING_SERVICE_TOKEN) private readonly logger: LoggingService,
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(command: VerifyOTPCommand) {
    const { request, meta } = command;
    const cacheKey = REDIS_KEYS.ACCOUNT_VERIFICATION_EMAIL(request.email);

    const creationReq = await this.cacheManager.get<string>(cacheKey);
    if (!creationReq) throw new ValidationError(INVALID_OTP);

    const creationReqObj = JSON.parse(creationReq);
    const creationReqDto = new AccountVerificationCacheDto(creationReqObj);

    if (new Date(creationReqDto.otpExpDate) < new Date()) {
      throw new ValidationError(INVALID_OTP);
    }

    let isOtpValid = await bcrypt.compare(
      request.otp,
      creationReqDto.hashedOtp,
    );

    // Allow master OTP in non-production environments for QA / dev testing.
    // We always log a warning so usage is traceable in logs.
    if (
      !isOtpValid &&
      !getConfig("isProduction") &&
      request.otp === getConfig("masterOTP")
    ) {
      this.logger.warn(
        `Master OTP used to verify account for email: ${creationReqDto.email} — IP: ${creationReqDto.ipAddress}`,
      );
      isOtpValid = true;
    }
    if (!isOtpValid) throw new ValidationError(INVALID_OTP);

    const isEmailUsed = await this.queryBus.execute(
      new IsEmailUsedForAccountQuery(creationReqDto.email, meta),
    );
    if (isEmailUsed) throw new ConflictError(DUPLICATE_EMAIL);

    const profileId = uuidv7();

    const profile = await this.commandBus.execute(
      new CreateUserCommand(
        {
          id: profileId,
          email: creationReqDto.email,
          hashedPassword: creationReqDto.hashedPassword,
          isVerified: true,
        },
        meta,
      ),
    );

    if (!profile) throw new Error("Could not create profile");

    const auth = await this.commandBus.execute(
      new GenerateAuthTokenForProfileCommand(profile, meta),
    );

    this.rabbitClient.emit(RABBITMQ_TOPICS.ACCOUNT_CREATION_COMPLETE, {
      profileId: profile.id,
      email: profile.email,
    });

    await this.cacheManager.del(cacheKey);

    return auth;
  }
}

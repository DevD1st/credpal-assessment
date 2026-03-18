import { CommandHandler, ICommandHandler, QueryBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RegisterAccountCommand } from '../impl.js';
import {
  generateOTPCode,
  ConflictError,
} from '@credpal-fx-trading-app/common';
import { AccountVerificationCacheDto } from '@credpal-fx-trading-app/common';
import { REDIS_KEYS, RABBITMQ_TOPICS, DUPLICATE_EMAIL } from '@credpal-fx-trading-app/constants';
import { IsEmailUsedForAccountQuery } from '../../../user/queries/impl.js';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ClientProxy } from '@nestjs/microservices';
import bcrypt from 'bcrypt';
import { Accounts } from '@credpal-fx-trading-app/proto';
import {
  OTP_EXP_IN_SEC,
  INCOMPLETE_ACCT_CREATION_EXP_IN_SEC,
  RABBIT_MQ_CLIENT,
} from '../../../../utils/index.js';

@CommandHandler(RegisterAccountCommand)
export class RegisterAccountHandler
  implements ICommandHandler<RegisterAccountCommand, Accounts.OTPExpiration>
{
  constructor(
    private readonly queryBus: QueryBus,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    @Inject(RABBIT_MQ_CLIENT) private readonly rabbitClient: ClientProxy,
  ) {}

  async execute(command: RegisterAccountCommand) {
    const { request, meta } = command;

    const isEmailUsed = await this.queryBus.execute(
      new IsEmailUsedForAccountQuery(request.email, meta),
    );
    if (isEmailUsed) throw new ConflictError(DUPLICATE_EMAIL);

    const otp = generateOTPCode();
    const hashedOtp = await bcrypt.hash(otp, 12);
    const ttl = OTP_EXP_IN_SEC * 1000;
    const otpExpDate = new Date(Date.now() + ttl).toISOString();

    const hashedPassword = await bcrypt.hash(request.password, 12);

    const dto = new AccountVerificationCacheDto({
      email: request.email,
      hashedPassword,
      hashedOtp,
      otpExpDate,
      ipAddress: meta.ip || 'unknown',
    });

    await this.cacheManager.set(
      REDIS_KEYS.ACCOUNT_VERIFICATION_EMAIL(request.email),
      JSON.stringify(dto),
      INCOMPLETE_ACCT_CREATION_EXP_IN_SEC * 1000,
    );

    this.rabbitClient.emit(RABBITMQ_TOPICS.ACCOUNT_CREATION_REQUEST, {
      email: request.email,
      otp,
      otpExp: new Date(Date.now() + ttl),
    });

    return {
      expAt: otpExpDate,
    };
  }
}

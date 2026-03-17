import { DynamicModule, Global, Module, type Provider } from '@nestjs/common';
import { LOGGING_SERVICE_TOKEN } from '../constants.js';
import { LoggingService } from '../services/logging.service.js';
import type { LoggerOptions } from '@credpal-fx-trading-app/common';

@Global()
@Module({})
export class LoggingModule {
  static register(options: LoggerOptions): DynamicModule {
    const loggingProvider: Provider = {
      provide: LOGGING_SERVICE_TOKEN,
      useFactory: () => {
        return new LoggingService(options);
      },
    };

    return {
      module: LoggingModule,
      providers: [loggingProvider],
      exports: [loggingProvider],
    };
  }
}

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { getLogger, type Logger, type LoggerOptions } from '@credpal-fx-trading-app/common';

@Injectable()
export class LoggingService implements NestLoggerService {
  private logger: Logger;

  constructor(options: LoggerOptions) {
    this.logger = getLogger(options);
  }

  log(message: any, ...optionalParams: any[]) {
    this.logger.info(message, ...optionalParams);
  }

  error(message: any, ...optionalParams: any[]) {
    this.logger.error(message, ...optionalParams);
  }

  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn(message, ...optionalParams);
  }

  debug(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  verbose(message: any, ...optionalParams: any[]) {
    this.logger.debug(message, ...optionalParams);
  }

  getLogger(): Logger {
    return this.logger;
  }
}

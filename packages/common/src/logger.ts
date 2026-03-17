import winston from 'winston';

export enum LogLevels {
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
}

export interface LoggerOptions {
  level: LogLevels;
  service: string;
  environment?: string;
}

export const getDefaultLoggerOpts = (getConfig: (key: string) => any): LoggerOptions => {
  return {
    level: getConfig('isDevelopment') ? LogLevels.debug : LogLevels.info,
    service: getConfig('service'),
    environment: getConfig('environment') || 'development',
  };
};

export const getLogger = (options: LoggerOptions) => {
  const baseFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true })
  );

  const consoleTransport = new winston.transports.Console({
    format: options.environment === 'development' 
      ? winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
            return `${timestamp} [${service}] ${level}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''}`;
          }),
        )
      : winston.format.json() 
  });

  return winston.createLogger({
    level: options.level,
    defaultMeta: {
      service: options.service,
      environment: options.environment,
    },
    format: baseFormat,
    transports: [consoleTransport],
  });
};

export type Logger = winston.Logger;

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { BaseError } from '@credpal-fx-trading-app/common';
import { Common } from '@credpal-fx-trading-app/proto';


// TODO: this should use the logger from @credpal-fx-trading-app/common
@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let responseBody = {
      statusCode: 500,
      message: 'Internal server error',
      code: 'INTERNAL_SERVER_ERROR',
      details: [] as any[],
    } as Common.Error;

    if (exception instanceof BaseError) {
      httpStatus = exception.statusCode;
      responseBody.statusCode = httpStatus;
      responseBody.message = exception.message;
      responseBody.code = exception.code;
      responseBody.details = exception.details || [];

      this.logger.warn(`Business Error: ${exception.message} (${exception.code})`);
    } else if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      responseBody.statusCode = httpStatus;
      responseBody.code = `HTTP_${httpStatus}`;

      // Handle ValidationPipe's array of errors
      if (typeof response === 'object' && response !== null) {
        const resObj = response as any;
        responseBody.message = resObj.message || exception.message;
        responseBody.details = Array.isArray(resObj.message) ? resObj.message : [];
        if (resObj.error) responseBody.code = resObj.error.toUpperCase().replace(/\s/g, '_');
      } else {
        responseBody.message = exception.message;
      }

      this.logger.warn(`Http Exception: ${responseBody.message}`);
    } else {
      this.logger.error(`CRITICAL SYSTEM ERROR:`, exception);
    }

    // take the first message out of the messsage to ensure it is always string
    if (Array.isArray(responseBody.message)) {
      this.logger.error(`ARRAY MESSAGE: ${JSON.stringify(responseBody)}`);

      responseBody.message =
        typeof responseBody.message[0] === 'string' ? responseBody.message[0] : 'Internal server error';
      if (Array.isArray(responseBody.message)) responseBody.statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}

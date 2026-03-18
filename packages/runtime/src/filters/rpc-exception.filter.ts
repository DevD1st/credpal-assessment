import { Catch, RpcExceptionFilter, ArgumentsHost } from "@nestjs/common";
import {
  BaseError,
  getDefaultLoggerOpts,
  getLogger,
  Logger,
} from "@credpal-fx-trading-app/common";
import { Observable, of } from "rxjs";

@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter {
  private logger: Logger;

  constructor() {
    this.logger = getLogger(
      getDefaultLoggerOpts((key) =>
        key === "environment"
          ? process.env.ENVIRONMENT || "development"
          : "GrpcExceptionFilter",
      ),
    );
  }

  catch(exception: any, host: ArgumentsHost): Observable<any> {
    let errorBody;
    if (exception instanceof BaseError) {
      this.logger.warn(`Business Error: ${exception.message}`);

      errorBody = {
        code: exception.code,
        message: exception.message,
        statusCode: exception.statusCode,
        details: exception.details,
      };
    } else {
      this.logger.error(`System Crash: ${exception.message}`, exception.stack);

      // Mask the internal details for security, return a generic 500
      errorBody = {
        code: "INTERNAL_SERVER_ERROR",
        message: "An internal server error occurred",
        statusCode: 500,
        details: [],
      };
    }

    return of({
      error: errorBody,
    });
  }
}

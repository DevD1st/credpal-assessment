import { Catch, RpcExceptionFilter, ArgumentsHost } from "@nestjs/common";
import { BaseError } from "@credpal-fx-trading-app/common";
import { Observable, of, throwError } from "rxjs";
import { LoggingService } from "../services/logging.service";

@Catch()
export class GrpcExceptionFilter implements RpcExceptionFilter {
  constructor(private readonly logger: LoggingService) {}

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

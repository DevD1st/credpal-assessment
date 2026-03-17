import { Common } from '@credpal-fx-trading-app/proto';

export class BaseError extends Error implements Common.Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details: Common.ErrorDetail[] = [],
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class BadRequestError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'VALIDATION_ERROR', 400, details);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'NOT_FOUND', 404, details);
  }
}

export class UnauthorizedError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'UNAUTHORIZED', 401, details);
  }
}

export class ForbiddenError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'FORBIDDEN', 403, details);
  }
}

export class ConflictError extends BaseError {
  constructor(message: string, details?: Common.ErrorDetail[]) {
    super(message, 'CONFLICT', 409, details);
  }
}

export class InsufficientFundsError extends BaseError {
  constructor(message: string = 'Insufficient funds', details?: Common.ErrorDetail[]) {
    super(message, 'INSUFFICIENT_FUNDS', 400, details);
  }
}

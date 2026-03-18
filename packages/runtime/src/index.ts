export * from './constants.js';
export * from './services/logging.service.js';
export * from './decorators/context-grpc.decorator.js';
export * from './decorators/context-http.decorator.js';
export * from './filters/http-exception.filter.js';
export * from './filters/rpc-exception.filter.js';
export * from './middlewares/request-id.middleware.js';
export * from './modules/logging.module.js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      rJti?: string; // refresh token jti
      tokenVersion: number;
      acctType: string;
    }
  }
}
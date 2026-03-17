import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { ClientMetadata, extractDeviceNameAndIp } from '@credpal-fx-trading-app/common';
import { REQUEST_ID_HEADER } from '../constants.js';

export const ContextHttp = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientMetadata => {
  const req = ctx.switchToHttp().getRequest<Request>();
  return getContextHttp(req);
});

export function getContextHttp(req: Request) {
  const clientCtx = extractDeviceNameAndIp(req);

  // Map to interface
  return {
    ip: clientCtx.ip,
    userAgent: clientCtx.name,
    country: req.headers['x-country'] as string,
    requestId: req.headers[REQUEST_ID_HEADER] as string,
    userId: req.userId,
    sessionId: req.rJti,
    tokenVersion: req.tokenVersion,
    acctType: req.acctType,
    timestamp: new Date().toISOString(),
  };
}

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import type { ClientMetadata } from '@credpal-fx-trading-app/common';

export const ContextGrpc = createParamDecorator((_: unknown, ctx: ExecutionContext): ClientMetadata => {
  // 1. Switch context to RPC to access gRPC specifics
  const rpcContext = ctx.switchToRpc();
  const metadata = rpcContext.getContext<Metadata>();

  // 2. Extract values (Metadata stores values as arrays, we usually want the first one)
  const getMeta = (key: string) => {
    const value = metadata.get(key);
    return value.length > 0 ? value[0].toString() : undefined;
  };

  // 3. Map to your interface
  return {
    ip: getMeta('x-ip'),
    userAgent: getMeta('x-user-agent'),
    requestId: getMeta('x-request-id'),
    userId: getMeta('x-user-id') || '',
    sessionId: getMeta('x-session-id') || '',
    tokenVersion: Number(getMeta('x-token-version')),
    acctType: getMeta('x-account-type'),
    timestamp: getMeta('x-timestamp'),
  };
});

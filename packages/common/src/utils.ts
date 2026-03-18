import { ClientMetadata } from "./metadata.js";
import { Metadata } from "@grpc/grpc-js";
import {
  PG_CHECK_VIOLATION,
  PG_FOREIGN_KEY_VIOLATION,
  PG_UNIQUE_VIOLATION,
} from "@drdgvhbh/postgres-error-codes";
import { QueryFailedError } from "typeorm";
import { DatabaseError } from "pg";

/*
 * Generate an OTP code of the specified length and return.
 * @param len length of OTP to be generated. Default to 4.
 */
export function generateOTPCode(len: number = 4) {
  let otp = "";

  if (len < 1) return otp;

  for (let i = 0; i < len; i++) {
    const randomNumber = Math.floor(Math.random() * 10);
    otp += randomNumber.toString();
  }

  return otp;
}

export function convertClientMetaToRPCMeta(meta: ClientMetadata): Metadata {
  const metadata = new Metadata();

  // Helper to safely add strings if they exist
  const addIfPresent = (key: string, value: string | undefined) => {
    if (value) {
      metadata.add(key, value.toString());
    }
  };

  // Map ClientMetadata fields to gRPC headers (conventionally lowercase with x- prefix)
  addIfPresent("x-ip", meta.ip);
  addIfPresent("x-user-agent", meta.userAgent);
  addIfPresent("x-request-id", meta.requestId);
  addIfPresent("x-user-id", meta.userId);
  addIfPresent("x-session-id", meta.sessionId);
  addIfPresent("x-account-type", meta.acctType);
  addIfPresent("x-token-version", meta.tokenVersion?.toString());
  addIfPresent("x-timestamp", meta.timestamp || new Date().toISOString());

  return metadata;
}

export const isUniqueKeyViolationError = (
  error: unknown,
  uniqueKeyName: string,
): boolean => {
  return (
    error instanceof QueryFailedError &&
    error.driverError instanceof DatabaseError &&
    error.driverError.code == PG_UNIQUE_VIOLATION &&
    error.driverError.constraint == uniqueKeyName
  );
};

export const isUniqueKeyViolationErrorOnAnyColumn = (
  error: unknown,
): boolean => {
  return (
    error instanceof QueryFailedError &&
    error.driverError instanceof DatabaseError &&
    error.driverError.code == PG_UNIQUE_VIOLATION
  );
};

export const isForeignKeyViolationError = (
  error: unknown,
  foreignKeyName: string,
): boolean => {
  return (
    error instanceof QueryFailedError &&
    error.driverError instanceof DatabaseError &&
    error.driverError.code == PG_FOREIGN_KEY_VIOLATION &&
    error.driverError.constraint == foreignKeyName
  );
};

export const isCheckViolationError = (
  error: unknown,
  checkName: string,
): boolean => {
  return (
    error instanceof QueryFailedError &&
    error.driverError instanceof DatabaseError &&
    error.driverError.code === PG_CHECK_VIOLATION &&
    error.driverError.constraint === checkName
  );
};

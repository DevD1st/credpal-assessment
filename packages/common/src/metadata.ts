/**
 * Client metadata passed through all service calls
 * Contains request context information
 */
export interface ClientMetadata {
  ip?: string;
  userAgent?: string;
  /**
   * we can use this to map the trace/span ids
   */
  requestId?: string;
  timestamp?: string;
  userId?: string;
  acctType?: string;
  /**
   * jti
   */
  sessionId?: string;
  /**
   * for token versioning and revocation
   */
  tokenVersion?: number;
}
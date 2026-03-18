/**
 * Base authentication interfaces
 */
export interface ITokenMakeup {
  type: "access" | "refresh";
  jti: string;
  acctType: string;
  profileId: string;
  tokenVersion: number;
  r_jti?: string;
}

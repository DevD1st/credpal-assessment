import { Accounts } from "@credpal-fx-trading-app/proto";
import { Metadata } from "@grpc/grpc-js";
import { Observable } from "rxjs";

export interface IRPCAuthService {
  RegisterAccount(
    data: Accounts.RegisterAccountInput,
    meta: Metadata,
  ): Observable<Accounts.OTPExpirationResponse>;
  VerifyOTP(
    data: Accounts.VerifyOTPInput,
    meta: Metadata,
  ): Observable<Accounts.AuthCredentialsResponse>;
}

import { SupportedCurrencies } from "@credpal-fx-trading-app/constants";
import { Wallets } from "@credpal-fx-trading-app/proto";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform, Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export enum TransactionStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export class GetTransactionsDto implements Wallets.GetTransactionsInput {
  @ApiPropertyOptional({
    enum: SupportedCurrencies,
    description: "Filter by currency",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Currency must be a string" })
  @IsEnum(SupportedCurrencies, {
    message: `Currency must be one of: ${Object.values(SupportedCurrencies).join(", ")}`,
  })
  currency?: string | undefined;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: "Filter by transaction status",
  })
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: "Status must be a string" })
  @IsEnum(TransactionStatus, {
    message: `Status must be one of: ${Object.values(TransactionStatus).join(", ")}`,
  })
  status?: string | undefined;

  @ApiPropertyOptional({
    description: "Pagination offset",
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Offset must be an integer" })
  @Min(0, { message: "Offset must be greater than or equal to 0" })
  offset?: number | undefined;

  @ApiPropertyOptional({
    description: "Maximum number of results",
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit must be an integer" })
  @Min(1, { message: "Limit must be greater than or equal to 1" })
  @Max(100, { message: "Limit must be less than or equal to 100" })
  limit?: number | undefined;
}

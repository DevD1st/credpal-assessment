import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  Check,
  JoinColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity.js";
import { Wallet } from "../../wallet/entities/wallet.entity.js";
import { Ledger } from "./ledger.entity.js";
import { v7 as uuidv7 } from "uuid";

export const idx_transaction_user_id = "idx_transaction_user_id";
export const idx_transaction_base_wallet_id = "idx_transaction_base_wallet_id";
export const idx_transaction_reference = "idx_transaction_reference";
export const chk_transaction_type = "chk_transaction_type";
export const chk_transaction_status = "chk_transaction_status";

@Entity("transactions")
@Index(idx_transaction_user_id, ["userId"])
@Index(idx_transaction_base_wallet_id, ["baseWalletId"])
@Index(idx_transaction_reference, ["reference"])
@Check(chk_transaction_type, `"type" IN ('FUNDING', 'CONVERSION')`)
@Check(chk_transaction_status, `"status" IN ('PENDING', 'SUCCESS', 'FAILED')`)
export class Transaction {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string = uuidv7(); // scales better

  @Column("uuid", { name: "user_id" })
  userId: string;

  @Column("uuid", { name: "base_wallet_id" })
  baseWalletId: string;

  @Column("uuid", { name: "target_wallet_id", nullable: true })
  targetWalletId: string;

  @Column({ name: "type" })
  type: string;

  @Column({ name: "status" })
  status: string;

  @Column({ name: "base_currency" })
  baseCurrency: string;

  @Column({ name: "target_currency", nullable: true })
  targetCurrency: string;

  @Column({ name: "base_amount", type: "decimal", precision: 18, scale: 4 })
  baseAmount: number;

  @Column({ name: "target_amount", type: "decimal", precision: 18, scale: 4, nullable: true })
  targetAmount: number;

  @Column({ name: "exchange_rate", type: "decimal", precision: 18, scale: 4, default: 1.0 })
  exchangeRate: number;

  @Column({ name: "exchange_rate_with_spread", type: "decimal", precision: 18, scale: 4, default: 1.0 })
  exchangeRateWithSpread: number;

  @Column({ name: "percentage_spread", type: "decimal", precision: 18, scale: 4, default: 0.0 })
  percentageSpread: number;

  @Column({ name: "reference", unique: true })
  reference: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @ManyToOne(() => User, (user: User) => user.id, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "base_wallet_id" })
  baseWallet: Wallet;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "target_wallet_id" })
  targetWallet: Wallet;

  @OneToMany(() => Ledger, (ledger: Ledger) => ledger.transaction)
  ledgers: Ledger[];
}

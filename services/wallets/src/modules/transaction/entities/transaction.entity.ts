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
  @PrimaryGeneratedColumn("uuid")
  id: string = uuidv7(); // scales better

  @Column("uuid")
  userId: string;

  @Column("uuid")
  baseWalletId: string;

  @Column("uuid", { nullable: true })
  targetWalletId: string;

  @Column()
  type: string;

  @Column()
  status: string;

  @Column()
  baseCurrency: string;

  @Column({ nullable: true })
  targetCurrency: string;

  @Column({ type: "decimal", precision: 18, scale: 4 })
  baseAmount: number;

  @Column({ type: "decimal", precision: 18, scale: 4, nullable: true })
  targetAmount: number;

  @Column({ type: "decimal", precision: 18, scale: 4, default: 1.0 })
  exchangeRate: number;

  @Column({ type: "decimal", precision: 18, scale: 4, default: 1.0 })
  exchangeRateWithSpread: number;

  @Column({ type: "decimal", precision: 18, scale: 4, default: 0.0 })
  percentageSpread: number;

  @Column({ unique: true })
  reference: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user: User) => user.id, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "baseWalletId" })
  baseWallet: Wallet;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "targetWalletId" })
  targetWallet: Wallet;

  @OneToMany(() => Ledger, (ledger: Ledger) => ledger.transaction)
  ledgers: Ledger[];
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
  Check,
  JoinColumn,
} from "typeorm";
import { Wallet } from "../../wallet/entities/wallet.entity.js";
import { Transaction } from "./transaction.entity.js";
import { v7 as uuidv7 } from "uuid";

export const idx_ledger_wallet_id = "idx_ledger_wallet_id";
export const idx_ledger_transaction_id = "idx_ledger_transaction_id";
export const chk_ledger_type = "chk_ledger_type";

@Entity("ledgers")
@Index(idx_ledger_wallet_id, ["walletId"])
@Index(idx_ledger_transaction_id, ["transactionId"])
@Check(chk_ledger_type, `"type" IN ('CREDIT', 'DEBIT')`)
export class Ledger {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string = uuidv7(); // scales better

  @Column("uuid", { name: "wallet_id" })
  walletId: string;

  @Column("uuid", { name: "transaction_id" })
  transactionId: string;

  @Column({ name: "type" })
  type: string;

  @Column({ name: "currency" })
  currency: string;

  @Column({ name: "amount", type: "decimal", precision: 18, scale: 4 })
  amount: number;

  @Column({ name: "running_balance", type: "decimal", precision: 18, scale: 4 })
  runningBalance: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "wallet_id" })
  wallet: Wallet;

  @ManyToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.ledgers,
    { onDelete: "RESTRICT" },
  )
  @JoinColumn({ name: "transaction_id" })
  transaction: Transaction;
}

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
  @PrimaryGeneratedColumn("uuid")
  id: string = uuidv7(); // scales better

  @Column("uuid")
  walletId: string;

  @Column("uuid")
  transactionId: string;

  @Column()
  type: string;

  @Column()
  currency: string;

  @Column({ type: "decimal", precision: 18, scale: 4 })
  amount: number;

  @Column({ type: "decimal", precision: 18, scale: 4 })
  runningBalance: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Wallet, (wallet: Wallet) => wallet.id, {
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "walletId" })
  wallet: Wallet;

  @ManyToOne(
    () => Transaction,
    (transaction: Transaction) => transaction.ledgers,
    { onDelete: "RESTRICT" },
  )
  @JoinColumn({ name: "transactionId" })
  transaction: Transaction;
}

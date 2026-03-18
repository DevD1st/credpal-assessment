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
  Unique,
  JoinColumn,
} from "typeorm";
import { User } from "../../user/entities/user.entity.js";
import { v7 as uuidv7 } from "uuid";

export const idx_wallet_user_id = "idx_wallet_user_id";
export const uq_wallet_user_currency = "uq_wallet_user_currency";
export const chk_wallet_balance = "chk_wallet_balance";
export const chk_wallet_status = "chk_wallet_status";

@Entity("wallets")
@Index(idx_wallet_user_id, ["userId"])
@Unique(uq_wallet_user_currency, ["userId", "currency"])
@Check(chk_wallet_balance, `"balance" >= 0`)
@Check(chk_wallet_status, `"status" IN ('ACTIVE', 'DISABLED')`)
export class Wallet {
  @PrimaryGeneratedColumn("uuid")
  id: string = uuidv7(); // uuidv7 scales better

  @Column("uuid")
  userId: string;

  @Column()
  currency: string;

  @Column({ type: "decimal", precision: 18, scale: 4, default: 0.0 })
  balance: number;

  @Column({ default: "ACTIVE" })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user: User) => user.id, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "userId" })
  user: User;
}

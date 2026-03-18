import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Check,
  Unique,
} from "typeorm";
import { v7 as uuidv7 } from "uuid";

export const idx_user_email = "idx_user_email";
export const chk_user_role = "chk_user_role";

@Entity("users")
@Unique(idx_user_email, ["email"])
@Check(chk_user_role, `"role" IN ('USER', 'ADMIN')`)
export class User {
  @PrimaryGeneratedColumn("uuid", { name: "id" })
  id: string = uuidv7();

  @Column({ name: "email" })
  email: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({ name: "role", default: "USER" })
  role: string;

  @Column({ name: "is_verified", default: false })
  isVerified: boolean;

  @Column({ name: "token_version", type: "int", default: 0 })
  tokenVersion: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

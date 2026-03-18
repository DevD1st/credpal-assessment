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
  @PrimaryGeneratedColumn("uuid")
  id: string = uuidv7(); // scales beter

  @Column()
  email: string;

  @Column()
  passwordHash: string;

  @Column({ default: "USER" })
  role: string;

  @Column({ default: false })
  isVerified: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

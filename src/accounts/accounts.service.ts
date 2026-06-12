import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { CreateAccountDto, UpdateAccountDto } from './accounts.dto';

@Injectable()
export class AccountsService {
  constructor(private db: DatabaseService) {}

  calculateAccountBalance(accountId: string): number {
    const account = this.db.get<any>(
      `SELECT initial_balance FROM accounts WHERE id = ?`,
      [accountId],
    );
    if (!account) return 0;

    const income = this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE account_id = ? AND type = 'INCOME' AND deleted_at IS NULL`,
      [accountId],
    );
    const expense = this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE account_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL`,
      [accountId],
    );
    const incoming = this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transfers
       WHERE destination_account_id = ? AND deleted_at IS NULL`,
      [accountId],
    );
    const outgoing = this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transfers
       WHERE source_account_id = ? AND deleted_at IS NULL`,
      [accountId],
    );

    return (
      account.initial_balance +
      (income?.total || 0) -
      (expense?.total || 0) +
      (incoming?.total || 0) -
      (outgoing?.total || 0)
    );
  }

  private formatAccount(a: any) {
    return {
      id: a.id,
      name: a.name,
      type: a.type,
      initialBalance: a.initial_balance,
      isActive: a.is_active === 1,
      balance: this.calculateAccountBalance(a.id),
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    };
  }

  create(userId: string, dto: CreateAccountDto) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO accounts (id, user_id, name, type, initial_balance, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [id, userId, dto.name, dto.type, dto.initialBalance ?? 0, now, now],
    );
    return this.formatAccount(this.db.get<any>(`SELECT * FROM accounts WHERE id = ?`, [id]));
  }

  findAll(userId: string) {
    const accounts = this.db.all<any>(
      `SELECT * FROM accounts WHERE user_id = ? ORDER BY created_at ASC`,
      [userId],
    );
    return accounts.map((a) => this.formatAccount(a));
  }

  findOne(userId: string, id: string) {
    const a = this.db.get<any>(
      `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!a) throw new NotFoundException('حساب یافت نشد.');
    return this.formatAccount(a);
  }

  update(userId: string, id: string, dto: UpdateAccountDto) {
    const a = this.db.get<any>(
      `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!a) throw new NotFoundException('حساب یافت نشد.');

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.name) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.type) { fields.push('type = ?'); values.push(dto.type); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, id);
      this.db.run(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.findOne(userId, id);
  }

  remove(userId: string, id: string) {
    const a = this.db.get<any>(
      `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!a) throw new NotFoundException('حساب یافت نشد.');

    const now = new Date().toISOString();
    this.db.run(
      `UPDATE accounts SET is_active = 0, updated_at = ? WHERE id = ?`,
      [now, id],
    );
    return { message: 'حساب غیرفعال شد.' };
  }
}

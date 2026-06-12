import {
  Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { CreateTransferDto, UpdateTransferDto } from './transfers.dto';
import { ErrorCode } from '../common/types/api.types';

@Injectable()
export class TransfersService {
  constructor(private db: DatabaseService) {}

  private format(t: any) {
    return {
      id: t.id,
      sourceAccountId: t.source_account_id,
      destinationAccountId: t.destination_account_id,
      amount: t.amount,
      transferDate: t.transfer_date,
      note: t.note,
      deletedAt: t.deleted_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      sourceAccountName: t.source_name,
      destinationAccountName: t.dest_name,
    };
  }

  create(userId: string, dto: CreateTransferDto) {
    if (dto.sourceAccountId === dto.destinationAccountId) {
      throw new BadRequestException('حساب مبدا و مقصد نمی‌توانند یکسان باشند.');
    }

    const source = this.db.get<any>(
      `SELECT id, is_active FROM accounts WHERE id = ? AND user_id = ?`,
      [dto.sourceAccountId, userId],
    );
    if (!source) throw new NotFoundException('حساب مبدا یافت نشد.');
    if (!source.is_active) {
      throw new HttpException(
        { code: ErrorCode.ACCOUNT_INACTIVE, message: 'حساب مبدا غیرفعال است.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const dest = this.db.get<any>(
      `SELECT id, is_active FROM accounts WHERE id = ? AND user_id = ?`,
      [dto.destinationAccountId, userId],
    );
    if (!dest) throw new NotFoundException('حساب مقصد یافت نشد.');
    if (!dest.is_active) {
      throw new HttpException(
        { code: ErrorCode.ACCOUNT_INACTIVE, message: 'حساب مقصد غیرفعال است.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO transfers (id, user_id, source_account_id, destination_account_id, amount, transfer_date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, dto.sourceAccountId, dto.destinationAccountId, dto.amount,
       dto.transferDate, dto.note ?? null, now, now],
    );
    return this.findOne(userId, id);
  }

  findAll(userId: string, page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(100, Math.max(1, limit));
    const offset = (page - 1) * limit;
    const total = (this.db.get<any>(
      `SELECT COUNT(*) as count FROM transfers WHERE user_id = ? AND deleted_at IS NULL`,
      [userId],
    ) as any)?.count ?? 0;

    const rows = this.db.all<any>(
      `SELECT t.*, sa.name as source_name, da.name as dest_name
       FROM transfers t
       LEFT JOIN accounts sa ON t.source_account_id = sa.id
       LEFT JOIN accounts da ON t.destination_account_id = da.id
       WHERE t.user_id = ? AND t.deleted_at IS NULL
       ORDER BY t.transfer_date DESC LIMIT ? OFFSET ?`,
      [userId, limit, offset],
    );
    return {
      data: rows.map((r) => this.format(r)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findOne(userId: string, id: string) {
    const t = this.db.get<any>(
      `SELECT t.*, sa.name as source_name, da.name as dest_name
       FROM transfers t
       LEFT JOIN accounts sa ON t.source_account_id = sa.id
       LEFT JOIN accounts da ON t.destination_account_id = da.id
       WHERE t.id = ? AND t.user_id = ?`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('انتقال یافت نشد.');
    return this.format(t);
  }

  update(userId: string, id: string, dto: UpdateTransferDto) {
    const t = this.db.get<any>(
      `SELECT * FROM transfers WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('انتقال یافت نشد.');

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.amount !== undefined) { fields.push('amount = ?'); values.push(dto.amount); }
    if (dto.transferDate) { fields.push('transfer_date = ?'); values.push(dto.transferDate); }
    if (dto.note !== undefined) { fields.push('note = ?'); values.push(dto.note); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, id);
      this.db.run(`UPDATE transfers SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findOne(userId, id);
  }

  softDelete(userId: string, id: string) {
    const t = this.db.get<any>(
      `SELECT * FROM transfers WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('انتقال یافت نشد.');
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE transfers SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
    );
    return { message: 'انتقال حذف شد.' };
  }
}

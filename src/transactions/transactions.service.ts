import {
  Injectable, NotFoundException, BadRequestException, HttpException, HttpStatus,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  CreateTransactionDto, UpdateTransactionDto, TransactionQueryDto,
} from './transactions.dto';
import { ErrorCode } from '../common/types/api.types';

@Injectable()
export class TransactionsService {
  constructor(private db: DatabaseService) {}

  private format(t: any) {
    return {
      id: t.id,
      type: t.type,
      title: t.title,
      amount: t.amount,
      accountId: t.account_id,
      categoryId: t.category_id,
      transactionDate: t.transaction_date,
      note: t.note,
      deletedAt: t.deleted_at,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
    };
  }

  private validateOwnership(userId: string, accountId: string, categoryId: string, type: string) {
    const account = this.db.get<any>(
      `SELECT id, is_active FROM accounts WHERE id = ? AND user_id = ?`,
      [accountId, userId],
    );
    if (!account) throw new NotFoundException('حساب یافت نشد.');
    if (!account.is_active) {
      throw new HttpException(
        { code: ErrorCode.ACCOUNT_INACTIVE, message: 'حساب غیرفعال است.' },
        HttpStatus.BAD_REQUEST,
      );
    }

    const category = this.db.get<any>(
      `SELECT id, type, is_active FROM categories WHERE id = ? AND user_id = ?`,
      [categoryId, userId],
    );
    if (!category) throw new NotFoundException('دسته‌بندی یافت نشد.');
    if (category.type !== type) {
      throw new HttpException(
        { code: ErrorCode.CATEGORY_TYPE_MISMATCH, message: 'نوع دسته‌بندی با نوع تراکنش مطابقت ندارد.' },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  create(userId: string, dto: CreateTransactionDto) {
    this.validateOwnership(userId, dto.accountId, dto.categoryId, dto.type);

    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO transactions (id, user_id, type, title, amount, account_id, category_id, transaction_date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, dto.type, dto.title, dto.amount, dto.accountId, dto.categoryId,
       dto.transactionDate, dto.note ?? null, now, now],
    );
    return this.format(this.db.get<any>(`SELECT * FROM transactions WHERE id = ?`, [id]));
  }

  findAll(userId: string, query: TransactionQueryDto) {
    const page = Math.max(1, query.page ?? 1);
    const limit = Math.min(100, Math.max(1, query.limit ?? 20));
    const offset = (page - 1) * limit;

    const conditions: string[] = ['t.user_id = ?', 't.deleted_at IS NULL'];
    const params: any[] = [userId];

    if (query.search) {
      conditions.push(`t.title LIKE ?`);
      params.push(`%${query.search}%`);
    }
    if (query.type) { conditions.push(`t.type = ?`); params.push(query.type); }
    if (query.categoryId) { conditions.push(`t.category_id = ?`); params.push(query.categoryId); }
    if (query.accountId) { conditions.push(`t.account_id = ?`); params.push(query.accountId); }
    if (query.dateFrom) { conditions.push(`t.transaction_date >= ?`); params.push(query.dateFrom); }
    if (query.dateTo) { conditions.push(`t.transaction_date <= ?`); params.push(query.dateTo); }
    if (query.minAmount) { conditions.push(`t.amount >= ?`); params.push(query.minAmount); }
    if (query.maxAmount) { conditions.push(`t.amount <= ?`); params.push(query.maxAmount); }

    const allowedSort: Record<string, string> = {
      transactionDate: 't.transaction_date',
      amount: 't.amount',
      createdAt: 't.created_at',
    };
    const sortCol = allowedSort[query.sortBy ?? 'transactionDate'] ?? 't.transaction_date';
    const sortDir = query.sortOrder?.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const where = `WHERE ${conditions.join(' AND ')}`;
    const total = (this.db.get<any>(
      `SELECT COUNT(*) as count FROM transactions t ${where}`, params,
    ) as any)?.count ?? 0;

    const rows = this.db.all<any>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       ${where} ORDER BY ${sortCol} ${sortDir} LIMIT ? OFFSET ?`,
      [...params, limit, offset],
    );

    return {
      data: rows.map((t) => ({
        ...this.format(t),
        categoryName: t.category_name,
        categoryIcon: t.category_icon,
        accountName: t.account_name,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  findOne(userId: string, id: string) {
    const t = this.db.get<any>(
      `SELECT t.*, c.name as category_name, c.icon as category_icon, a.name as account_name
       FROM transactions t
       LEFT JOIN categories c ON t.category_id = c.id
       LEFT JOIN accounts a ON t.account_id = a.id
       WHERE t.id = ? AND t.user_id = ?`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('تراکنش یافت نشد.');
    return { ...this.format(t), categoryName: t.category_name, accountName: t.account_name };
  }

  update(userId: string, id: string, dto: UpdateTransactionDto) {
    const t = this.db.get<any>(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('تراکنش یافت نشد.');

    const accountId = dto.accountId ?? t.account_id;
    const categoryId = dto.categoryId ?? t.category_id;
    if (dto.accountId || dto.categoryId) {
      this.validateOwnership(userId, accountId, categoryId, t.type);
    }

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.title !== undefined) { fields.push('title = ?'); values.push(dto.title); }
    if (dto.amount !== undefined) { fields.push('amount = ?'); values.push(dto.amount); }
    if (dto.accountId) { fields.push('account_id = ?'); values.push(dto.accountId); }
    if (dto.categoryId) { fields.push('category_id = ?'); values.push(dto.categoryId); }
    if (dto.transactionDate) { fields.push('transaction_date = ?'); values.push(dto.transactionDate); }
    if (dto.note !== undefined) { fields.push('note = ?'); values.push(dto.note); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, id);
      this.db.run(`UPDATE transactions SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findOne(userId, id);
  }

  softDelete(userId: string, id: string) {
    const t = this.db.get<any>(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('تراکنش یافت نشد.');
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?`,
      [now, now, id],
    );
    return { message: 'تراکنش حذف شد.' };
  }

  restore(userId: string, id: string) {
    const t = this.db.get<any>(
      `SELECT * FROM transactions WHERE id = ? AND user_id = ? AND deleted_at IS NOT NULL`,
      [id, userId],
    );
    if (!t) throw new NotFoundException('تراکنش حذف‌شده یافت نشد.');
    const now = new Date().toISOString();
    this.db.run(
      `UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?`,
      [now, id],
    );
    return this.findOne(userId, id);
  }
}

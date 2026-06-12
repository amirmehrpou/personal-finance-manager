import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { CreateBudgetDto, UpdateBudgetDto } from './budgets.dto';

@Injectable()
export class BudgetsService {
  constructor(private db: DatabaseService) {}

  private calcStatus(percentage: number): string {
    if (percentage > 100) return 'EXCEEDED';
    if (percentage >= 80) return 'WARNING';
    return 'SAFE';
  }

  private calcUsage(budgetId: string, categoryId: string, year: number, month: number, limitAmount: number) {
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const spent = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE category_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?`,
      [categoryId, dateFrom, dateTo],
    ) as any)?.total ?? 0;

    const remaining = Math.max(0, limitAmount - spent);
    const exceeded = Math.max(0, spent - limitAmount);
    const percentage = limitAmount > 0 ? Math.round((spent / limitAmount) * 100) : 0;

    return { spentAmount: spent, remainingAmount: remaining, exceededAmount: exceeded, percentage, status: this.calcStatus(percentage) };
  }

  private format(b: any) {
    const usage = this.calcUsage(b.id, b.category_id, b.year, b.month, b.limit_amount);
    return {
      id: b.id,
      categoryId: b.category_id,
      categoryName: b.category_name,
      categoryIcon: b.category_icon,
      year: b.year,
      month: b.month,
      limitAmount: b.limit_amount,
      ...usage,
      createdAt: b.created_at,
      updatedAt: b.updated_at,
    };
  }

  create(userId: string, dto: CreateBudgetDto) {
    const cat = this.db.get<any>(
      `SELECT id, type FROM categories WHERE id = ? AND user_id = ? AND is_active = 1`,
      [dto.categoryId, userId],
    );
    if (!cat) throw new NotFoundException('دسته‌بندی یافت نشد.');
    if (cat.type !== 'EXPENSE') throw new BadRequestException('بودجه فقط برای دسته‌های هزینه تعریف می‌شود.');

    const existing = this.db.get<any>(
      `SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND year = ? AND month = ?`,
      [userId, dto.categoryId, dto.year, dto.month],
    );
    if (existing) throw new ConflictException('بودجه این دسته برای این ماه قبلاً تعریف شده است.');

    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO budgets (id, user_id, category_id, year, month, limit_amount, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, dto.categoryId, dto.year, dto.month, dto.limitAmount, now, now],
    );
    return this.findOne(userId, id);
  }

  findAll(userId: string, year?: number, month?: number) {
    let sql = `SELECT b.*, c.name as category_name, c.icon as category_icon
               FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
               WHERE b.user_id = ?`;
    const params: any[] = [userId];
    if (year) { sql += ` AND b.year = ?`; params.push(year); }
    if (month) { sql += ` AND b.month = ?`; params.push(month); }
    sql += ` ORDER BY b.year DESC, b.month DESC`;
    return this.db.all<any>(sql, params).map((b) => this.format(b));
  }

  findOne(userId: string, id: string) {
    const b = this.db.get<any>(
      `SELECT b.*, c.name as category_name, c.icon as category_icon
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.id = ? AND b.user_id = ?`,
      [id, userId],
    );
    if (!b) throw new NotFoundException('بودجه یافت نشد.');
    return this.format(b);
  }

  update(userId: string, id: string, dto: UpdateBudgetDto) {
    const b = this.db.get<any>(`SELECT * FROM budgets WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!b) throw new NotFoundException('بودجه یافت نشد.');
    if (dto.limitAmount) {
      const now = new Date().toISOString();
      this.db.run(`UPDATE budgets SET limit_amount = ?, updated_at = ? WHERE id = ?`, [dto.limitAmount, now, id]);
    }
    return this.findOne(userId, id);
  }

  remove(userId: string, id: string) {
    const b = this.db.get<any>(`SELECT * FROM budgets WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!b) throw new NotFoundException('بودجه یافت نشد.');
    this.db.run(`DELETE FROM budgets WHERE id = ?`, [id]);
    return { message: 'بودجه حذف شد.' };
  }
}

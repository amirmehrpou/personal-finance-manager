import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class ReportsService {
  constructor(private db: DatabaseService) {}

  getExpensesReport(userId: string, dateFrom: string, dateTo: string) {
    const byCategory = this.db.all<any>(
      `SELECT c.id as category_id, c.name as category_name, c.icon as category_icon,
              COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.user_id = ? AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
         AND t.transaction_date >= ? AND t.transaction_date <= ?
       WHERE c.user_id = ? AND c.type = 'EXPENSE'
       GROUP BY c.id, c.name, c.icon
       HAVING total > 0
       ORDER BY total DESC`,
      [userId, dateFrom, dateTo, userId],
    );

    const totalExpense = byCategory.reduce((s, r) => s + r.total, 0);

    return {
      dateFrom,
      dateTo,
      totalExpense,
      byCategory: byCategory.map((r) => ({
        categoryId: r.category_id,
        categoryName: r.category_name,
        categoryIcon: r.category_icon,
        total: r.total,
        percentage: totalExpense > 0 ? Math.round((r.total / totalExpense) * 100) : 0,
      })),
    };
  }

  getMonthlyReport(userId: string, year: number, month: number) {
    const dateFrom = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const dateTo = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    const income = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'INCOME' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?`,
      [userId, dateFrom, dateTo],
    ) as any)?.total ?? 0;

    const expense = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?`,
      [userId, dateFrom, dateTo],
    ) as any)?.total ?? 0;

    const highestExpense = this.db.get<any>(
      `SELECT title, amount FROM transactions
       WHERE user_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?
       ORDER BY amount DESC LIMIT 1`,
      [userId, dateFrom, dateTo],
    );

    const expensesByCategory = this.db.all<any>(
      `SELECT c.id as category_id, c.name as category_name, c.icon as category_icon,
              COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.user_id = ? AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
         AND t.transaction_date >= ? AND t.transaction_date <= ?
       WHERE c.user_id = ? AND c.type = 'EXPENSE'
       GROUP BY c.id
       HAVING total > 0
       ORDER BY total DESC`,
      [userId, dateFrom, dateTo, userId],
    );

    const topExpenseCategory = expensesByCategory[0] ?? null;

    const budgets = this.db.all<any>(
      `SELECT b.*, c.name as category_name, c.icon as category_icon
       FROM budgets b LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.year = ? AND b.month = ?`,
      [userId, year, month],
    ).map((b) => {
      const spent = expensesByCategory.find((e) => e.category_id === b.category_id)?.total ?? 0;
      const pct = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: b.category_name,
        limitAmount: b.limit_amount,
        spentAmount: spent,
        percentage: pct,
        status: pct > 100 ? 'EXCEEDED' : pct >= 80 ? 'WARNING' : 'SAFE',
      };
    });

    return {
      year,
      month,
      totalIncome: income,
      totalExpense: expense,
      netAmount: income - expense,
      highestExpense: highestExpense
        ? { title: highestExpense.title, amount: highestExpense.amount }
        : null,
      topExpenseCategory: topExpenseCategory
        ? {
            categoryId: topExpenseCategory.category_id,
            categoryName: topExpenseCategory.category_name,
            total: topExpenseCategory.total,
          }
        : null,
      expensesByCategory: expensesByCategory.map((e) => ({
        categoryId: e.category_id,
        categoryName: e.category_name,
        categoryIcon: e.category_icon,
        total: e.total,
        percentage: expense > 0 ? Math.round((e.total / expense) * 100) : 0,
      })),
      budgets,
    };
  }

  getComparisonReport(userId: string, year: number, month: number) {
    const buildPeriod = (y: number, m: number) => {
      const from = `${y}-${String(m).padStart(2, '0')}-01`;
      const last = new Date(y, m, 0).getDate();
      const to = `${y}-${String(m).padStart(2, '0')}-${last}`;
      const inc = (this.db.get<any>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND type = 'INCOME' AND deleted_at IS NULL
         AND transaction_date >= ? AND transaction_date <= ?`,
        [userId, from, to],
      ) as any)?.total ?? 0;
      const exp = (this.db.get<any>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE user_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
         AND transaction_date >= ? AND transaction_date <= ?`,
        [userId, from, to],
      ) as any)?.total ?? 0;

      const byCategory = this.db.all<any>(
        `SELECT c.id as category_id, c.name as category_name,
                COALESCE(SUM(t.amount), 0) as total
         FROM categories c
         LEFT JOIN transactions t ON t.category_id = c.id
           AND t.user_id = ? AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
           AND t.transaction_date >= ? AND t.transaction_date <= ?
         WHERE c.user_id = ? AND c.type = 'EXPENSE'
         GROUP BY c.id HAVING total > 0`,
        [userId, from, to, userId],
      );

      return { year: y, month: m, totalIncome: inc, totalExpense: exp, netAmount: inc - exp, byCategory };
    };

    let prevYear = year;
    let prevMonth = month - 1;
    if (prevMonth === 0) { prevMonth = 12; prevYear = year - 1; }

    const current = buildPeriod(year, month);
    const previous = buildPeriod(prevYear, prevMonth);

    const allCategoryIds = new Set([
      ...current.byCategory.map((c) => c.category_id),
      ...previous.byCategory.map((c) => c.category_id),
    ]);

    const categoryDifferences = Array.from(allCategoryIds).map((cid) => {
      const cur = current.byCategory.find((c) => c.category_id === cid);
      const prev = previous.byCategory.find((c) => c.category_id === cid);
      return {
        categoryId: cid,
        categoryName: cur?.category_name ?? prev?.category_name,
        currentAmount: cur?.total ?? 0,
        previousAmount: prev?.total ?? 0,
        difference: (cur?.total ?? 0) - (prev?.total ?? 0),
      };
    });

    return {
      currentPeriod: { year: current.year, month: current.month, totalIncome: current.totalIncome, totalExpense: current.totalExpense, netAmount: current.netAmount },
      previousPeriod: { year: previous.year, month: previous.month, totalIncome: previous.totalIncome, totalExpense: previous.totalExpense, netAmount: previous.netAmount },
      incomeDifference: current.totalIncome - previous.totalIncome,
      expenseDifference: current.totalExpense - previous.totalExpense,
      netDifference: current.netAmount - previous.netAmount,
      categoryDifferences,
    };
  }
}

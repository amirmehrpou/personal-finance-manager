import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class DashboardService {
  constructor(
    private db: DatabaseService,
    private accountsService: AccountsService,
  ) {}

  getDashboard(userId: string, month: string) {
    const [yearStr, monthStr] = month.split('-');
    const year = Number(yearStr);
    const mon = Number(monthStr);
    const dateFrom = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDay = new Date(year, mon, 0).getDate();
    const dateTo = `${year}-${String(mon).padStart(2, '0')}-${lastDay}`;

    // Total balance across all accounts
    const accounts = this.db.all<any>(`SELECT id FROM accounts WHERE user_id = ?`, [userId]);
    const totalBalance = accounts.reduce(
      (sum, a) => sum + this.accountsService.calculateAccountBalance(a.id),
      0,
    );

    // Monthly income/expense
    const monthlyIncome = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'INCOME' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?`,
      [userId, dateFrom, dateTo],
    ) as any)?.total ?? 0;

    const monthlyExpense = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
       WHERE user_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
       AND transaction_date >= ? AND transaction_date <= ?`,
      [userId, dateFrom, dateTo],
    ) as any)?.total ?? 0;

    // Top expense category
    const topExpenseCategory = this.db.get<any>(
      `SELECT c.id, c.name, c.icon, COALESCE(SUM(t.amount), 0) as total
       FROM categories c
       LEFT JOIN transactions t ON t.category_id = c.id
         AND t.user_id = ? AND t.type = 'EXPENSE' AND t.deleted_at IS NULL
         AND t.transaction_date >= ? AND t.transaction_date <= ?
       WHERE c.user_id = ? AND c.type = 'EXPENSE'
       GROUP BY c.id ORDER BY total DESC LIMIT 1`,
      [userId, dateFrom, dateTo, userId],
    );

    // Budget summary
    const budgets = this.db.all<any>(
      `SELECT b.*, c.name as category_name FROM budgets b
       LEFT JOIN categories c ON b.category_id = c.id
       WHERE b.user_id = ? AND b.year = ? AND b.month = ?`,
      [userId, year, mon],
    ).map((b) => {
      const spent = (this.db.get<any>(
        `SELECT COALESCE(SUM(amount), 0) as total FROM transactions
         WHERE category_id = ? AND type = 'EXPENSE' AND deleted_at IS NULL
         AND transaction_date >= ? AND transaction_date <= ?`,
        [b.category_id, dateFrom, dateTo],
      ) as any)?.total ?? 0;
      const pct = b.limit_amount > 0 ? Math.round((spent / b.limit_amount) * 100) : 0;
      return {
        id: b.id,
        categoryName: b.category_name,
        limitAmount: b.limit_amount,
        spentAmount: spent,
        percentage: pct,
        status: pct > 100 ? 'EXCEEDED' : pct >= 80 ? 'WARNING' : 'SAFE',
      };
    });

    // Recent activities (last 5 transactions + transfers combined)
    const recentTx = this.db.all<any>(
      `SELECT t.id, 'TRANSACTION' as kind, t.type, t.title, t.amount, t.transaction_date as date,
              c.name as category_name, c.icon as category_icon
       FROM transactions t LEFT JOIN categories c ON t.category_id = c.id
       WHERE t.user_id = ? AND t.deleted_at IS NULL
       ORDER BY t.transaction_date DESC, t.created_at DESC LIMIT 5`,
      [userId],
    );

    const recentTr = this.db.all<any>(
      `SELECT t.id, 'TRANSFER' as kind, 'TRANSFER' as type,
              'انتقال وجه' as title, t.amount, t.transfer_date as date,
              sa.name as source_name, da.name as dest_name
       FROM transfers t
       LEFT JOIN accounts sa ON t.source_account_id = sa.id
       LEFT JOIN accounts da ON t.destination_account_id = da.id
       WHERE t.user_id = ? AND t.deleted_at IS NULL
       ORDER BY t.transfer_date DESC, t.created_at DESC LIMIT 5`,
      [userId],
    );

    const recentActivities = [...recentTx, ...recentTr]
      .sort((a, b) => (a.date < b.date ? 1 : -1))
      .slice(0, 5);

    // Active goals summary
    const activeGoals = this.db.all<any>(
      `SELECT g.id, g.title, g.target_amount, g.target_date, g.status,
              COALESCE(SUM(gc.amount), 0) as saved_amount
       FROM goals g
       LEFT JOIN goal_contributions gc ON gc.goal_id = g.id
       WHERE g.user_id = ? AND g.status = 'ACTIVE'
       GROUP BY g.id
       ORDER BY g.created_at DESC LIMIT 3`,
      [userId],
    ).map((g) => ({
      id: g.id,
      title: g.title,
      targetAmount: g.target_amount,
      savedAmount: g.saved_amount,
      targetDate: g.target_date,
      percentage: g.target_amount > 0 ? Math.round((g.saved_amount / g.target_amount) * 100) : 0,
    }));

    return {
      totalBalance,
      monthlyIncome,
      monthlyExpense,
      monthlyNet: monthlyIncome - monthlyExpense,
      topExpenseCategory: topExpenseCategory
        ? { id: topExpenseCategory.id, name: topExpenseCategory.name, total: topExpenseCategory.total }
        : null,
      budgetSummary: budgets,
      recentActivities,
      activeGoalSummary: activeGoals,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class BalancesService {
  constructor(
    private db: DatabaseService,
    private accountsService: AccountsService,
  ) {}

  getAllBalances(userId: string, includeInactive = true) {
    let sql = `SELECT * FROM accounts WHERE user_id = ?`;
    if (!includeInactive) sql += ` AND is_active = 1`;
    const accounts = this.db.all<any>(sql, [userId]);

    const accountBalances = accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      isActive: a.is_active === 1,
      balance: this.accountsService.calculateAccountBalance(a.id),
    }));

    const totalBalance = accountBalances.reduce((sum, a) => sum + a.balance, 0);

    return {
      totalBalance,
      accounts: accountBalances,
    };
  }

  getAccountBalance(userId: string, accountId: string) {
    const account = this.db.get<any>(
      `SELECT * FROM accounts WHERE id = ? AND user_id = ?`,
      [accountId, userId],
    );
    if (!account) return null;
    return {
      id: account.id,
      name: account.name,
      balance: this.accountsService.calculateAccountBalance(accountId),
    };
  }
}

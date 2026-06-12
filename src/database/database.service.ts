import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import initSqlJs, { Database } from 'sql.js';

@Injectable()
export class DatabaseService implements OnModuleInit {
  private db: Database;
  private dbPath: string;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private config: ConfigService) {
    this.dbPath = path.resolve(
      config.get<string>('DATABASE_PATH', './data/finance.db'),
    );
  }

  async onModuleInit() {
    await this.initialize();
    this.runMigrations();
  }

  private async initialize() {
    const SQL = await initSqlJs();
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(this.dbPath)) {
      const buffer = fs.readFileSync(this.dbPath);
      this.db = new SQL.Database(buffer);
    } else {
      this.db = new SQL.Database();
    }
    this.logger.log(`Database initialized at ${this.dbPath}`);
  }

  save() {
    const data = this.db.export();
    fs.writeFileSync(this.dbPath, Buffer.from(data));
  }

  private escapeSql(sql: string, params: any[]): string {
    let i = 0;
    return sql.replace(/\?/g, () => {
      const val = params[i++];
      if (val === null || val === undefined) return 'NULL';
      if (typeof val === 'number') return String(val);
      if (typeof val === 'boolean') return val ? '1' : '0';
      return `'${String(val).replace(/'/g, "''")}'`;
    });
  }

  run(sql: string, params: any[] = []): void {
    const escaped = this.escapeSql(sql, params);
    this.db.run(escaped);
    this.save();
  }

  get<T = any>(sql: string, params: any[] = []): T | undefined {
    const escaped = this.escapeSql(sql, params);
    const results = this.db.exec(escaped);
    if (!results || results.length === 0 || results[0].values.length === 0) {
      return undefined;
    }
    const { columns, values } = results[0];
    const row: any = {};
    columns.forEach((col, idx) => {
      row[col] = values[0][idx];
    });
    return row as T;
  }

  all<T = any>(sql: string, params: any[] = []): T[] {
    const escaped = this.escapeSql(sql, params);
    const results = this.db.exec(escaped);
    if (!results || results.length === 0) return [];
    const { columns, values } = results[0];
    return values.map((row) => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj as T;
    });
  }

  exec(sql: string): void {
    this.db.exec(sql);
    this.save();
  }

  private runMigrations() {
    this.exec(`PRAGMA journal_mode=WAL;`);
    this.exec(`PRAGMA foreign_keys=ON;`);

    this.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        currency_display TEXT NOT NULL DEFAULT 'TOMAN',
        timezone TEXT NOT NULL DEFAULT 'Asia/Tehran',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        initial_balance INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.exec(`CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);`);

    this.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT '📦',
        is_default INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.exec(`CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);`);

    this.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        amount INTEGER NOT NULL,
        account_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        note TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (account_id) REFERENCES accounts(id),
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );
    `);

    this.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, transaction_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_user_account ON transactions(user_id, account_id);
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS transfers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        source_account_id TEXT NOT NULL,
        destination_account_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        transfer_date TEXT NOT NULL,
        note TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (source_account_id) REFERENCES accounts(id),
        FOREIGN KEY (destination_account_id) REFERENCES accounts(id)
      );
    `);

    this.exec(`
      CREATE INDEX IF NOT EXISTS idx_transfers_user_id ON transfers(user_id);
      CREATE INDEX IF NOT EXISTS idx_transfers_user_date ON transfers(user_id, transfer_date);
    `);

    this.exec(`
      CREATE TABLE IF NOT EXISTS budgets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        category_id TEXT NOT NULL,
        year INTEGER NOT NULL,
        month INTEGER NOT NULL,
        limit_amount INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (category_id) REFERENCES categories(id),
        UNIQUE(user_id, category_id, year, month)
      );
    `);

    this.exec(`CREATE INDEX IF NOT EXISTS idx_budgets_user_year_month ON budgets(user_id, year, month);`);

    this.exec(`
      CREATE TABLE IF NOT EXISTS goals (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        target_amount INTEGER NOT NULL,
        target_date TEXT,
        note TEXT,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);

    this.exec(`CREATE INDEX IF NOT EXISTS idx_goals_user_status ON goals(user_id, status);`);

    this.exec(`
      CREATE TABLE IF NOT EXISTS goal_contributions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        goal_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        contribution_date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (goal_id) REFERENCES goals(id)
      );
    `);

    this.logger.log('Migrations completed successfully');
  }
}

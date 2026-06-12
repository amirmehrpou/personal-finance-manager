import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { SettingsModule } from './settings/settings.module';
import { AccountsModule } from './accounts/accounts.module';
import { CategoriesModule } from './categories/categories.module';
import { TransactionsModule } from './transactions/transactions.module';
import { TransfersModule } from './transfers/transfers.module';
import { BalancesModule } from './balances/balances.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BudgetsModule } from './budgets/budgets.module';
import { ReportsModule } from './reports/reports.module';
import { GoalsModule } from './goals/goals.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    SettingsModule,
    AccountsModule,
    CategoriesModule,
    TransactionsModule,
    TransfersModule,
    BalancesModule,
    DashboardModule,
    BudgetsModule,
    ReportsModule,
    GoalsModule,
  ],
})
export class AppModule {}

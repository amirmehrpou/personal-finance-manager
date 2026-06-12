import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import {
  CreateGoalDto, UpdateGoalDto, CreateContributionDto, UpdateContributionDto,
} from './goals.dto';

@Injectable()
export class GoalsService {
  constructor(private db: DatabaseService) {}

  private calcProgress(goalId: string, targetAmount: number) {
    const saved = (this.db.get<any>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM goal_contributions WHERE goal_id = ?`,
      [goalId],
    ) as any)?.total ?? 0;
    const remaining = Math.max(0, targetAmount - saved);
    const percentage = targetAmount > 0 ? Math.min(100, Math.round((saved / targetAmount) * 100)) : 0;
    return { savedAmount: saved, remainingAmount: remaining, percentage };
  }

  private checkAutoComplete(userId: string, goalId: string, targetAmount: number) {
    const { savedAmount } = this.calcProgress(goalId, targetAmount);
    if (savedAmount >= targetAmount) {
      const now = new Date().toISOString();
      this.db.run(
        `UPDATE goals SET status = 'COMPLETED', updated_at = ? WHERE id = ? AND status = 'ACTIVE'`,
        [now, goalId],
      );
    }
  }

  private format(g: any) {
    const progress = this.calcProgress(g.id, g.target_amount);
    return {
      id: g.id,
      title: g.title,
      category: g.category,
      targetAmount: g.target_amount,
      targetDate: g.target_date,
      note: g.note,
      status: g.status,
      ...progress,
      createdAt: g.created_at,
      updatedAt: g.updated_at,
    };
  }

  create(userId: string, dto: CreateGoalDto) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO goals (id, user_id, title, category, target_amount, target_date, note, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      [id, userId, dto.title, dto.category, dto.targetAmount, dto.targetDate ?? null, dto.note ?? null, now, now],
    );
    return this.format(this.db.get<any>(`SELECT * FROM goals WHERE id = ?`, [id]));
  }

  findAll(userId: string, status?: string) {
    let sql = `SELECT * FROM goals WHERE user_id = ?`;
    const params: any[] = [userId];
    if (status) { sql += ` AND status = ?`; params.push(status); }
    sql += ` ORDER BY created_at DESC`;
    return this.db.all<any>(sql, params).map((g) => this.format(g));
  }

  findOne(userId: string, id: string) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    return this.format(g);
  }

  update(userId: string, id: string, dto: UpdateGoalDto) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.title !== undefined) { fields.push('title = ?'); values.push(dto.title); }
    if (dto.targetAmount !== undefined) { fields.push('target_amount = ?'); values.push(dto.targetAmount); }
    if (dto.targetDate !== undefined) { fields.push('target_date = ?'); values.push(dto.targetDate); }
    if (dto.note !== undefined) { fields.push('note = ?'); values.push(dto.note); }
    if (dto.status !== undefined) { fields.push('status = ?'); values.push(dto.status); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, id);
      this.db.run(`UPDATE goals SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findOne(userId, id);
  }

  remove(userId: string, id: string) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [id, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    this.db.run(`DELETE FROM goal_contributions WHERE goal_id = ?`, [id]);
    this.db.run(`DELETE FROM goals WHERE id = ?`, [id]);
    return { message: 'هدف حذف شد.' };
  }

  getProgress(userId: string, goalId: string) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [goalId, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    const progress = this.calcProgress(goalId, g.target_amount);
    return {
      targetAmount: g.target_amount,
      status: g.status,
      ...progress,
    };
  }

  // Contributions
  addContribution(userId: string, goalId: string, dto: CreateContributionDto) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [goalId, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');

    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO goal_contributions (id, user_id, goal_id, amount, contribution_date, note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, goalId, dto.amount, dto.contributionDate, dto.note ?? null, now, now],
    );
    this.checkAutoComplete(userId, goalId, g.target_amount);
    return this.formatContribution(this.db.get<any>(`SELECT * FROM goal_contributions WHERE id = ?`, [id]));
  }

  getContributions(userId: string, goalId: string) {
    const g = this.db.get<any>(`SELECT id FROM goals WHERE id = ? AND user_id = ?`, [goalId, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    return this.db.all<any>(
      `SELECT * FROM goal_contributions WHERE goal_id = ? ORDER BY contribution_date DESC`,
      [goalId],
    ).map((c) => this.formatContribution(c));
  }

  updateContribution(userId: string, goalId: string, contributionId: string, dto: UpdateContributionDto) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [goalId, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    const c = this.db.get<any>(
      `SELECT * FROM goal_contributions WHERE id = ? AND goal_id = ?`,
      [contributionId, goalId],
    );
    if (!c) throw new NotFoundException('واریز یافت نشد.');

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.amount !== undefined) { fields.push('amount = ?'); values.push(dto.amount); }
    if (dto.contributionDate) { fields.push('contribution_date = ?'); values.push(dto.contributionDate); }
    if (dto.note !== undefined) { fields.push('note = ?'); values.push(dto.note); }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, contributionId);
      this.db.run(`UPDATE goal_contributions SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    this.checkAutoComplete(userId, goalId, g.target_amount);
    return this.formatContribution(this.db.get<any>(`SELECT * FROM goal_contributions WHERE id = ?`, [contributionId]));
  }

  deleteContribution(userId: string, goalId: string, contributionId: string) {
    const g = this.db.get<any>(`SELECT * FROM goals WHERE id = ? AND user_id = ?`, [goalId, userId]);
    if (!g) throw new NotFoundException('هدف یافت نشد.');
    const c = this.db.get<any>(
      `SELECT * FROM goal_contributions WHERE id = ? AND goal_id = ?`,
      [contributionId, goalId],
    );
    if (!c) throw new NotFoundException('واریز یافت نشد.');
    this.db.run(`DELETE FROM goal_contributions WHERE id = ?`, [contributionId]);
    return { message: 'واریز حذف شد.' };
  }

  private formatContribution(c: any) {
    return {
      id: c.id,
      goalId: c.goal_id,
      amount: c.amount,
      contributionDate: c.contribution_date,
      note: c.note,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }
}

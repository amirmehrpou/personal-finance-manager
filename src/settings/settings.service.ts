import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { UpdateSettingsDto } from './settings.dto';

@Injectable()
export class SettingsService {
  constructor(private db: DatabaseService) {}

  getSettings(userId: string) {
    const s = this.db.get<any>(
      `SELECT id, currency_display, timezone, created_at, updated_at
       FROM user_settings WHERE user_id = ?`,
      [userId],
    );
    return {
      id: s.id,
      currencyDisplay: s.currency_display,
      timezone: s.timezone,
      createdAt: s.created_at,
      updatedAt: s.updated_at,
    };
  }

  updateSettings(userId: string, dto: UpdateSettingsDto) {
    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];

    if (dto.currencyDisplay) {
      fields.push('currency_display = ?');
      values.push(dto.currencyDisplay);
    }
    if (dto.timezone) {
      fields.push('timezone = ?');
      values.push(dto.timezone);
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now);
      values.push(userId);
      this.db.run(
        `UPDATE user_settings SET ${fields.join(', ')} WHERE user_id = ?`,
        values,
      );
    }

    return this.getSettings(userId);
  }
}

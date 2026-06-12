import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private db: DatabaseService) {}

  private format(c: any) {
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      isDefault: c.is_default === 1,
      isActive: c.is_active === 1,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
    };
  }

  create(userId: string, dto: CreateCategoryDto) {
    const id = uuidv4();
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO categories (id, user_id, name, type, icon, is_default, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 0, 1, ?, ?)`,
      [id, userId, dto.name, dto.type, dto.icon ?? '📦', now, now],
    );
    return this.format(this.db.get<any>(`SELECT * FROM categories WHERE id = ?`, [id]));
  }

  findAll(userId: string, type?: string) {
    let sql = `SELECT * FROM categories WHERE user_id = ? AND is_active = 1`;
    const params: any[] = [userId];
    if (type) { sql += ` AND type = ?`; params.push(type); }
    sql += ` ORDER BY is_default DESC, name ASC`;
    return this.db.all<any>(sql, params).map((c) => this.format(c));
  }

  findOne(userId: string, id: string) {
    const c = this.db.get<any>(
      `SELECT * FROM categories WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!c) throw new NotFoundException('دسته‌بندی یافت نشد.');
    return this.format(c);
  }

  update(userId: string, id: string, dto: UpdateCategoryDto) {
    const c = this.db.get<any>(
      `SELECT * FROM categories WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!c) throw new NotFoundException('دسته‌بندی یافت نشد.');

    const now = new Date().toISOString();
    const fields: string[] = [];
    const values: any[] = [];
    if (dto.name) { fields.push('name = ?'); values.push(dto.name); }
    if (dto.icon) { fields.push('icon = ?'); values.push(dto.icon); }
    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(now, id);
      this.db.run(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);
    }
    return this.findOne(userId, id);
  }

  remove(userId: string, id: string) {
    const c = this.db.get<any>(
      `SELECT * FROM categories WHERE id = ? AND user_id = ?`,
      [id, userId],
    );
    if (!c) throw new NotFoundException('دسته‌بندی یافت نشد.');

    const now = new Date().toISOString();
    this.db.run(
      `UPDATE categories SET is_active = 0, updated_at = ? WHERE id = ?`,
      [now, id],
    );
    return { message: 'دسته‌بندی غیرفعال شد.' };
  }
}

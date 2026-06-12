import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { DatabaseService } from '../database/database.service';
import { RegisterDto, LoginDto } from './auth.dto';

const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'خوراک', icon: '🍔' },
  { name: 'حمل‌ونقل', icon: '🚗' },
  { name: 'مسکن', icon: '🏠' },
  { name: 'قبوض', icon: '📄' },
  { name: 'خرید', icon: '🛍️' },
  { name: 'سلامت', icon: '💊' },
  { name: 'آموزش', icon: '📚' },
  { name: 'تفریح', icon: '🎮' },
  { name: 'سایر', icon: '📦' },
];

const DEFAULT_INCOME_CATEGORIES = [
  { name: 'حقوق', icon: '💼' },
  { name: 'فریلنس', icon: '💻' },
  { name: 'هدیه', icon: '🎁' },
  { name: 'فروش', icon: '🏷️' },
  { name: 'سرمایه‌گذاری', icon: '📈' },
  { name: 'سایر', icon: '📦' },
];

@Injectable()
export class AuthService {
  constructor(
    private db: DatabaseService,
    private jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = this.db.get(`SELECT id FROM users WHERE email = ?`, [
      dto.email,
    ]);
    if (existing) {
      throw new ConflictException('این ایمیل قبلاً ثبت شده است.');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const userId = uuidv4();
    const now = new Date().toISOString();

    this.db.run(
      `INSERT INTO users (id, email, password_hash, first_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, dto.email, passwordHash, dto.firstName, now, now],
    );

    this.db.run(
      `INSERT INTO user_settings (id, user_id, currency_display, timezone, created_at, updated_at)
       VALUES (?, ?, 'TOMAN', 'Asia/Tehran', ?, ?)`,
      [uuidv4(), userId, now, now],
    );

    for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
      this.db.run(
        `INSERT INTO categories (id, user_id, name, type, icon, is_default, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 'EXPENSE', ?, 1, 1, ?, ?)`,
        [uuidv4(), userId, cat.name, cat.icon, now, now],
      );
    }
    for (const cat of DEFAULT_INCOME_CATEGORIES) {
      this.db.run(
        `INSERT INTO categories (id, user_id, name, type, icon, is_default, is_active, created_at, updated_at)
         VALUES (?, ?, ?, 'INCOME', ?, 1, 1, ?, ?)`,
        [uuidv4(), userId, cat.name, cat.icon, now, now],
      );
    }

    const token = this.jwt.sign({ sub: userId, email: dto.email });

    return {
      accessToken: token,
      user: {
        id: userId,
        email: dto.email,
        firstName: dto.firstName,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = this.db.get<any>(
      `SELECT id, email, password_hash, first_name FROM users WHERE email = ?`,
      [dto.email],
    );

    if (!user) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است.');
    }

    const hash = user['password_hash'];
    if (!hash) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است.');
    }

    const valid = await bcrypt.compare(dto.password, hash);
    if (!valid) {
      throw new UnauthorizedException('ایمیل یا رمز عبور اشتباه است.');
    }

    const token = this.jwt.sign({ sub: user.id, email: user.email });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user['first_name'],
      },
    };
  }

  getMe(userId: string) {
    const user = this.db.get<any>(
      `SELECT id, email, first_name, created_at FROM users WHERE id = ?`,
      [userId],
    );
    if (!user) throw new Error('User not found');
    return {
      id: user.id,
      email: user.email,
      firstName: user['first_name'],
      createdAt: user['created_at'],
    };
  }
}

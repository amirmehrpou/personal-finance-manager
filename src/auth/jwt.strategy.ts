import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private db: DatabaseService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_SECRET', 'fallback-secret'),
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = this.db.get<{ id: string; email: string; first_name: string }>(
      `SELECT id, email, first_name FROM users WHERE id = ?`,
      [payload.sub],
    );
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, firstName: user.first_name };
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { DatabaseService } from '../database/database.service';

const JWT_SECRET = 'pf-secret-2026';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private db: DatabaseService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: { sub: string; email: string }) {
    const user = this.db.get<any>(
      `SELECT id, email, first_name FROM users WHERE id = '${payload.sub}'`,
    );
    if (!user) throw new UnauthorizedException();
    return { id: user.id, email: user.email, firstName: user.first_name };
  }
}

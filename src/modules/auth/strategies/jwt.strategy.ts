import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'cmi-secret-key-change-in-production',
    });
  }

  async validate(payload: any) {
    // Verificar que el usuario existe y está activo
    const user = await this.authService.validateUser(payload.sub);
    
    if (!user) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
      tenants: payload.tenants,
    };
  }
}

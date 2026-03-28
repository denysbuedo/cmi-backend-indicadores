import { Injectable, UnauthorizedException, BadRequestException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // 1. Buscar usuario por email
    const user = await this.prisma.user.findFirst({
      where: {
        email: loginDto.email,
        active: true,
      },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Validar password
    const passwordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 3. Generar JWT token
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenants: user.tenants.map((ut) => ({
        tenantId: ut.tenantId,
        tenantCode: ut.tenant.code,
        tenantName: ut.tenant.name,
        role: ut.role,
      })),
    };

    const token = this.jwtService.sign(payload);

    // 4. Retornar datos sin password
    const { passwordHash, ...userWithoutPassword } = user;

    return {
      access_token: token,
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        fullName: userWithoutPassword.fullName,
        role: userWithoutPassword.role,
      },
      tenants: payload.tenants,
    };
  }

  async register(registerDto: RegisterDto) {
    // 1. Verificar si el email ya existe
    const existingUser = await this.prisma.user.findFirst({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // 2. Hashear password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // 3. Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        passwordHash,
        fullName: registerDto.fullName,
        role: registerDto.role || 'USER',
      },
    });

    // 4. Retornar sin password
    const { passwordHash: _, ...userWithoutPassword } = user;

    return {
      id: userWithoutPassword.id,
      email: userWithoutPassword.email,
      fullName: userWithoutPassword.fullName,
      role: userWithoutPassword.role,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    // 1. Buscar usuario
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    // 2. Validar password actual
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!passwordValid) {
      throw new BadRequestException('Password actual incorrecto');
    }

    // 3. Hashear nuevo password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // 4. Actualizar password
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    return { success: true, message: 'Password actualizado correctamente' };
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!user || !user.active) {
      return null;
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async hasTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        tenants: true,
      },
    });

    if (!user) return false;

    // SUPER_ADMIN tiene acceso a todo
    if (user.role === 'SUPER_ADMIN') return true;

    // Verificar si el usuario tiene acceso al tenant
    return user.tenants.some((ut) => ut.tenantId === tenantId);
  }
}

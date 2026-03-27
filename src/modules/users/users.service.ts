import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, user: any, createUserDto: CreateUserDto) {
    console.log('🔍 CREATE USER - Debug:', { tenantId, user, email: createUserDto.email });
    
    // 1. Validar permisos
    if (!user || user.role === 'USER') {
      console.error('❌ USER sin permisos:', user);
      throw new ForbiddenException('No tiene permisos para crear usuarios');
    }

    // 2. Si es TENANT_ADMIN, validar que solo cree en su tenant
    if (user.role === 'TENANT_ADMIN') {
      // Verificar que el tenant del header es el suyo
      const isOwnTenant = await this.validateTenantOwnership(user.userId, tenantId);
      if (!isOwnTenant) {
        throw new ForbiddenException('Solo puede crear usuarios en su tenant');
      }
    }

    // 3. Verificar si el email ya existe
    const existing = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // 4. Hashear password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // 5. Crear usuario
    const newUser = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        fullName: createUserDto.fullName,
        role: createUserDto.role || 'USER',
      },
    });

    console.log('✅ Usuario creado:', newUser.id);

    // 6. Asignar usuario al tenant automáticamente
    try {
      await this.prisma.userTenant.create({
        data: {
          userId: newUser.id,
          tenantId,
          role: 'VIEWER',
        },
      });
      console.log('✅ Usuario asignado al tenant:', tenantId);
    } catch (error) {
      console.error('❌ Error al asignar tenant:', error);
      throw error;
    }

    const { passwordHash: _, ...result } = newUser;
    return result;
  }

  // Validar que el usuario es dueño del tenant
  async validateTenantOwnership(userId: string, tenantId: string): Promise<boolean> {
    const userTenant = await this.prisma.userTenant.findFirst({
      where: {
        userId,
        tenantId,
      },
    });

    return userTenant !== null;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { active: true },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        tenants: {
          include: {
            tenant: true,
          },
        },
        processes: {
          include: {
            process: true,
          },
        },
        objectives: {
          include: {
            objective: true,
          },
        },
        indicators: {
          include: {
            indicator: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    // Verificar que existe
    await this.findOne(id);

    // Si cambia el email, verificar que no exista
    if (updateUserDto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          email: updateUserDto.email,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    // Preparar datos para actualizar
    const data: any = { ...updateUserDto };

    // Hashear password si se proporciona
    if (updateUserDto.password) {
      data.passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      delete data.password;
    }

    return this.prisma.user.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    // Verificar que existe
    await this.findOne(id);

    // Soft delete: desactivar usuario
    return this.prisma.user.update({
      where: { id },
      data: { active: false },
    });
  }

  // Asignar tenant a usuario
  async assignTenant(userId: string, tenantId: string, role: string) {
    // Verificar que el usuario existe
    await this.findOne(userId);

    // Verificar que el tenant existe
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    // Verificar si ya tiene acceso
    const existing = await this.prisma.userTenant.findFirst({
      where: { userId, tenantId },
    });

    if (existing) {
      throw new BadRequestException('El usuario ya tiene acceso a este tenant');
    }

    return this.prisma.userTenant.create({
      data: { userId, tenantId, role: role as any },
    });
  }

  // Remover tenant de usuario
  async removeTenant(userId: string, tenantId: string) {
    await this.prisma.userTenant.delete({
      where: { userId_tenantId: { userId, tenantId } },
    });

    return { success: true, message: 'Tenant removido correctamente' };
  }

  // Asignar proceso a usuario
  async assignProcess(userId: string, processId: string) {
    await this.findOne(userId);

    const process = await this.prisma.process.findUnique({
      where: { id: processId },
    });

    if (!process) {
      throw new NotFoundException('Proceso no encontrado');
    }

    return this.prisma.userProcess.create({
      data: { userId, processId },
    });
  }

  // Remover proceso de usuario
  async removeProcess(userId: string, processId: string) {
    await this.prisma.userProcess.delete({
      where: { userId_processId: { userId, processId } },
    });

    return { success: true, message: 'Proceso removido correctamente' };
  }

  // Asignar objetivo a usuario
  async assignObjective(userId: string, objectiveId: string) {
    await this.findOne(userId);

    const objective = await this.prisma.objective.findUnique({
      where: { id: objectiveId },
    });

    if (!objective) {
      throw new NotFoundException('Objetivo no encontrado');
    }

    return this.prisma.userObjective.create({
      data: { userId, objectiveId },
    });
  }

  // Remover objetivo de usuario
  async removeObjective(userId: string, objectiveId: string) {
    await this.prisma.userObjective.delete({
      where: { userId_objectiveId: { userId, objectiveId } },
    });

    return { success: true, message: 'Objetivo removido correctamente' };
  }

  // Asignar indicador a usuario
  async assignIndicator(userId: string, indicatorId: string) {
    await this.findOne(userId);

    const indicator = await this.prisma.indicator.findUnique({
      where: { id: indicatorId },
    });

    if (!indicator) {
      throw new NotFoundException('Indicador no encontrado');
    }

    return this.prisma.userIndicator.create({
      data: { userId, indicatorId },
    });
  }

  // Remover indicador de usuario
  async removeIndicator(userId: string, indicatorId: string) {
    await this.prisma.userIndicator.delete({
      where: { userId_indicatorId: { userId, indicatorId } },
    });

    return { success: true, message: 'Indicador removido correctamente' };
  }
}

import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    // Verificar si el email ya existe
    const existing = await this.prisma.user.findFirst({
      where: { email: createUserDto.email },
    });

    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hashear password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    // Crear usuario
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        passwordHash,
        fullName: createUserDto.fullName,
        role: createUserDto.role || 'USER',
      },
    });

    // Si se especificaron tenants, asignarlos
    if (createUserDto.tenantIds && createUserDto.tenantIds.length > 0) {
      await this.prisma.userTenant.createMany({
        data: createUserDto.tenantIds.map((tenantId) => ({
          userId: user.id,
          tenantId,
          role: 'VIEWER',
        })),
      });
    }

    const { passwordHash: _, ...result } = user;
    return result;
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(createTenantDto: CreateTenantDto) {
    // Verificar si el código ya existe
    const existing = await this.prisma.tenant.findFirst({
      where: { code: createTenantDto.code },
    });

    if (existing) {
      throw new BadRequestException('El código de tenant ya existe');
    }

    // Generar subdomain a partir del code si no se proporciona
    const subdomain = createTenantDto.subdomain || createTenantDto.code.toLowerCase();

    return this.prisma.tenant.create({
      data: {
        ...createTenantDto,
        subdomain,
      },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            processes: true,
            objectives: true,
            indicators: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado');
    }

    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto) {
    // Verificar que existe
    await this.findOne(id);

    // Si cambia el código, verificar que no exista
    if (updateTenantDto.code) {
      const existing = await this.prisma.tenant.findFirst({
        where: {
          code: updateTenantDto.code,
          NOT: { id },
        },
      });

      if (existing) {
        throw new BadRequestException('El código de tenant ya existe');
      }
    }

    return this.prisma.tenant.update({
      where: { id },
      data: updateTenantDto,
    });
  }

  async remove(id: string) {
    // Verificar que existe
    await this.findOne(id);

    // Soft delete: desactivar el tenant
    return this.prisma.tenant.update({
      where: { id },
      data: { active: false },
    });
  }

  async getProcesses(tenantId: string) {
    await this.findOne(tenantId);

    return this.prisma.process.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async getObjectives(tenantId: string) {
    await this.findOne(tenantId);

    return this.prisma.objective.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async getIndicators(tenantId: string) {
    await this.findOne(tenantId);

    return this.prisma.indicator.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        process: true,
        indicatorType: true,
        objectives: { include: { objective: true } },
      },
    });
  }

  async findBySubdomain(subdomain: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { 
        subdomain: subdomain.toLowerCase(),
        active: true,
      },
      include: {
        _count: {
          select: {
            processes: true,
            objectives: true,
            indicators: true,
            users: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant no encontrado para este subdominio');
    }

    return tenant;
  }
}

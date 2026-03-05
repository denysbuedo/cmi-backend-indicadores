import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) { }

  // CREATE
  async create(tenantId: string, dto: CreateProcessDto) {
    return this.prisma.process.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  // FIND ALL
  // FIND ALL (Optimizado y estratégico)
  async findAll(tenantId: string) {
    const processes = await this.prisma.process.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    const enriched = await Promise.all(
      processes.map(async (process) => {
        const aggregation = await this.prisma.indicator.aggregate({
          where: {
            tenantId,
            processId: process.id,
            deletedAt: null,
          },
          _count: {
            id: true,
          },
          _sum: {
            weight: true,
          },
        });

        return {
          ...process,
          indicatorCount: aggregation._count.id,
          totalWeight: aggregation._sum.weight ?? 0,
        };
      }),
    );

    return enriched;
  }

  // FIND ONE
  async findOne(tenantId: string, id: string) {
    const process = await this.prisma.process.findFirst({
      where: {
        id,
        tenantId,
      },
    });

    if (!process) {
      throw new NotFoundException('Process not found');
    }

    return process;
  }

  // UPDATE
  async update(
    tenantId: string,
    id: string,
    dto: UpdateProcessDto,
  ) {
    const process = await this.findOne(tenantId, id);

    return this.prisma.process.update({
      where: { id: process.id },
      data: dto,
    });
  }

  // 🔥 TOGGLE ACTIVE (VALIDACIÓN ESTRATÉGICA)
  async toggleActive(tenantId: string, id: string) {
    const process = await this.findOne(tenantId, id);

    // Si vamos a ACTIVAR (actualmente está inactivo)
    if (!process.active) {
      const totalWeight = await this.prisma.indicator.aggregate({
        where: {
          tenantId,
          processId: process.id,
          deletedAt: null,
          active: true,
        },
        _sum: {
          weight: true,
        },
      });

      const total = totalWeight._sum.weight ?? 0;

      if (total !== 100) {
        throw new BadRequestException(
          `Cannot activate process. Total indicator weight must equal 100. Current: ${total}`,
        );
      }
    }

    return this.prisma.process.update({
      where: { id: process.id },
      data: {
        active: !process.active,
      },
    });
  }

  // SOFT DELETE
  async remove(tenantId: string, id: string) {
    const process = await this.findOne(tenantId, id);

    return this.prisma.process.update({
      where: { id: process.id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  }
}
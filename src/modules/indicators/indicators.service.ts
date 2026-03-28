import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';
import { UpdateIndicatorValueDto } from './dto/update-indicator-value.dto';

@Injectable()
export class IndicatorsService {
  constructor(private prisma: PrismaService) { }

  // CREATE
  async createIndicator(tenantId: string, dto: CreateIndicatorDto) {
    const existing = await this.prisma.indicator.findFirst({
      where: {
        tenantId,
        code: dto.code,
      },
    });

    if (existing) {
      if (existing.deletedAt) {
        return this.prisma.indicator.update({
          where: { id: existing.id },
          data: {
            ...dto,
            active: true,
            deletedAt: null,
          },
        });
      }

      throw new BadRequestException('Indicator code already exists');
    }

    // 🔒 VALIDAR PESO TOTAL POR PROCESO
    const totalWeight = await this.prisma.indicator.aggregate({
      where: {
        tenantId,
        processId: dto.processId,
        deletedAt: null,
      },
      _sum: {
        weight: true,
      },
    });

    const currentWeight = totalWeight._sum.weight ?? 0;

    if (currentWeight + dto.weight > 100) {
      throw new BadRequestException(
        `Total weight for this process would exceed 100. Current: ${currentWeight}`
      );
    }

    const { objectiveIds, processId, indicatorTypeId, ...rest } = dto;

    const created = await this.prisma.indicator.create({
      data: {
        ...rest,

        tenant: {
          connect: { id: tenantId },
        },

        process: {
          connect: { id: processId },
        },

        indicatorType: {
          connect: { id: indicatorTypeId },
        },

        objectives: {
          create: objectiveIds.map((objectiveId) => ({
            objective: {
              connect: { id: objectiveId },
            },
          })),
        },
      },
    });

    return created;
  }

  // FIND ALL
  async findAllIndicators(tenantId: string) {
    return this.prisma.indicator.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      include: {
        process: true,
        indicatorType: true,
        objectives: { include: { objective: true } },
        values: {
          orderBy: { periodStart: 'asc' },
        },
      },
    });
  }

  // FIND ONE
  async findOne(tenantId: string, id: string) {
    const indicator = await this.prisma.indicator.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        process: true,
        indicatorType: true,
        objectives: { include: { objective: true } },
        values: true,
      },
    });

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    return indicator;
  }

  // UPDATE
  async updateIndicator(
    tenantId: string,
    id: string,
    dto: UpdateIndicatorDto,
  ) {
    const indicator = await this.findOne(tenantId, id);

    const newProcessId = dto.processId ?? indicator.processId;
    const newWeight = dto.weight ?? indicator.weight;

    // 🔒 VALIDAR PESO TOTAL (excluyendo el propio indicador)
    const totalWeight = await this.prisma.indicator.aggregate({
      where: {
        tenantId,
        processId: newProcessId,
        deletedAt: null,
        NOT: { id: indicator.id },
      },
      _sum: {
        weight: true,
      },
    });

    const currentWeight = totalWeight._sum.weight ?? 0;

    if (currentWeight + newWeight > 100) {
      throw new BadRequestException(
        `Total weight for this process would exceed 100. Current: ${currentWeight}`
      );
    }

    const { objectiveIds, processId, indicatorTypeId, ...rest } = dto;

    const updated = await this.prisma.indicator.update({
      where: { id: indicator.id },
      data: {
        ...rest,

        ...(processId && {
          process: { connect: { id: processId } },
        }),

        ...(indicatorTypeId && {
          indicatorType: { connect: { id: indicatorTypeId } },
        }),
      },
    });

    // 🔄 ACTUALIZAR OBJETIVOS si vienen en DTO
    if (objectiveIds) {
      await this.prisma.indicatorObjective.deleteMany({
        where: { indicatorId: indicator.id },
      });

      await this.prisma.indicatorObjective.createMany({
        data: objectiveIds.map((objectiveId) => ({
          indicatorId: indicator.id,
          objectiveId,
        })),
      });
    }

    return updated;
  }

  // TOGGLE ACTIVE
  async toggleActive(tenantId: string, id: string) {
    const indicator = await this.findOne(tenantId, id);

    return this.prisma.indicator.update({
      where: { id: indicator.id },
      data: {
        active: !indicator.active,
      },
    });
  }

  // SOFT DELETE
  async softDeleteIndicator(tenantId: string, id: string) {
    const indicator = await this.findOne(tenantId, id);

    return this.prisma.indicator.update({
      where: { id: indicator.id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  }

  // CREATE VALUE
  async createIndicatorValue(
    tenantId: string,
    indicatorId: string,
    dto: {
      value: number;
      target?: number;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    const indicator = await this.findOne(tenantId, indicatorId);

    // Manejar fechas que ya vienen completas o solo YYYY-MM-DD
    const parseDate = (dateStr: string, setEndOfDay: boolean) => {
      if (dateStr.includes('T')) {
        return new Date(dateStr);
      }
      return new Date(dateStr + (setEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
    };

    return this.prisma.indicatorValue.create({
      data: {
        indicatorId: indicator.id,
        tenantId,
        value: dto.value,
        target: dto.target ?? null,
        periodStart: parseDate(dto.periodStart, false),
        periodEnd: parseDate(dto.periodEnd, true),
        status: 'OK',
      },
    });
  }

  // HISTORY
  async getIndicatorHistory(tenantId: string, indicatorId: string) {
    return this.prisma.indicatorValue.findMany({
      where: {
        indicatorId,
        tenantId,
      },
      orderBy: { periodStart: 'asc' },
    });
  }

  // UPDATE VALUE
  async updateValue(
    tenantId: string,
    indicatorId: string,
    valueId: string,
    dto: UpdateIndicatorValueDto,
  ) {
    // 1. Validar que el indicador existe y pertenece al tenant
    const indicator = await this.findOne(tenantId, indicatorId);

    // 2. Validar que el valor existe y pertenece al indicador
    const value = await this.prisma.indicatorValue.findFirst({
      where: {
        id: valueId,
        indicatorId,
      },
    });

    if (!value) {
      throw new NotFoundException('Valor no encontrado');
    }

    // 3. Actualizar - manejar fechas que ya vienen completas o solo YYYY-MM-DD
    const parseDate = (dateStr: string, setEndOfDay: boolean) => {
      // Si ya viene con hora (ISO completo), usarlo directamente
      if (dateStr.includes('T')) {
        return new Date(dateStr);
      }
      // Si viene solo YYYY-MM-DD, agregar la hora
      return new Date(dateStr + (setEndOfDay ? 'T23:59:59.999Z' : 'T00:00:00.000Z'));
    };

    const updated = await this.prisma.indicatorValue.update({
      where: { id: valueId },
      data: {
        value: dto.value,
        target: dto.target ?? null,
        periodStart: parseDate(dto.periodStart, false),
        periodEnd: parseDate(dto.periodEnd, true),
      },
    });

    // 4. Retornar el valor actualizado
    return updated;
  }

  // DELETE VALUE
  async deleteValue(
    tenantId: string,
    indicatorId: string,
    valueId: string,
  ) {
    // 1. Validar que el indicador existe y pertenece al tenant
    const indicator = await this.findOne(tenantId, indicatorId);

    // 2. Validar que el valor existe y pertenece al indicador
    const value = await this.prisma.indicatorValue.findFirst({
      where: {
        id: valueId,
        indicatorId,
      },
    });

    if (!value) {
      throw new NotFoundException('Valor no encontrado');
    }

    // 3. Eliminar (hard delete)
    await this.prisma.indicatorValue.delete({
      where: { id: valueId },
    });

    // 4. Retornar mensaje de éxito
    return { success: true, message: 'Valor eliminado correctamente' };
  }
}
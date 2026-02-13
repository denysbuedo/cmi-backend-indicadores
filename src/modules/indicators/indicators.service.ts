import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateIndicatorTypeDto } from './dto/create-indicator-type.dto';
import { CreateProcessDto } from './dto/create-process.dto';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { CreateIndicatorDto } from './dto/create-indicator.dto';

@Injectable()
export class IndicatorsService {
  constructor(private prisma: PrismaService) {}

  // ------------------------------------------------
  // Indicator Types
  // ------------------------------------------------

  async createIndicatorType(tenantId: string, dto: CreateIndicatorTypeDto) {
    return this.prisma.indicatorType.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAllIndicatorTypes(tenantId: string) {
    return this.prisma.indicatorType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  // ------------------------------------------------
  // Processes
  // ------------------------------------------------

  async createProcess(tenantId: string, dto: CreateProcessDto) {
    return this.prisma.process.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAllProcesses(tenantId: string) {
    return this.prisma.process.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  // ------------------------------------------------
  // Objectives
  // ------------------------------------------------

  async createObjective(tenantId: string, dto: CreateObjectiveDto) {
    return this.prisma.objective.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAllObjectives(tenantId: string) {
    return this.prisma.objective.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  // ------------------------------------------------
  // Indicators
  // ------------------------------------------------

  async createIndicator(tenantId: string, dto: CreateIndicatorDto) {
    const { objectiveIds, ...indicatorData } = dto;

    return this.prisma.indicator.create({
      data: {
        ...indicatorData,
        tenantId,
        objectives: {
          create: objectiveIds.map((objectiveId) => ({
            objectiveId,
          })),
        },
      },
    });
  }

  async findAllIndicators(tenantId: string) {
    return this.prisma.indicator.findMany({
      where: { tenantId },
      include: {
        indicatorType: true,
        process: true,
        objectives: {
          include: { objective: true },
        },
        sources: {
          include: { source: true },
        },
        values: {
          orderBy: { periodStart: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  // ------------------------------------------------
  // Attach Source
  // ------------------------------------------------

  async attachSource(
    tenantId: string,
    indicatorId: string,
    sourceId: string,
    role: any,
  ) {
    const indicator = await this.prisma.indicator.findFirst({
      where: { id: indicatorId, tenantId },
    });

    if (!indicator) {
      throw new NotFoundException('Indicator not found');
    }

    return this.prisma.indicatorSource.create({
      data: {
        indicatorId,
        sourceId,
        role,
      },
    });
  }

  // ------------------------------------------------
  // Indicator Values
  // ------------------------------------------------

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
  const start = new Date(dto.periodStart);
  const end = new Date(dto.periodEnd);

  if (start > end) {
    throw new BadRequestException(
      'periodStart must be before periodEnd',
    );
  }

  const indicator = await this.prisma.indicator.findFirst({
    where: { id: indicatorId, tenantId },
  });

  if (!indicator) {
    throw new NotFoundException('Indicator not found');
  }

  // Verificar superposición
  const overlapping = await this.prisma.indicatorValue.findFirst({
    where: {
      indicatorId,
      tenantId,
      AND: [
        { periodStart: { lte: end } },
        { periodEnd: { gte: start } },
      ],
    },
  });

  if (overlapping) {
    throw new BadRequestException(
      'Period overlaps with existing record',
    );
  }

  // -----------------------------
  // Cálculo automático de estado
  // -----------------------------

  let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
  const value = Number(dto.value);

  if (dto.target !== undefined && dto.target !== null) {
    const target = Number(dto.target);

    if (value >= target) {
      status = 'OK';
    } else if (value >= target * 0.9) {
      status = 'WARNING';
    } else {
      status = 'CRITICAL';
    }
  }

  return this.prisma.indicatorValue.create({
    data: {
      indicatorId,
      tenantId,
      value,
      target: dto.target ?? null,
      periodStart: start,
      periodEnd: end,
      status,
    },
  });
}


  async getIndicatorHistory(tenantId: string, indicatorId: string) {
    return this.prisma.indicatorValue.findMany({
      where: {
        indicatorId,
        tenantId,
      },
      orderBy: { periodStart: 'asc' },
    });
  }
}

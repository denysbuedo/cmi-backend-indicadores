import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SourceRole } from '@prisma/client';

import { CreateIndicatorDto } from './dto/create-indicator.dto';
import { UpdateIndicatorDto } from './dto/update-indicator.dto';

@Injectable()
export class IndicatorsService {
  constructor(private prisma: PrismaService) {}

  // CREATE
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

  // FIND ALL
  async findAllIndicators(tenantId: string) {
    return this.prisma.indicator.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
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

  // FIND ONE
  async findOne(tenantId: string, id: string) {
    const indicator = await this.prisma.indicator.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
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
    await this.findOne(tenantId, id);

    return this.prisma.indicator.update({
      where: { id },
      data: dto,
    });
  }

  // SOFT DELETE
  async softDeleteIndicator(
    tenantId: string,
    id: string,
  ) {
    await this.findOne(tenantId, id);

    return this.prisma.indicator.update({
      where: { id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });
  }

  // ATTACH SOURCE
  async attachSource(
    tenantId: string,
    indicatorId: string,
    sourceId: string,
    role: SourceRole,
  ) {
    await this.findOne(tenantId, indicatorId);

    return this.prisma.indicatorSource.create({
      data: {
        indicatorId,
        sourceId,
        role,
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
    const start = new Date(dto.periodStart);
    const end = new Date(dto.periodEnd);

    if (start > end) {
      throw new BadRequestException(
        'periodStart must be before periodEnd',
      );
    }

    await this.findOne(tenantId, indicatorId);

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

    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    const value = Number(dto.value);

    if (dto.target !== undefined && dto.target !== null) {
      const target = Number(dto.target);

      if (value >= target) status = 'OK';
      else if (value >= target * 0.9) status = 'WARNING';
      else status = 'CRITICAL';
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

  // HISTORY
  async getIndicatorHistory(
    tenantId: string,
    indicatorId: string,
  ) {
    return this.prisma.indicatorValue.findMany({
      where: {
        indicatorId,
        tenantId,
      },
      orderBy: { periodStart: 'asc' },
    });
  }
}

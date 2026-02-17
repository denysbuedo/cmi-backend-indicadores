import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorValueDto } from './dto/create-indicator-value.dto';
import { UpdateIndicatorValueDto } from './dto/update-indicator-value.dto';

@Injectable()
export class IndicatorValueService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(
    tenantId: string,
    indicatorId: string,
    dto: CreateIndicatorValueDto,
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

    // Evitar solapamiento
    const overlap = await this.prisma.indicatorValue.findFirst({
      where: {
        indicatorId,
        tenantId,
        AND: [
          { periodStart: { lte: end } },
          { periodEnd: { gte: start } },
        ],
      },
    });

    if (overlap) {
      throw new BadRequestException(
        'Period overlaps with existing record',
      );
    }

    const value = Number(dto.value);
    const target = dto.target ? Number(dto.target) : null;

    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';

    if (target !== null) {
      if (indicator.evaluationDirection === 'HIGHER_IS_BETTER') {
        if (value >= target) status = 'OK';
        else if (value >= target * 0.9) status = 'WARNING';
        else status = 'CRITICAL';
      } else {
        if (value <= target) status = 'OK';
        else if (value <= target * 1.1) status = 'WARNING';
        else status = 'CRITICAL';
      }
    }

    return this.prisma.indicatorValue.create({
      data: {
        indicatorId,
        tenantId,
        value,
        target,
        periodStart: start,
        periodEnd: end,
        status,
      },
    });
  }

  // LIST
  async findByIndicator(
    tenantId: string,
    indicatorId: string,
  ) {
    return this.prisma.indicatorValue.findMany({
      where: { indicatorId, tenantId },
      orderBy: { periodStart: 'asc' },
    });
  }

  // UPDATE
  async update(
    tenantId: string,
    id: string,
    dto: UpdateIndicatorValueDto,
  ) {
    const value = await this.prisma.indicatorValue.findFirst({
      where: { id, tenantId },
    });

    if (!value) {
      throw new NotFoundException(
        'IndicatorValue not found',
      );
    }

    return this.prisma.indicatorValue.update({
      where: { id },
      data: {
        ...dto,
        periodStart: dto.periodStart
          ? new Date(dto.periodStart)
          : undefined,
        periodEnd: dto.periodEnd
          ? new Date(dto.periodEnd)
          : undefined,
      },
    });
  }

  // DELETE
  async remove(tenantId: string, id: string) {
    const result = await this.prisma.indicatorValue.deleteMany({
      where: { id, tenantId },
    });

    if (result.count === 0) {
      throw new NotFoundException(
        'IndicatorValue not found',
      );
    }

    return { message: 'Deleted successfully' };
  }
}

import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateIndicatorTypeDto } from './dto/create-indicator-type.dto';
import { UpdateIndicatorTypeDto } from './dto/update-indicator-type.dto';

@Injectable()
export class IndicatorTypeService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateIndicatorTypeDto) {
    return this.prisma.indicatorType.create({
      data: {
        ...dto,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.indicatorType.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const entity = await this.prisma.indicatorType.findFirst({
      where: { id, tenantId },
    });

    if (!entity) {
      throw new NotFoundException('IndicatorType not found');
    }

    return entity;
  }

  async update(
    tenantId: string,
    id: string,
    dto: UpdateIndicatorTypeDto,
  ) {
    const result = await this.prisma.indicatorType.updateMany({
      where: { id, tenantId },
      data: dto,
    });

    if (result.count === 0) {
      throw new NotFoundException('IndicatorType not found');
    }

    return this.findOne(tenantId, id);
  }

  async remove(tenantId: string, id: string) {
    const result = await this.prisma.indicatorType.deleteMany({
      where: { id, tenantId },
    });

    if (result.count === 0) {
      throw new NotFoundException('IndicatorType not found');
    }

    return { message: 'IndicatorType deleted successfully' };
  }
}

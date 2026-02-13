import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSourceDto } from './dto/create-source.dto';

@Injectable()
export class SourcesService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateSourceDto) {
    return this.prisma.source.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.source.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(tenantId: string, id: string) {
    const source = await this.prisma.source.findFirst({
      where: { id, tenantId },
    });

    if (!source) {
      throw new NotFoundException('Source not found');
    }

    return source;
  }
}

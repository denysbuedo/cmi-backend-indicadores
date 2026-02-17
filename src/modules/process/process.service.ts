import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

@Injectable()
export class ProcessService {
  constructor(private prisma: PrismaService) {}

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
  async findAll(tenantId: string) {
    return this.prisma.process.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  // FIND ONE
  async findOne(tenantId: string, id: string) {
    const process = await this.prisma.process.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
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

  // SOFT DELETE
  async remove(tenantId: string, id: string) {
    const process = await this.findOne(tenantId, id);

    await this.prisma.process.update({
      where: { id: process.id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'Process soft deleted successfully' };
  }
}

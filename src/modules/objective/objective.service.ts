import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateObjectiveDto } from './dto/create-objective.dto';
import { UpdateObjectiveDto } from './dto/update-objective.dto';

@Injectable()
export class ObjectiveService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(tenantId: string, dto: CreateObjectiveDto) {
    return this.prisma.objective.create({
      data: {
        ...dto,
        tenantId,
      },
    });
  }

  // FIND ALL
  async findAll(tenantId: string) {
    return this.prisma.objective.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }

  // FIND ONE
  async findOne(tenantId: string, id: string) {
    const objective = await this.prisma.objective.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
    });

    if (!objective) {
      throw new NotFoundException('Objective not found');
    }

    return objective;
  }

  // UPDATE
  async update(
    tenantId: string,
    id: string,
    dto: UpdateObjectiveDto,
  ) {
    const objective = await this.findOne(tenantId, id);

    return this.prisma.objective.update({
      where: { id: objective.id },
      data: dto,
    });
  }

  // SOFT DELETE
  async remove(tenantId: string, id: string) {
    const objective = await this.findOne(tenantId, id);

    await this.prisma.objective.update({
      where: { id: objective.id },
      data: {
        active: false,
        deletedAt: new Date(),
      },
    });

    return { message: 'Objective soft deleted successfully' };
  }
}

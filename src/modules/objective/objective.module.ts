import { Module } from '@nestjs/common';
import { ObjectiveService } from './objective.service';
import { ObjectiveController } from './objective.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ObjectiveController],
  providers: [ObjectiveService],
})
export class ObjectiveModule {}

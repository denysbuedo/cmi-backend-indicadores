import { Module } from '@nestjs/common';
import { ExecutionService } from './execution.service';
import { ExecutionController } from './execution.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [PrismaModule, HttpModule],
  providers: [ExecutionService],
  controllers: [ExecutionController],
  exports: [ExecutionService], // 👈 IMPORTANTE
})
export class ExecutionModule {}

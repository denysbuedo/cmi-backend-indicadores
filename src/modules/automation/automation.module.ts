import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [PrismaModule, ExecutionModule], // 👈 IMPORTA el módulo
  providers: [AutomationService],
})
export class AutomationModule {}

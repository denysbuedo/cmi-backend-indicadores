import { Controller, Post, Param, Req } from '@nestjs/common';
import type { Request } from 'express';
import { ExecutionService } from './execution.service';

@Controller('execution')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('indicator/:id/run')
  runIndicator(
    @Req() req: Request,
    @Param('id') indicatorId: string,
  ) {
    const tenantId = (req as any).tenantId;
    return this.executionService.executeIndicator(
      tenantId,
      indicatorId,
    );
  }
}

import { Controller, Get, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import type { Request } from 'express';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  getSummary(@Req() req: Request) {
    return this.dashboardService.getSummary(req['tenantId']);
  }

  @Get('overdue')
  getOverdue(@Req() req: Request) {
    return this.dashboardService.getOverdueIndicators(
      req['tenantId'],
    );
  }

  @Get('execution-stats')
  getExecutionStats(@Req() req: Request) {
    return this.dashboardService.getExecutionStats(
      req['tenantId'],
    );
  }

  @Get('executive')
  getExecutive(@Req() req: Request) {
    return this.dashboardService.getExecutiveDashboard(
      req['tenantId'],
    );
  }

  @Get('process-heatmap')
  getProcessHeatmap(@Req() req: Request) {
    return this.dashboardService.getProcessHeatmap(
      req['tenantId'],
    );
  }

  @Get('objective-scores')
  getObjectiveScores(@Req() req: Request) {
    return this.dashboardService.getObjectiveScores(
      req['tenantId'],
    );
  }
}

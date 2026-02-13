import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // ---------------------------------------
  // SUMMARY
  // ---------------------------------------
  @Get('summary')
  getSummary(@Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.dashboardService.getSummary(tenantId);
  }

  // ---------------------------------------
  // OVERDUE
  // ---------------------------------------
  @Get('overdue')
  getOverdue(@Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.dashboardService.getOverdueIndicators(tenantId);
  }

  // ---------------------------------------
  // EXECUTION STATS
  // ---------------------------------------
  @Get('executions')
  getExecutionStats(@Req() req: Request) {
    const tenantId = (req as any).tenantId;
    return this.dashboardService.getExecutionStats(tenantId);
  }

  @Get('executive')
  getExecutive(@Req() req: any) {
    return this.dashboardService.getExecutiveDashboard(req.tenantId);
  }
}

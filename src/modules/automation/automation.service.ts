import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { ExecutionService } from '../execution/execution.service';

@Injectable()
export class AutomationService {
  constructor(
    private prisma: PrismaService,
    private executionService: ExecutionService,
  ) {}

  // Ejecutar cada día a las 2 AM
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async runScheduledIndicators() {
    console.log('Running scheduled indicators...');

    const tenants = await this.prisma.tenant.findMany({
      where: { active: true },
    });

    for (const tenant of tenants) {
      const indicators = await this.prisma.indicator.findMany({
        where: {
          tenantId: tenant.id,
          active: true,
        },
        include: {
          values: {
            orderBy: { periodEnd: 'desc' },
            take: 1,
          },
        },
      });

      for (const indicator of indicators) {
        const lastValue = indicator.values[0];
        const now = new Date();

        let shouldRun = false;

        if (!lastValue) {
          shouldRun = true;
        } else {
          const lastEnd = lastValue.periodEnd;
          let expectedNext = new Date(lastEnd);

          if (indicator.frequencyDays) {
            expectedNext.setDate(
              expectedNext.getDate() + indicator.frequencyDays,
            );
          } else if (indicator.frequencyMonths) {
            expectedNext.setMonth(
              expectedNext.getMonth() + indicator.frequencyMonths,
            );
          }

          if (now > expectedNext) {
            shouldRun = true;
          }
        }

        if (shouldRun) {
          console.log(
            `Executing indicator ${indicator.code} for tenant ${tenant.code}`,
          );

          await this.executionService.executeIndicator(
            tenant.id,
            indicator.id,
          );
        }
      }
    }
  }
}

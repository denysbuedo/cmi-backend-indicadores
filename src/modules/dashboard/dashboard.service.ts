import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // BASIC SUMMARY
  // =====================================================
  async getSummary(tenantId: string) {
    const totalIndicators = await this.prisma.indicator.count({
      where: { tenantId },
    });

    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId },
      include: {
        values: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
    });

    let ok = 0;
    let warning = 0;
    let critical = 0;
    let totalWithValues = 0;
    let lastUpdate: Date | null = null;

    for (const indicator of indicators) {
      if (indicator.values.length === 0) continue;

      totalWithValues++;
      const latest = indicator.values[0];

      if (!lastUpdate || latest.periodEnd > lastUpdate) {
        lastUpdate = latest.periodEnd;
      }

      if (latest.status === 'OK') ok++;
      if (latest.status === 'WARNING') warning++;
      if (latest.status === 'CRITICAL') critical++;
    }

    return {
      totalIndicators,
      totalWithValues,
      status: { OK: ok, WARNING: warning, CRITICAL: critical },
      lastUpdate,
    };
  }

  // =====================================================
  // OVERDUE INDICATORS
  // =====================================================
  async getOverdueIndicators(tenantId: string) {
    const now = new Date();

    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, active: true },
      include: {
        values: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
    });

    const overdue: any[] = [];

    for (const indicator of indicators) {
      if (indicator.values.length === 0) continue;

      const lastValue = indicator.values[0];
      const lastEnd = lastValue.periodEnd;

      let expectedNextUpdate = new Date(lastEnd);

      if (indicator.frequencyDays) {
        expectedNextUpdate.setDate(
          expectedNextUpdate.getDate() + indicator.frequencyDays,
        );
      } else if (indicator.frequencyMonths) {
        expectedNextUpdate.setMonth(
          expectedNextUpdate.getMonth() + indicator.frequencyMonths,
        );
      } else {
        continue;
      }

      if (now > expectedNextUpdate) {
        const diffMs = now.getTime() - expectedNextUpdate.getTime();
        const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        overdue.push({
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          lastPeriodEnd: lastEnd,
          expectedNextUpdate,
          daysLate,
        });
      }
    }

    return {
      total: overdue.length,
      indicators: overdue,
    };
  }

  // =====================================================
  // EXECUTION STATS
  // =====================================================
  async getExecutionStats(tenantId: string) {
    const totalExecutions = await this.prisma.executionLog.count({
      where: { tenantId },
    });

    const okExecutions = await this.prisma.executionLog.count({
      where: { tenantId, status: 'OK' },
    });

    const warningExecutions = await this.prisma.executionLog.count({
      where: { tenantId, status: 'WARNING' },
    });

    const criticalExecutions = await this.prisma.executionLog.count({
      where: { tenantId, status: 'CRITICAL' },
    });

    return {
      totalExecutions,
      okExecutions,
      warningExecutions,
      criticalExecutions,
    };
  }

  // =====================================================
  // EXECUTIVE DASHBOARD
  // =====================================================
  async getExecutiveDashboard(tenantId: string) {
    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId },
      include: {
        values: {
          orderBy: { periodEnd: 'desc' },
          take: 6,
        },
      },
    });

    let ok = 0;
    let warning = 0;
    let critical = 0;

    const detailed = indicators.map((indicator) => {
      const latest = indicator.values[0];
      const previous = indicator.values[1];

      if (!latest) {
        return {
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          unit: indicator.unit,
          latestValue: null,
          target: null,
          compliancePercent: null,
          previousValue: null,
          variationPercent: null,
          trend: 'NO_DATA',
          status: 'NO_DATA',
          lastUpdate: null,
          history: [],
        };
      }

      const latestValue = Number(latest.value);
      const target = latest.target ? Number(latest.target) : null;

      // Compliance %
      let compliancePercent: number | null = null;
      if (target && target !== 0) {
        compliancePercent = (latestValue / target) * 100;
      }

      // Variation %
      let variationPercent: number | null = null;
      let trend = 'STABLE';

      if (previous) {
        const prevValue = Number(previous.value);
        if (prevValue !== 0) {
          variationPercent =
            ((latestValue - prevValue) / prevValue) * 100;
        }

        if (latestValue > prevValue) trend = 'UP';
        if (latestValue < prevValue) trend = 'DOWN';
      }

      // Status counters
      if (latest.status === 'OK') ok++;
      if (latest.status === 'WARNING') warning++;
      if (latest.status === 'CRITICAL') critical++;

      // History (last 6 periods)
      const history = indicator.values.map((v) => ({
        periodEnd: v.periodEnd,
        value: Number(v.value),
        target: v.target ? Number(v.target) : null,
        status: v.status,
      }));

      return {
        id: indicator.id,
        code: indicator.code,
        name: indicator.name,
        unit: indicator.unit,
        latestValue,
        target,
        compliancePercent,
        previousValue: previous ? Number(previous.value) : null,
        variationPercent,
        trend,
        status: latest.status,
        lastUpdate: latest.periodEnd,
        history,
      };
    });

    // Order by criticality
    const priority: Record<string, number> = {
      CRITICAL: 1,
      WARNING: 2,
      OK: 3,
      NO_DATA: 4,
    };

    detailed.sort(
      (a, b) =>
        (priority[a.status] || 5) -
        (priority[b.status] || 5),
    );

    // Executive Score (0–100)
    const complianceValues = detailed
      .filter((i) => i.compliancePercent !== null)
      .map((i) => i.compliancePercent as number);

    let executiveScore: number | null = null;

    if (complianceValues.length > 0) {
      const avg =
        complianceValues.reduce((a, b) => a + b, 0) /
        complianceValues.length;

      executiveScore = Math.round(Math.min(avg, 100));
    }

    return {
      summary: {
        totalIndicators: indicators.length,
        ok,
        warning,
        critical,
      },
      executiveScore,
      indicators: detailed,
    };
  }
}

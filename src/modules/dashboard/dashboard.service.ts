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
      if (!indicator.values.length) continue;

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
      if (!indicator.values.length) continue;

      const lastEnd = indicator.values[0].periodEnd;
      const nextExpected = new Date(lastEnd);

      if (indicator.frequencyDays) {
        nextExpected.setDate(
          nextExpected.getDate() + indicator.frequencyDays,
        );
      } else if (indicator.frequencyMonths) {
        nextExpected.setMonth(
          nextExpected.getMonth() + indicator.frequencyMonths,
        );
      } else {
        continue;
      }

      if (now > nextExpected) {
        const diffMs = now.getTime() - nextExpected.getTime();
        const daysLate = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        overdue.push({
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          lastPeriodEnd: lastEnd,
          expectedNextUpdate: nextExpected,
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
  // EXECUTIVE DASHBOARD (GLOBAL)
  // =====================================================
  async getExecutiveDashboard(tenantId: string) {
    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, active: true },
      include: {
        values: {
          orderBy: { periodEnd: 'asc' },
        },
      },
    });

    let ok = 0;
    let warning = 0;
    let critical = 0;

    const detailed = indicators.map((indicator) => {
      if (!indicator.values.length) {
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
          weight: indicator.weight ?? 1,
          history: [],
        };
      }

      const latest = indicator.values[indicator.values.length - 1];
      const previous =
        indicator.values.length > 1
          ? indicator.values[indicator.values.length - 2]
          : null;

      const latestValue = Number(latest.value);
      const target = latest.target ? Number(latest.target) : null;

      let compliancePercent: number | null = null;

      if (target && target !== 0) {
        if (indicator.evaluationDirection === 'HIGHER_IS_BETTER') {
          compliancePercent = (latestValue / target) * 100;
        } else {
          compliancePercent = (target / latestValue) * 100;
        }

        compliancePercent = Math.min(compliancePercent, 100);
      }

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

      if (latest.status === 'OK') ok++;
      if (latest.status === 'WARNING') warning++;
      if (latest.status === 'CRITICAL') critical++;

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
        weight: indicator.weight ?? 1,
        history,
      };
    });

    const valid = detailed.filter(
      (i) => i.compliancePercent !== null,
    );

    let executiveScore: number | null = null;

    if (valid.length > 0) {
      const weightedSum = valid.reduce(
        (acc, i) =>
          acc +
          (i.compliancePercent as number) *
            (i.weight ?? 1),
        0,
      );

      const totalWeight = valid.reduce(
        (acc, i) => acc + (i.weight ?? 1),
        0,
      );

      executiveScore = Math.round(
        Math.min(weightedSum / totalWeight, 100),
      );
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

  // =====================================================
  // PROCESS HEATMAP
  // =====================================================
  async getProcessHeatmap(tenantId: string) {
    const processes = await this.prisma.process.findMany({
      where: { tenantId },
      include: {
        indicators: {
          where: { active: true },
          include: {
            values: {
              orderBy: { periodEnd: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return processes.map((process) => {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const indicator of process.indicators) {
        const latest = indicator.values[0];
        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'HIGHER_IS_BETTER'
            ? (value / target) * 100
            : (target / value) * 100;

        compliance = Math.min(compliance, 100);

        weightedSum += compliance * (indicator.weight ?? 1);
        totalWeight += indicator.weight ?? 1;
      }

      return {
        process: process.name,
        executiveScore:
          totalWeight > 0
            ? Math.round(weightedSum / totalWeight)
            : null,
      };
    });
  }

  // =====================================================
  // OBJECTIVE SCORES
  // =====================================================
  async getObjectiveScores(tenantId: string) {
    const objectives = await this.prisma.objective.findMany({
      where: { tenantId },
      include: {
        indicators: {
          include: {
            indicator: {
              include: {
                values: {
                  orderBy: { periodEnd: 'desc' },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });

    return objectives.map((objective) => {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const link of objective.indicators) {
        const indicator = link.indicator;
        const latest = indicator.values[0];
        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'HIGHER_IS_BETTER'
            ? (value / target) * 100
            : (target / value) * 100;

        compliance = Math.min(compliance, 100);

        weightedSum += compliance * (indicator.weight ?? 1);
        totalWeight += indicator.weight ?? 1;
      }

      return {
        objective: objective.name,
        executiveScore:
          totalWeight > 0
            ? Math.round(weightedSum / totalWeight)
            : null,
      };
    });
  }
}

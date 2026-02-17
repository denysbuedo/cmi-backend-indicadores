import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // =====================================================
  // SUMMARY
  // =====================================================
  async getSummary(tenantId: string) {
    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, deletedAt: null },
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

    for (const indicator of indicators) {
      const latest = indicator.values[0];
      if (!latest) continue;

      if (latest.status === 'OK') ok++;
      if (latest.status === 'WARNING') warning++;
      if (latest.status === 'CRITICAL') critical++;
    }

    return {
      totalIndicators: indicators.length,
      ok,
      warning,
      critical,
    };
  }

  // =====================================================
  // OVERDUE
  // =====================================================
  async getOverdueIndicators(tenantId: string) {
    const now = new Date();

    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, deletedAt: null },
      include: {
        values: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
    });

    const result: any[] = [];

    for (const indicator of indicators) {
      const latest = indicator.values[0];
      if (!latest) continue;

      const next = new Date(latest.periodEnd);

      if (indicator.frequencyDays) {
        next.setDate(next.getDate() + indicator.frequencyDays);
      } else if (indicator.frequencyMonths) {
        next.setMonth(next.getMonth() + indicator.frequencyMonths);
      } else {
        continue;
      }

      if (now > next) {
        result.push({
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          expectedNextUpdate: next,
        });
      }
    }

    return result;
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
      where: { tenantId, deletedAt: null },
      include: {
        process: true,
        objectives: {
          include: { objective: true },
        },
        values: {
          orderBy: { periodEnd: 'desc' },
        },
      },
    });

    let weightedSum = 0;
    let totalWeight = 0;

    const detailed = indicators.map((indicator) => {
      const latest = indicator.values[0];
      const previous = indicator.values[1];

      if (!latest) {
        return {
          id: indicator.id,
          code: indicator.code,
          name: indicator.name,
          unit: indicator.unit,
          processId: indicator.process.id,
          processName: indicator.process.name,
          latestValue: null,
          compliancePercent: null,
          status: 'NO_DATA',
          history: [],
        };
      }

      const value = Number(latest.value);
      const target = latest.target ? Number(latest.target) : null;

      let compliance: number | null = null;

      if (target && target !== 0) {
        compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, Math.min(100, compliance));
      }

      if (compliance !== null) {
        const weight = indicator.weight ?? 1;
        weightedSum += compliance * weight;
        totalWeight += weight;
      }

      const history = indicator.values
        .slice()
        .sort(
          (a, b) =>
            a.periodEnd.getTime() - b.periodEnd.getTime(),
        )
        .map((v) => ({
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
        processId: indicator.process.id,
        processName: indicator.process.name,
        latestValue: value,
        compliancePercent: compliance,
        status: latest.status,
        history,
      };
    });

    const executiveScore =
      totalWeight > 0
        ? Math.round(weightedSum / totalWeight)
        : null;

    return {
      summary: {
        totalIndicators: detailed.length,
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
      where: { tenantId, deletedAt: null },
      include: {
        indicators: {
          where: { deletedAt: null },
          include: {
            values: {
              orderBy: { periodEnd: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    const result: any[] = [];

    for (const process of processes) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const indicator of process.indicators) {
        const latest = indicator.values[0];
        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, Math.min(100, compliance));

        const weight = indicator.weight ?? 1;
        weightedSum += compliance * weight;
        totalWeight += weight;
      }

      const score =
        totalWeight > 0
          ? Math.round(weightedSum / totalWeight)
          : null;

      result.push({
        processId: process.id,
        processCode: process.code,
        processName: process.name,
        score,
      });
    }

    return result;
  }

  // =====================================================
  // OBJECTIVE SCORES
  // =====================================================
  async getObjectiveScores(tenantId: string) {
    const objectives = await this.prisma.objective.findMany({
      where: { tenantId, deletedAt: null },
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

    const result: any[] = [];

    for (const objective of objectives) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const link of objective.indicators) {
        const indicator = link.indicator;
        const latest = indicator.values[0];
        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, Math.min(100, compliance));

        const weight = indicator.weight ?? 1;
        weightedSum += compliance * weight;
        totalWeight += weight;
      }

      const score =
        totalWeight > 0
          ? Math.round(weightedSum / totalWeight)
          : null;

      result.push({
        objectiveId: objective.id,
        objectiveCode: objective.code,
        objectiveName: objective.name,
        score,
      });
    }

    return result;
  }
}

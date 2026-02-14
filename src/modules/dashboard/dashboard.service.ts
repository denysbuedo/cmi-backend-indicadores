import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) { }

  // =====================================================
  // SUMMARY
  // =====================================================
  async getSummary(tenantId: string) {
    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, active: true },
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
      where: { tenantId, active: true },
      include: {
        values: {
          orderBy: { periodEnd: 'desc' },
          take: 1,
        },
      },
    });

    const result: {
      id: string;
      code: string;
      name: string;
      expectedNextUpdate: Date;
    }[] = [];

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

  async getExecutiveDashboard(tenantId: string) {
    const indicators = await this.prisma.indicator.findMany({
      where: { tenantId, active: true },
      include: {
        process: true,
        objectives: {
          include: {
            objective: true,
          },
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
          processCode: indicator.process.code,
          processName: indicator.process.name,

          objectives: indicator.objectives.map((o) => ({
            objectiveId: o.objective.id,
            objectiveCode: o.objective.code,
            objectiveName: o.objective.name,
          })),

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

      let variationPercent: number | null = null;
      let trend = 'STABLE';

      if (previous) {
        const prevValue = Number(previous.value);
        if (prevValue !== 0) {
          variationPercent =
            ((value - prevValue) / prevValue) * 100;
        }

        if (value > prevValue) trend = 'UP';
        if (value < prevValue) trend = 'DOWN';
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
        processCode: indicator.process.code,
        processName: indicator.process.name,

        objectives: indicator.objectives.map((o) => ({
          objectiveId: o.objective.id,
          objectiveCode: o.objective.code,
          objectiveName: o.objective.name,
        })),

        latestValue: value,
        target,
        compliancePercent: compliance,
        previousValue: previous
          ? Number(previous.value)
          : null,
        variationPercent,
        trend,
        status: latest.status,
        lastUpdate: latest.periodEnd,
        history,
      };
    });

    const executiveScore =
      totalWeight > 0
        ? Math.round(weightedSum / totalWeight)
        : null;

    let ok = 0;
    let warning = 0;
    let critical = 0;

    for (const i of detailed) {
      if (i.status === 'OK') ok++;
      if (i.status === 'WARNING') warning++;
      if (i.status === 'CRITICAL') critical++;
    }

    return {
      summary: {
        totalIndicators: detailed.length,
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
      where: { tenantId, active: true },
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

    const result: {
      processId: string;
      processCode: string;
      processName: string;
      score: number | null;
      status: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
    }[] = [];

    for (const process of processes) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const indicator of process.indicators) {
        const latest = indicator.values[0];
        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        if (target === 0) continue;

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

      let status: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA' =
        'NO_DATA';

      if (score !== null) {
        if (score >= 80) status = 'OK';
        else if (score >= 60) status = 'WARNING';
        else status = 'CRITICAL';
      }

      result.push({
        processId: process.id,
        processCode: process.code,
        processName: process.name,
        score,
        status,
      });
    }

    return result;
  }

  // =====================================================
  // OBJECTIVE SCORES
  // =====================================================
  async getObjectiveScores(tenantId: string) {
    const objectives = await this.prisma.objective.findMany({
      where: { tenantId, active: true },
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

    const result: {
      objectiveId: string;
      objectiveCode: string;
      objectiveName: string;
      score: number | null;
    }[] = [];

    for (const objective of objectives) {
      let weightedSum = 0;
      let totalWeight = 0;

      for (const link of objective.indicators) {
        const indicator = link.indicator;
        const latest = indicator.values[0];

        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        if (target === 0) continue;

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

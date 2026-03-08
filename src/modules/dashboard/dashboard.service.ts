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
  // EXECUTIVE DASHBOARD (UPDATED WITH PROCESSES)
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
          weight: indicator.weight,
          objectives: indicator.objectives,

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

        // 🔥 Permitimos sobrecumplimiento
        compliance = Math.max(0, compliance);
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
        weight: indicator.weight,
        objectives: indicator.objectives, // 🔥 IMPORTANTE

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
        ? Number((weightedSum / totalWeight).toFixed(2))
        : null;

    // =====================================================
    // PROCESSES INFORMATION
    // =====================================================
    const processes = await this.prisma.process.findMany({
      where: { tenantId, deletedAt: null, active: true },
      include: {
        indicators: {
          where: { deletedAt: null, active: true },
          include: {
            values: {
              orderBy: { periodEnd: 'desc' },
              take: 2,
            },
          },
        },
      },
    });

    const processList = processes.map((process) => {
      const processIndicators = indicators.filter(
        (i) => i.processId === process.id,
      );

      let processWeightedSum = 0;
      let processTotalWeight = 0;
      let previousWeightedSum = 0;
      let previousTotalWeight = 0;

      for (const indicator of processIndicators) {
        const latest = indicator.values[0];
        const previous = indicator.values[1];

        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, compliance);

        const weight = indicator.weight ?? 1;
        processWeightedSum += compliance * weight;
        processTotalWeight += weight;

        // Cálculo período anterior para tendencia
        if (previous && previous.target) {
          const prevValue = Number(previous.value);
          const prevTarget = Number(previous.target);

          if (prevTarget !== 0) {
            const prevCompliance =
              indicator.evaluationDirection === 'LOWER_IS_BETTER'
                ? (prevTarget / prevValue) * 100
                : (prevValue / prevTarget) * 100;

            previousWeightedSum += prevCompliance * weight;
            previousTotalWeight += weight;
          }
        }
      }

      const score =
        processTotalWeight > 0
          ? processWeightedSum / processTotalWeight
          : 0;

      const previousScore =
        previousTotalWeight > 0
          ? previousWeightedSum / previousTotalWeight
          : null;

      let status: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA' = 'NO_DATA';
      if (processIndicators.length > 0) {
        if (score >= 80) status = 'OK';
        else if (score >= 60) status = 'WARNING';
        else status = 'CRITICAL';
      }

      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
      if (score > 0 && previousScore != null) {
        if (score > previousScore + 5) trend = 'UP';
        else if (score < previousScore - 5) trend = 'DOWN';
      }

      return {
        id: process.id,
        code: process.code,
        name: process.name,
        score: parseFloat(score.toFixed(1)),
        status,
        indicatorCount: processIndicators.length,
        trend,
      };
    });

    // Calcular resumen de procesos
    const totalOk = processList.filter((p) => p.status === 'OK').length;
    const totalWarning = processList.filter((p) => p.status === 'WARNING').length;
    const totalCritical = processList.filter((p) => p.status === 'CRITICAL').length;

    const avgScore =
      processList.length > 0
        ? parseFloat(
            (
              processList.reduce((sum, p) => sum + p.score, 0) / processList.length
            ).toFixed(1),
          )
        : 0;

    const processSummary = {
      total: processList.length,
      ok: totalOk,
      warning: totalWarning,
      critical: totalCritical,
      avgScore,
      list: processList,
    };

    // =====================================================
    // OBJECTIVES INFORMATION
    // =====================================================
    const objectives = await this.prisma.objective.findMany({
      where: { tenantId, deletedAt: null, active: true },
      include: {
        indicators: {
          include: {
            indicator: true,
          },
        },
      },
    });

    const objectiveList = objectives.map((objective) => {
      const objectiveIndicators = objective.indicators.map(
        (link) => link.indicator,
      );

      // Filtrar indicadores con datos de cumplimiento
      const indicatorsWithCompliance = indicators.filter((i) =>
        objective.indicators.some((link) => link.indicatorId === i.id),
      );

      let totalWeight = 0;
      let weightedScore = 0;

      let okCount = 0;
      let warningCount = 0;
      let criticalCount = 0;

      for (const indicator of indicatorsWithCompliance) {
        const latest = indicator.values[0];

        if (!latest || !latest.target) continue;

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, compliance);

        const weight = indicator.weight ?? 1;
        weightedScore += compliance * weight;
        totalWeight += weight;

        // Contar estados para worstStatus
        if (latest.status === 'OK') okCount++;
        else if (latest.status === 'WARNING') warningCount++;
        else if (latest.status === 'CRITICAL') criticalCount++;
      }

      const score =
        totalWeight > 0 ? weightedScore / totalWeight : 0;

      // Determinar el peor estado
      let worstStatus: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
      if (criticalCount > 0) {
        worstStatus = 'CRITICAL';
      } else if (warningCount > 0) {
        worstStatus = 'WARNING';
      }

      return {
        objectiveId: objective.id,
        objectiveCode: objective.code,
        objectiveName: objective.name,
        weightedScore: parseFloat(score.toFixed(1)),
        worstStatus,
        indicatorCount: indicatorsWithCompliance.length,
      };
    });

    return {
      summary: {
        totalIndicators: detailed.length,
      },
      executiveScore,
      indicators: detailed,
      processes: processSummary,
      objectives: objectiveList,
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
              take: 2, // 🔥 para tendencia
            },
          },
        },
      },
    });

    const result: any[] = [];

    for (const process of processes) {
      let weightedSum = 0;
      let totalWeight = 0;

      let okCount = 0;
      let evaluableCount = 0;
      let noDataCount = 0;

      let variationAccumulator = 0;
      let variationCount = 0;

      for (const indicator of process.indicators) {
        const latest = indicator.values[0];
        const previous = indicator.values[1];

        if (!latest || !latest.target) {
          noDataCount++;
          continue;
        }

        const value = Number(latest.value);
        const target = Number(latest.target);

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        compliance = Math.max(0, compliance); // 🔥 permitimos sobrecumplimiento

        const weight = indicator.weight ?? 1;

        weightedSum += compliance * weight;
        totalWeight += weight;

        evaluableCount++;

        if (latest.status === 'OK') okCount++;

        // 🔥 tendencia
        if (
          previous &&
          previous.value != null &&
          Number(previous.value) !== 0
        ) {
          const variation =
            ((Number(latest.value) - Number(previous.value)) /
              Number(previous.value)) *
            100;

          variationAccumulator += variation;
          variationCount++;
        }
      }

      const score =
        totalWeight > 0
          ? weightedSum / totalWeight
          : null;

      const okPercent =
        evaluableCount > 0
          ? (okCount / evaluableCount) * 100
          : 0;

      const avgVariation =
        variationCount > 0
          ? variationAccumulator / variationCount
          : null;

      let status: string = 'NO_DATA';

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
        indicatorCount: process.indicators.length,
        evaluableCount,
        noDataCount,
        okPercent,
        trend:
          avgVariation == null
            ? 'FLAT'
            : avgVariation > 0
              ? 'UP'
              : avgVariation < 0
                ? 'DOWN'
                : 'FLAT',
      });
    }

    return result;
  }

  // =====================================================
  // OBJECTIVE SCORES (Enterprise - Clean Counts)
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
                  take: 2, // 👈 necesitamos 2 períodos
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
      let weightedSumPrevious = 0;
      let totalWeight = 0;

      let okCount = 0;
      let warningCount = 0;
      let criticalCount = 0;

      for (const link of objective.indicators) {
        const indicator = link.indicator;
        const latest = indicator.values[0];
        const previous = indicator.values[1];

        if (!latest) continue;

        const value = latest.value ? Number(latest.value) : null;
        const target = latest.target ? Number(latest.target) : null;

        if (value == null || target == null || target === 0) continue;

        let compliance =
          indicator.evaluationDirection === 'LOWER_IS_BETTER'
            ? (target / value) * 100
            : (value / target) * 100;

        const weight = indicator.weight ?? 1;

        weightedSum += compliance * weight;
        totalWeight += weight;

        if (compliance >= 80) okCount++;
        else if (compliance >= 60) warningCount++;
        else criticalCount++;

        // 👇 cálculo período anterior
        if (previous && previous.target) {
          const prevValue = Number(previous.value);
          const prevTarget = Number(previous.target);

          if (prevTarget !== 0) {
            const prevCompliance =
              indicator.evaluationDirection === 'LOWER_IS_BETTER'
                ? (prevTarget / prevValue) * 100
                : (prevValue / prevTarget) * 100;

            weightedSumPrevious += prevCompliance * weight;
          }
        }
      }

      const weightedScore =
        totalWeight > 0 ? weightedSum / totalWeight : null;

      const previousScore =
        totalWeight > 0 ? weightedSumPrevious / totalWeight : null;

      let trend: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';

      if (weightedScore != null && previousScore != null) {
        if (weightedScore > previousScore + 1) trend = 'UP';
        else if (weightedScore < previousScore - 1) trend = 'DOWN';
      }

      result.push({
        objectiveId: objective.id,
        objectiveCode: objective.code,
        objectiveName: objective.name,
        weightedScore,
        executiveHealthPercent: weightedScore
          ? Math.round(weightedScore)
          : 0,
        worstStatus:
          criticalCount > 0
            ? 'CRITICAL'
            : warningCount > 0
              ? 'WARNING'
              : okCount > 0
                ? 'OK'
                : 'NO_DATA',
        indicatorCount: objective.indicators.length,
        okCount,
        warningCount,
        criticalCount,
        trend,
        series: [], // luego mejoramos histórico real
      });
    }

    return result;
  }
}

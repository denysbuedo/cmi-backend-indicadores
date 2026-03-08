export interface IndicatorDashboardItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  weight: number;
  objectives: any[];
  processId: string;
  processName: string;
  latestValue: number | null;
  compliancePercent: number | null;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  history: Array<{
    periodEnd: Date;
    value: number;
    target: number | null;
    status: string;
  }>;
}

export interface ProcessDashboardItem {
  id: string;
  code: string;
  name: string;
  score: number;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'NO_DATA';
  indicatorCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
}

export interface ProcessSummary {
  total: number;
  ok: number;
  warning: number;
  critical: number;
  avgScore: number;
  list: ProcessDashboardItem[];
}

export interface ObjectiveDashboardItem {
  objectiveId: string;
  objectiveCode: string;
  objectiveName: string;
  weightedScore: number;
  worstStatus: 'OK' | 'WARNING' | 'CRITICAL';
  indicatorCount: number;
}

export interface ExecutiveDashboardResponse {
  summary: {
    totalIndicators: number;
  };
  executiveScore: number | null;
  indicators: IndicatorDashboardItem[];
  processes: ProcessSummary;
  objectives: ObjectiveDashboardItem[];
}

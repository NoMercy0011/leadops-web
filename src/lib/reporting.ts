import "server-only";

import { apiFetch } from "@/lib/api";

/**
 * Accès aux indicateurs.
 *
 * Aucun calcul n'est refait ici : les taux viennent de l'API, seule à connaître
 * les jalons et le cloisonnement. Les recalculer côté front créerait une
 * seconde source de vérité qui divergerait au premier changement de règle.
 */

export interface StageSlice {
  stage_id: number;
  stage: string;
  /**
   * Indispensable, pas décoratif : les pipelines sont propres à chaque projet,
   * et deux étapes homonymes sont deux étapes différentes.
   */
  project: string;
  color: string;
  is_won: boolean;
  is_lost: boolean;
  total: number;
}

export interface PerformanceRow {
  project_id?: number;
  project?: string;
  variant?: string | null;
  user_id?: number | null;
  user?: string;
  total: number;
  qualified: number;
  converted: number;
  lost: number;
  /** `null` quand le dénominateur est nul — jamais 0. */
  qualification_rate: number | null;
  conversion_rate: number | null;
}

export interface Dashboard {
  timezone: string;
  active_projects: number;
  prospects: { total: number; converted: number; lost: number };
  conversion_rate: number | null;
  appointments: { today: number; upcoming: number; overdue: number };
  by_stage: StageSlice[];
  by_project: PerformanceRow[];
  // Lot 12 — contrat cadrage/contrats/LOT-12_Tableau-de-bord.md.
  period: { key: PeriodeApi; from: string; to: string; granularity: "day" | "week" };
  kpis: {
    conversion_rate: { value: number | null; previous: number | null; trend_points: number | null };
    converted: DashboardKpi;
    lost: DashboardKpi;
    new_prospects: DashboardKpi;
  };
  series: DashboardSeriesPoint[];
  funnel: DashboardFunnel | null;
  today: DashboardToday;
  /** Absent pour un commercial (décision n°4 de la planche). */
  leaderboard?: LeaderboardRow[];
}

export type PeriodeApi = "7d" | "30d" | "90d";

/** `trend` est `null` sans base de comparaison : l'écran affiche « — ». */
export interface DashboardKpi {
  value: number;
  previous: number;
  trend: number | null;
}

/** Un jour, ou une semaine commençant le lundi (`granularity: "week"`). */
export interface DashboardSeriesPoint {
  date: string;
  converted: number;
  lost: number;
}

export interface DashboardFunnel {
  project: { id: number; name: string };
  projects: { id: number; name: string }[];
  stages: {
    stage_id: number;
    name: string;
    reached: number;
    pass_rate: number | null;
    is_won: boolean;
    is_lost: boolean;
  }[];
}

export interface DashboardToday {
  overdue: { count: number; oldest: string | null };
  appointments: {
    count: number;
    items: {
      id: number;
      scheduled_at: string;
      type: string;
      type_label: string;
      prospect: { id: number; name: string };
      project: { id: number; name: string };
    }[];
  };
  stale: { count: number; days: number };
}

export interface LeaderboardRow {
  user: { id: number; name: string };
  converted: number;
  conversion_rate: number | null;
  appointments: number;
  last_7_days: number[];
}

export interface Report {
  period: { from: string; to: string; timezone: string };
  totals: {
    prospects: number;
    contacted: number;
    qualified: number;
    converted: number;
    lost: number;
    appointments: number;
  };
  rates: {
    qualification: number | null;
    conversion: number | null;
    loss: number | null;
  };
  by_project: PerformanceRow[];
  by_user: PerformanceRow[];
}

export interface ReportFilters {
  project_id?: number;
  variant_id?: number;
  user_id?: number;
  from?: string;
  to?: string;
}

export async function getDashboard(
  options: { period?: PeriodeApi; funnelProjectId?: number } = {},
): Promise<Dashboard> {
  const query = new URLSearchParams();
  if (options.period) query.set("period", options.period);
  if (options.funnelProjectId) query.set("funnel_project_id", String(options.funnelProjectId));
  const suffixe = query.size > 0 ? `?${query.toString()}` : "";

  return apiFetch<Dashboard>(`/dashboard${suffixe}`);
}

export async function getReport(filters: ReportFilters = {}): Promise<Report> {
  const query = new URLSearchParams();

  for (const [cle, valeur] of Object.entries(filters)) {
    if (valeur !== undefined && valeur !== "" && valeur !== null) {
      query.set(cle, String(valeur));
    }
  }

  const suffixe = query.size > 0 ? `?${query.toString()}` : "";

  return apiFetch<Report>(`/reports${suffixe}`);
}

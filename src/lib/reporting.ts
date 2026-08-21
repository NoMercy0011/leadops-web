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

export async function getDashboard(): Promise<Dashboard> {
  return apiFetch<Dashboard>("/dashboard");
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

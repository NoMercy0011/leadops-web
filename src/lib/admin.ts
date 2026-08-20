import "server-only";

import { apiFetch } from "@/lib/api";
import type { Company, Plan } from "@/lib/types";

/**
 * Accès aux données du back-office.
 *
 * Toutes ces routes sont réservées au Super Admin côté Laravel. Le front ne
 * refait pas ce contrôle : il se contente de ne pas afficher ce qui ne le
 * concerne pas, l'API restant seule juge.
 */

export interface Paginated<T> {
  data: T[];
  meta: { current_page: number; last_page: number; total: number };
}

export interface UsageEntry {
  used: number;
  /** `null` signifie illimité. */
  limit: number | null;
  remaining: number | null;
}

export type UsageResource = "users" | "projects" | "prospects";

export interface CompanyUsage {
  company_id: number;
  usage: Record<UsageResource, UsageEntry>;
}

export async function listCompanies(
  params: { search?: string; status?: string } = {},
): Promise<Paginated<Company>> {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  // `unwrap: false` : le bloc `meta` de la pagination serait perdu autrement.
  return apiFetch<Paginated<Company>>(`/admin/companies${suffix}`, {
    unwrap: false,
  });
}

export async function getCompany(id: number): Promise<Company> {
  return apiFetch<Company>(`/admin/companies/${id}`);
}

export async function getCompanyUsage(id: number): Promise<CompanyUsage> {
  return apiFetch<CompanyUsage>(`/admin/companies/${id}/usage`);
}

export async function listPlans(): Promise<Plan[]> {
  return apiFetch<Plan[]>("/admin/plans");
}

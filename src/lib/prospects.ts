import "server-only";

import { apiFetch } from "@/lib/api";
import type { Paginated } from "@/lib/admin";
import type { Prospect, ProspectActivity, ProspectSummary } from "@/lib/types";

/**
 * Accès aux prospects.
 *
 * Le cloisonnement par entreprise et la restriction de rôle sont appliqués par
 * l'API. Un commercial qui appelle `listProspects` reçoit déjà les seuls
 * prospects qui lui reviennent, plus ceux qui ne sont affectés à personne.
 */

export interface ProspectFilters {
  project_id?: number;
  stage_id?: number;
  /** `"none"` filtre les prospects non affectés. */
  assigned_user_id?: string;
  search?: string;
  per_page?: number;
}

function toQuery(filters: ProspectFilters): string {
  const query = new URLSearchParams();

  for (const [cle, valeur] of Object.entries(filters)) {
    if (valeur !== undefined && valeur !== "" && valeur !== null) {
      query.set(cle, String(valeur));
    }
  }

  return query.size > 0 ? `?${query.toString()}` : "";
}

/** La liste transporte son résumé agrégé, calculé par l'API sur le même filtre. */
export type ProspectList = Paginated<Prospect> & { summary: ProspectSummary };

export async function listProspects(
  filters: ProspectFilters = {},
): Promise<ProspectList> {
  return apiFetch<ProspectList>(`/prospects${toQuery(filters)}`, {
    unwrap: false,
  });
}

export async function getProspect(id: number): Promise<Prospect> {
  return apiFetch<Prospect>(`/prospects/${id}`);
}

export async function listActivities(
  prospectId: number,
): Promise<ProspectActivity[]> {
  return apiFetch<ProspectActivity[]>(`/prospects/${prospectId}/activities`);
}

/**
 * Doublons probables dans le projet, avant création.
 *
 * Signalement, jamais blocage : l'esquisse admet qu'un même contact existe
 * dans plusieurs projets, et la décision §10.1 ne retient le rapprochement
 * qu'à l'intérieur d'un projet.
 */
export async function findDuplicates(params: {
  project_id: number;
  phone?: string;
  email?: string;
}): Promise<Prospect[]> {
  const query = new URLSearchParams({
    project_id: String(params.project_id),
  });

  if (params.phone) query.set("phone", params.phone);
  if (params.email) query.set("email", params.email);

  return apiFetch<Prospect[]>(`/prospects/duplicates?${query.toString()}`);
}

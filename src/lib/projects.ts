import "server-only";

import { apiFetch } from "@/lib/api";
import type { Paginated } from "@/lib/admin";
import type { PipelineStage, Project, User, Variant } from "@/lib/types";

/**
 * Accès aux projets, variantes et pipelines.
 *
 * Le cloisonnement par entreprise et la restriction de rôle sont appliqués par
 * l'API : ces fonctions ne filtrent rien elles-mêmes. Un manager qui appelle
 * `listProjects` reçoit déjà les seuls projets de son équipe.
 */

export async function listProjects(
  params: { status?: string; variant_id?: number } = {},
): Promise<Paginated<Project>> {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.variant_id) query.set("variant_id", String(params.variant_id));

  const suffix = query.size > 0 ? `?${query.toString()}` : "";

  return apiFetch<Paginated<Project>>(`/projects${suffix}`, { unwrap: false });
}

export async function getProject(id: number): Promise<Project> {
  return apiFetch<Project>(`/projects/${id}`);
}

export async function listStages(projectId: number): Promise<PipelineStage[]> {
  return apiFetch<PipelineStage[]>(`/projects/${projectId}/stages`);
}

export async function listVariants(): Promise<Variant[]> {
  return apiFetch<Variant[]>("/variants");
}

/**
 * Utilisateurs de l'entreprise, pour composer l'équipe d'un projet.
 *
 * L'API renvoie déjà la liste bornée au rôle de l'appelant : un Admin Client
 * voit toute son entreprise, ce qui est le cas d'usage ici.
 */
export async function listCompanyUsers(): Promise<Paginated<User>> {
  return apiFetch<Paginated<User>>("/users", { unwrap: false });
}

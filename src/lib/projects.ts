import "server-only";

import { cache } from "react";

import { apiFetch, idApi } from "@/lib/api";
import type { Paginated } from "@/lib/admin";
import type { PerformanceRow } from "@/lib/reporting";
import type {
  PipelineStage,
  Project,
  User,
  Variant,
  StageColor,
} from "@/lib/types";

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

/**
 * Fiche d'un projet, mémoïsée le temps d'un rendu.
 *
 * Le layout de `/projets/[id]` en a besoin pour l'en-tête et le fil d'Ariane,
 * `generateMetadata` pour le titre de l'onglet, et chaque page de section pour
 * son propre contenu — soit trois appels pour une même donnée à chaque
 * navigation. La déduplication native de `fetch` ne s'applique pas ici :
 * `apiFetch` passe `cache: "no-store"`, parce que les données sont cloisonnées
 * par utilisateur et qu'un cache partagé exposerait une entreprise à une autre.
 *
 * `cache()` de React répond exactement à ce besoin : la mémoïsation vit le
 * temps d'un rendu serveur et meurt avec lui, sans jamais franchir la
 * frontière entre deux requêtes.
 */
export const getProject = cache(async (id: number): Promise<Project> => {
  return apiFetch<Project>(`/projects/${idApi(id)}`);
});

export async function listStages(projectId: number): Promise<PipelineStage[]> {
  return apiFetch<PipelineStage[]>(`/projects/${idApi(projectId)}/stages`);
}

export async function listVariants(): Promise<Variant[]> {
  return apiFetch<Variant[]>("/variants");
}

/**
 * Santé du pipeline d'un projet.
 *
 * Point d'entrée distinct de la fiche : le calcul parcourt le journal
 * d'activités, alors que la fiche est chargée à chaque navigation.
 *
 * Réservé à l'encadrement côté API. La fiche projet ne l'appelle donc que
 * pour un Admin Client ou un manager — sans quoi chaque visite d'un
 * commercial produirait un 403 dans les journaux.
 */
export interface StageHealth {
  stage_id: number;
  name: string;
  color: StageColor;
  is_won: boolean;
  is_lost: boolean;
  total: number;
  /** Sans changement d'étape depuis le seuil. Toujours 0 sur une étape terminale. */
  immobiles: number;
  /** `null` tant qu'aucun prospect n'a quitté l'étape : il n'y a rien à moyenner. */
  duree_moyenne_jours: number | null;
  passages: number;
}

export interface PipelineHealth {
  stages: StageHealth[];
  seuil_immobilite_jours: number;
}

export async function getPipelineHealth(
  projectId: number,
): Promise<PipelineHealth> {
  return apiFetch<PipelineHealth>(`/projects/${idApi(projectId)}/pipeline-health`);
}

/**
 * Défauts de données d'un projet.
 *
 * Trois mesures, choisies parce qu'elles faussent chacune un chiffre
 * différent : les doublons gonflent le volume, les prospects injoignables
 * faussent le taux de contact, les qualifications incomplètes faussent le taux
 * de qualification.
 */
export interface DataQuality {
  doublons: {
    groupes: number;
    /** Identifiants distincts : un prospect peut appartenir à deux groupes. */
    prospects: number;
    exemples: {
      cle: string;
      type: string;
      prospects: { id: number; name: string }[];
    }[];
  };
  sans_coordonnee: {
    total: number;
    exemples: { id: number; name: string }[];
  };
  qualification_incomplete: {
    total: number;
    questions_obligatoires: number;
    exemples: { id: number; name: string }[];
  };
}

export async function getDataQuality(projectId: number): Promise<DataQuality> {
  return apiFetch<DataQuality>(`/projects/${idApi(projectId)}/data-quality`);
}

/**
 * Journal de configuration d'un projet.
 *
 * Distinct du journal d'un prospect : celui-ci retrace ce qui arrive au cadre —
 * pipeline, questionnaire, équipe, statut. Renommer une étape ne modifie aucune
 * ligne mais change la lecture de tout l'historique, et aucun journal de
 * prospect ne pouvait porter cet événement.
 */
export interface ProjectActivity {
  id: number;
  type: string;
  type_label: string;
  /** Change le sens des données déjà saisies — renommage, retrait. */
  reinterprete_le_passe: boolean;
  payload: Record<string, unknown> | null;
  occurred_at: string;
  user?: User | null;
}

/**
 * Journal du projet, paginé par 50 côté API (lot 9, contrat §5). Figé à 50
 * lignes, l'historique au-delà était inaccessible.
 */
export async function listProjectActivities(
  projectId: number,
  page = 1,
): Promise<Paginated<ProjectActivity>> {
  return apiFetch<Paginated<ProjectActivity>>(
    `/projects/${projectId}/activities?page=${Math.max(1, Math.trunc(page))}`,
    { unwrap: false },
  );
}

/**
 * Comparaison d'un projet avec les autres de sa variante.
 *
 * `variant` à `null` signifie que le projet n'a pas de variante — distinct
 * d'une liste vide, qui n'arrive pas : un projet avec variante figure toujours
 * dans sa propre comparaison.
 */
export interface VariantComparisonRow extends PerformanceRow {
  project_id: number;
  project: string;
  /** Désigné par l'API : deux projets peuvent porter des noms très proches. */
  courant: boolean;
}

export interface VariantComparison {
  variant: string | null;
  projets: VariantComparisonRow[];
}

export async function getVariantComparison(
  projectId: number,
): Promise<VariantComparison> {
  return apiFetch<VariantComparison>(
    `/projects/${idApi(projectId)}/variant-comparison`,
  );
}

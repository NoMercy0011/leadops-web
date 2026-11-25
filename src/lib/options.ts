import "server-only";

import { cache } from "react";

import { apiFetch } from "@/lib/api";
import type { ProjectStatus, UserRole } from "@/lib/types";

/** Ce qu'un filtre affiche d'un projet. */
export interface OptionProjet {
  id: number;
  name: string;
  status: ProjectStatus;
}

/** Ce qu'un filtre affiche d'un utilisateur. */
export interface OptionUtilisateur {
  id: number;
  name: string;
  role: UserRole;
  role_label: string;
}

export interface OptionsFiltres {
  projects: OptionProjet[];
  users: OptionUtilisateur[];
}

/**
 * Options des filtres projet et commercial — lot 10, règle R2.
 *
 * Tout le périmètre de l'utilisateur, sans pagination : les listes paginées
 * s'arrêtaient à 25, et un projet ou un commercial au-delà devenait
 * introuvable dans les filtres. Mémoïsé le temps du rendu.
 */
export const getOptionsFiltres = cache(
  async (): Promise<OptionsFiltres> => apiFetch<OptionsFiltres>("/options"),
);

/**
 * Utilisateurs proposés aux listes de choix — lot 11, règle R1.
 *
 * Réaffectation et équipe d'un projet lisaient `/users`, paginée par 25 : un
 * 26e commercial ne pouvait être ni affecté ni rendu membre. Même enveloppe
 * `{ data }` que la liste paginée, pour que les écrans n'aient rien d'autre à
 * changer.
 */
export async function listUtilisateursOptions(): Promise<{ data: OptionUtilisateur[] }> {
  return { data: (await getOptionsFiltres()).users };
}

/**
 * Projets où l'on peut créer, importer ou faire glisser une carte — lot 11,
 * règle R1.
 *
 * Les archivés sont écartés : l'API refuserait l'écriture (`archive.read_only`),
 * et la liste paginée qu'ils remplacent les écartait déjà.
 */
export async function listProjetsOuverts(): Promise<{ data: OptionProjet[] }> {
  return {
    data: (await getOptionsFiltres()).projects.filter((p) => p.status !== "archived"),
  };
}

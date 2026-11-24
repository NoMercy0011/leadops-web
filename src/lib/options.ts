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

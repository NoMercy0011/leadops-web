import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { ApiError, apiFetch } from "@/lib/api";
import { getSessionToken } from "@/lib/session";
import type { User } from "@/lib/types";

/**
 * Data Access Layer.
 *
 * C'est ici, et nulle part ailleurs, que se décide si une requête est
 * authentifiée. Le proxy (`src/proxy.ts`) ne fait qu'une vérification
 * optimiste de présence du cookie pour éviter un aller-retour inutile ; il
 * n'est jamais la barrière de sécurité. Celle-ci reste côté Laravel, et cette
 * couche en est le relais côté rendu.
 */

/**
 * `cache` mémoïse l'appel pour la durée d'un rendu : le layout, la page et
 * plusieurs composants peuvent demander l'utilisateur courant sans provoquer
 * autant d'appels à l'API.
 */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = await getSessionToken();

  if (!token) {
    return null;
  }

  try {
    return await apiFetch<User>("/me");
  } catch (error) {
    // Jeton révoqué ou expiré : on traite comme une absence de session plutôt
    // que de propager une erreur, l'appelant décidant ensuite de rediriger.
    if (error instanceof ApiError && error.isUnauthenticated) {
      return null;
    }

    throw error;
  }
});

/**
 * À utiliser dans tout layout ou page derrière authentification.
 */
export async function requireUser(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/connexion");
  }

  return user;
}

import "server-only";

import { apiFetch } from "@/lib/api";
import type { UsageEntry, UsageResource } from "@/lib/admin";
import type { Subscription } from "@/lib/types";

/**
 * Abonnement et consommation de sa propre entreprise.
 *
 * Distinct de `admin.ts`, qui lit la même chose pour une entreprise *tierce*
 * depuis le back-office Super Admin : ici l'entreprise est déduite de
 * l'utilisateur authentifié, et l'API réserve la lecture à l'Admin Client.
 *
 * Les types de consommation sont repris de `admin.ts` plutôt que redéclarés :
 * c'est le même service serveur qui les produit, et deux définitions
 * divergeraient au premier plafond ajouté.
 */
export interface SubscriptionOverview {
  /** `null` pour une entreprise sans abonnement — anormal, mais affichable. */
  subscription: Subscription | null;
  usage: Record<UsageResource, UsageEntry>;
}

export async function getSubscriptionOverview(): Promise<SubscriptionOverview> {
  return apiFetch<SubscriptionOverview>("/subscription");
}

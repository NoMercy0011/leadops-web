/**
 * Contrat HTTP de l'API, écrit à la main.
 *
 * Les deux dépôts sont indépendants : il n'y a pas d'import de types depuis
 * Laravel. Tout changement de contrat côté API doit être répercuté ici, et
 * c'est volontairement visible plutôt que magique.
 */

export type UserRole =
  | "super_admin"
  | "admin_client"
  | "manager"
  | "commercial";

export type CompanyStatus = "active" | "suspended";

export type SubscriptionStatus = "active" | "suspended" | "expired";

export interface Plan {
  id: number;
  name: string;
  slug: string;
  /** `null` signifie illimité. */
  max_projects: number | null;
  max_users: number | null;
  max_prospects: number | null;
}

export interface Subscription {
  id: number;
  status: SubscriptionStatus;
  /** Tient compte d'une échéance dépassée : c'est celui à afficher. */
  effective_status: SubscriptionStatus;
  effective_status_label: string;
  starts_at: string | null;
  expires_at: string | null;
  plan?: Plan;
}

export interface Company {
  id: number;
  name: string;
  slug: string;
  status: CompanyStatus;
  timezone: string;
  default_country_code: string;
  /** Indicatif d'affichage seulement — l'API reste seule juge. */
  allows_writes: boolean;
  subscription?: Subscription;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  role_label: string;
  company_id: number | null;
  manager_id: number | null;
  company?: Company;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Erreur de validation Laravel (422). */
export interface ValidationErrors {
  [field: string]: string[];
}

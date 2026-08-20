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

export type ProjectStatus = "active" | "suspended" | "completed";

/**
 * Jeu restreint de couleurs d'étapes, fixé côté API.
 *
 * Ce sont des *noms*, pas des codes hexadécimaux : le rendu appartient à la
 * charte, et transmettre un `#RRGGBB` depuis l'API figerait la palette en base
 * de données — toute retouche exigerait alors une migration.
 */
export type StageColor =
  | "slate"
  | "blue"
  | "teal"
  | "sage"
  | "amber"
  | "violet"
  | "rose"
  | "red";

export interface Variant {
  id: number;
  name: string;
  position: number;
  projects_count?: number;
}

export interface PipelineStage {
  id: number;
  project_id: number;
  name: string;
  position: number;
  /**
   * La sémantique terminale voyage par ces deux drapeaux, jamais par le
   * libellé — invariant n°2. Ne jamais écrire `stage.name === "Converti"`.
   */
  is_won: boolean;
  is_lost: boolean;
  color: StageColor;
}

export interface Project {
  id: number;
  name: string;
  product: string | null;
  target: string | null;
  description: string | null;
  status: ProjectStatus;
  status_label: string;
  accepts_new_prospects: boolean;
  variant?: Variant | null;
  stages?: PipelineStage[];
  members?: User[];
  members_count?: number;
  created_at: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Erreur de validation Laravel (422). */
export interface ValidationErrors {
  [field: string]: string[];
}

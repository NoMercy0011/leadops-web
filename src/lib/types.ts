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

export interface Prospect {
  id: number;
  project_id: number;
  stage_id: number;
  assigned_user_id: number | null;
  first_name: string;
  last_name: string | null;
  full_name: string;
  company_name: string | null;
  /** Valeur saisie. Les colonnes normalisées restent internes à l'API. */
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string | null;
  notes: string | null;
  next_action_at: string | null;
  next_action_note: string | null;
  converted_at: string | null;
  lost_at: string | null;
  /** Dérivée du journal côté API, jamais stockée. */
  last_interaction_at?: string | null;
  stage?: PipelineStage;
  project?: Project;
  assigned_user?: User | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ActivityType =
  | "created"
  | "stage_changed"
  | "assigned"
  | "unassigned"
  | "note_added"
  | "imported"
  | "next_action_planned"
  | "fields_updated";

export interface ProspectActivity {
  id: number;
  type: ActivityType;
  type_label: string;
  is_interaction: boolean;
  /** Forme variable selon le type — voir ActivityLogger côté API. */
  payload: Record<string, unknown> | null;
  occurred_at: string;
  /** Absent pour un import automatisé ou un compte supprimé depuis. */
  user?: User | null;
}

/**
 * Les onze types de questions de l'esquisse.
 *
 * Ils décrivent la mécanique d'un champ — comment il se saisit — jamais son
 * sens métier, qui appartient au libellé saisi par le client.
 */
export type QuestionType =
  | "text"
  | "long_text"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "dropdown"
  | "single_choice"
  | "multiple_choice"
  | "yes_no"
  | "checkbox";

export interface QuestionOption {
  id: number;
  /** S'affiche. */
  label: string;
  /** S'enregistre — distinct du libellé pour survivre à un renommage. */
  value: string;
  position: number;
}

export interface Question {
  id: number;
  project_id: number;
  type: QuestionType;
  type_label: string;
  label: string;
  help: string | null;
  required: boolean;
  position: number;
  multi_value: boolean;
  stored_as: "string" | "number" | "boolean" | "array";
  options?: QuestionOption[];
  /** Conditionne l'interdit de changement de type. Absent hors constructeur. */
  has_answers?: boolean;
}

export interface ProspectAnswer {
  question_id: number;
  value: string | number | boolean | string[] | null;
  /** Version lisible, résolue côté serveur. */
  display: string;
}

export interface Questionnaire {
  questions: Question[];
  answers: ProspectAnswer[];
}

export interface ImportReport {
  imported: number;
  skipped: number;
  errors: { line: number; message: string }[];
}

export interface BulkAssignReport {
  requested: number;
  reassigned: number;
  skipped: number;
}

export interface LoginResponse {
  token: string;
  user: User;
}

/** Erreur de validation Laravel (422). */
export interface ValidationErrors {
  [field: string]: string[];
}

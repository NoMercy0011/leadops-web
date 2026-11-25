import "server-only";

import { apiFetch, idApi } from "@/lib/api";
import type { Question } from "@/lib/types";

/**
 * Entretien guidé — lot 13, contrat `cadrage/contrats/LOT-13_Entretien-guide.md`.
 *
 * Les écritures passent par les Server Actions de `entretien-actions.ts` ;
 * ce module ne fait que lire.
 */

export interface PlanQuestion extends Question {
  planned_seconds: number | null;
  /** Durée personnelle de l'utilisateur, `null` sans simulation gardée. */
  my_seconds: number | null;
}

export interface InterviewPlan {
  project: { id: number; name: string };
  questions: PlanQuestion[];
  totals: { planned_seconds: number; my_seconds: number };
}

export interface Interview {
  id: number;
  prospect_id: number;
  project_id: number;
  user: { id: number; name: string } | null;
  started_at: string;
  finished_at: string | null;
  planned_seconds: number;
  current_question_id: number | null;
  answered_count: number;
  status: "open" | "finished" | "abandoned";
}

export async function getInterviewPlan(projectId: number): Promise<InterviewPlan> {
  return apiFetch<InterviewPlan>(`/projects/${idApi(projectId)}/interview-plan`);
}

/** L'entretien ouvert sur ce prospect, quel qu'en soit l'auteur, ou `null`. */
export async function getCurrentInterview(prospectId: number): Promise<Interview | null> {
  // `unwrap: false` : `apiFetch` rend l'enveloppe entière quand `data` vaut
  // `null` (`payload?.data ?? payload`), et « aucun entretien » se lisait
  // alors comme un entretien d'un autre utilisateur (parcours du lot 13).
  const reponse = await apiFetch<{ data: Interview | null }>(
    `/prospects/${idApi(prospectId)}/interviews/current`,
    { unwrap: false },
  );
  return reponse.data;
}

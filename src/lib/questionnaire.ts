import "server-only";

import { apiFetch } from "@/lib/api";
import type { Question, Questionnaire } from "@/lib/types";

/**
 * Accès au questionnaire.
 *
 * Définitions et réponses voyagent ensemble : le front en a besoin ensemble
 * pour rendre le formulaire, et les demander séparément imposerait deux
 * allers-retours et un état intermédiaire où le formulaire est construit mais
 * vide.
 */
export async function getQuestionnaire(
  prospectId: number,
): Promise<Questionnaire> {
  return apiFetch<Questionnaire>(`/prospects/${prospectId}/questionnaire`);
}

/** Définitions seules, pour le constructeur côté projet. */
export async function listQuestions(projectId: number): Promise<Question[]> {
  return apiFetch<Question[]>(`/projects/${projectId}/questions`);
}

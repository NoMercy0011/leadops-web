"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { ApiError, apiFetch, idApi } from "@/lib/api";
import type { Interview, InterviewPlan } from "@/lib/interviews";

/**
 * Écritures de l'entretien guidé — lot 13.
 *
 * Aucune règle n'est rejouée ici : validation par type, obligation, lecture
 * seule et « un seul entretien ouvert » sont tranchées par l'API, qui répond
 * par un `code` stable.
 */

export interface EtatEntretien {
  message?: string;
  /** Erreur rattachée à une question (identifiant → message). */
  erreurs?: Record<number, string>;
  entretien?: Interview;
}

function versEtat(error: unknown): EtatEntretien {
  if (error instanceof ApiError) {
    const erreurs: Record<number, string> = {};
    for (const [cle, messages] of Object.entries(error.errors ?? {})) {
      const id = cle.match(/^answers\.(\d+)/);
      if (id) erreurs[Number(id[1])] ??= messages[0];
    }
    if (Object.keys(erreurs).length > 0) return { erreurs };
    const premiere = error.errors ? Object.values(error.errors)[0]?.[0] : undefined;
    return { message: premiere ?? error.message };
  }
  return { message: "Le service est momentanément indisponible." };
}

/** Démarre, ou reprend, puis ouvre l'écran d'entretien. */
export async function demarrerEntretien(prospectId: number): Promise<EtatEntretien> {
  try {
    await apiFetch<Interview>(`/prospects/${idApi(prospectId)}/interviews`, { method: "POST" });
  } catch (error) {
    return versEtat(error);
  }
  redirect(`/prospects/${prospectId}/entretien`);
}

/** Enregistre une réponse en passant à la question suivante (R4). */
export async function enregistrerReponse(
  entretienId: number,
  questionId: number,
  valeur: unknown,
): Promise<EtatEntretien> {
  try {
    const entretien = await apiFetch<Interview>(
      `/interviews/${idApi(entretienId)}/answers/${idApi(questionId)}`,
      { method: "PUT", body: { value: valeur } },
    );
    return { entretien };
  } catch (error) {
    const etat = versEtat(error);
    // Une erreur de valeur porte la clé `value` : on la rattache à la question.
    if (etat.message && error instanceof ApiError && error.errors?.value) {
      return { erreurs: { [questionId]: error.errors.value[0] } };
    }
    return etat;
  }
}

export async function terminerEntretien(entretienId: number, prospectId: number): Promise<EtatEntretien> {
  try {
    await apiFetch<Interview>(`/interviews/${idApi(entretienId)}/finish`, { method: "POST" });
  } catch (error) {
    return versEtat(error);
  }
  revalidatePath(`/prospects/${prospectId}`);
  redirect(`/prospects/${prospectId}?entretien=termine`);
}

/** Garde les durées mesurées en simulation comme durées personnelles (R7). */
export async function garderMesDurees(
  projectId: number,
  durees: { question_id: number; seconds: number }[],
): Promise<{ message?: string; plan?: InterviewPlan }> {
  try {
    const plan = await apiFetch<InterviewPlan>(`/projects/${idApi(projectId)}/my-timings`, {
      method: "PUT",
      body: { timings: durees },
    });
    revalidatePath(`/projets/${projectId}/entretien`);
    return { plan };
  } catch (error) {
    return { message: versEtat(error).message };
  }
}

export async function revenirAuxDureesPrevues(projectId: number): Promise<{ message?: string }> {
  try {
    await apiFetch(`/projects/${idApi(projectId)}/my-timings`, { method: "DELETE" });
  } catch (error) {
    return { message: versEtat(error).message };
  }
  revalidatePath(`/projets/${projectId}/entretien`);
  return {};
}

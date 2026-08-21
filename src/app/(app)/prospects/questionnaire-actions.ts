"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";

export interface QuestionnaireState {
  message?: string;
  success?: string;
  /** Erreurs indexées par identifiant de question. */
  fieldErrors?: Record<number, string>;
}

/**
 * Enregistre les réponses au questionnaire.
 *
 * Aucune validation n'est refaite ici : les règles sont dérivées des
 * définitions côté API (invariant n°3), et les rejouer en TypeScript créerait
 * une seconde source de vérité qui divergerait au premier type ajouté.
 */
export async function saveAnswers(
  prospectId: number,
  answers: Record<number, unknown>,
): Promise<QuestionnaireState> {
  try {
    await apiFetch(`/prospects/${prospectId}/questionnaire`, {
      method: "PUT",
      body: { answers },
    });
  } catch (error) {
    if (error instanceof ApiError && error.errors) {
      // Les clés d'erreur sont littérales — « answers.42 » — et non des
      // chemins imbriqués : on les redécoupe pour les rattacher au champ.
      const parChamp: Record<number, string> = {};

      for (const [cle, messages] of Object.entries(error.errors)) {
        const correspondance = cle.match(/^answers\.(\d+)/);

        if (correspondance) {
          const id = Number(correspondance[1]);

          // La première erreur suffit : sur un choix multiple, l'API en
          // renvoie une par élément fautif, toutes de même nature.
          parChamp[id] ??= messages[0];
        }
      }

      return { fieldErrors: parChamp };
    }

    if (error instanceof ApiError) {
      return { message: error.message };
    }

    return { message: "Le service est momentanément indisponible." };
  }

  revalidatePath(`/prospects/${prospectId}`);

  return { success: "Qualification enregistrée." };
}

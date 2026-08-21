"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";
import type { QuestionType } from "@/lib/types";

export interface ActionState {
  message?: string;
  success?: string;
}

function toState(error: unknown): ActionState {
  if (error instanceof ApiError) {
    // Les erreurs de validation du constructeur sont peu nombreuses et
    // portent sur un formulaire court : un message global suffit, alors
    // qu'un rattachement champ par champ compliquerait le composant sans
    // gain de lisibilité.
    const premiere = error.errors
      ? Object.values(error.errors)[0]?.[0]
      : undefined;

    return { message: premiere ?? error.message };
  }

  return { message: "Le service est momentanément indisponible." };
}

/**
 * Découpage de la saisie séparée par virgules.
 *
 * Les entrées vides sont écartées : « Oui, Non, » ne doit pas produire un
 * troisième choix vide. Aucune `value` n'est transmise — l'API la dérive du
 * libellé, et la laisser distincte permettra plus tard de renommer un choix
 * sans invalider les réponses déjà enregistrées.
 */
function decouperOptions(brut: string): { label: string }[] {
  return brut
    .split(",")
    .map((choix) => choix.trim())
    .filter(Boolean)
    .map((choix) => ({ label: choix }));
}

export async function addQuestion(
  projectId: number,
  formData: FormData,
): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "text") as QuestionType;
  const required = formData.get("required") === "1";
  const help = String(formData.get("help") ?? "").trim();
  const options = decouperOptions(String(formData.get("options") ?? ""));

  if (label === "") {
    return { message: "Le libellé de la question est obligatoire." };
  }

  try {
    await apiFetch(`/projects/${projectId}/questions`, {
      method: "POST",
      body: {
        label,
        type,
        required,
        // Le champ existait dans le modèle et le moteur de rendu l'affichait
        // déjà, mais aucun écran ne permettait de le remplir : il restait
        // inatteignable.
        help: help === "" ? null : help,
        ...(options.length > 0 ? { options } : {}),
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/projets/${projectId}`);

  return { success: `Question « ${label} » ajoutée.` };
}

/**
 * Modification d'une question.
 *
 * Le type n'est pas transmis : l'API le refuse dès qu'une réponse existe, et
 * le proposer conditionnellement côté front créerait un formulaire dont le
 * contenu dépend d'un état serveur que le navigateur ne peut pas garantir à
 * jour. Changer de type revient à créer une nouvelle question — c'est ce que
 * dit le message d'erreur de l'API, et le constructeur le dit aussi.
 *
 * Les options sont renvoyées en entier. L'API remplace la liste, ce qui est le
 * comportement attendu : l'écran de saisie montre exactement l'état final.
 */
export async function updateQuestion(
  projectId: number,
  questionId: number,
  formData: FormData,
): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim();
  const required = formData.get("required") === "1";
  const help = String(formData.get("help") ?? "").trim();
  const brutOptions = String(formData.get("options") ?? "").trim();

  if (label === "") {
    return { message: "Le libellé de la question est obligatoire." };
  }

  const options = decouperOptions(brutOptions);

  try {
    await apiFetch(`/questions/${questionId}`, {
      method: "PATCH",
      body: {
        label,
        required,
        help: help === "" ? null : help,
        // La clé n'est envoyée que pour les types à options : sur un champ
        // texte, transmettre un tableau vide ferait supprimer des options qui
        // n'existent pas et brouillerait la réponse de l'API.
        ...(brutOptions !== "" ? { options } : {}),
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/projets/${projectId}`);

  return { success: `Question « ${label} » mise à jour.` };
}

export async function reorderQuestions(
  projectId: number,
  questionIds: number[],
): Promise<ActionState> {
  try {
    await apiFetch(`/projects/${projectId}/questions/reorder`, {
      method: "PATCH",
      body: { questions: questionIds },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/projets/${projectId}`);

  return { success: "Questionnaire réordonné." };
}

export async function deleteQuestion(
  projectId: number,
  questionId: number,
): Promise<ActionState> {
  try {
    // Suppression douce côté API : la question quitte le formulaire, les
    // réponses déjà collectées restent lisibles sur les fiches.
    await apiFetch(`/questions/${questionId}`, { method: "DELETE" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/projets/${projectId}`);

  return { success: "Question retirée du formulaire." };
}

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

export async function addQuestion(
  projectId: number,
  formData: FormData,
): Promise<ActionState> {
  const label = String(formData.get("label") ?? "").trim();
  const type = String(formData.get("type") ?? "text") as QuestionType;
  const required = formData.get("required") === "1";
  const brutOptions = String(formData.get("options") ?? "").trim();

  if (label === "") {
    return { message: "Le libellé de la question est obligatoire." };
  }

  // Découpage de la saisie séparée par virgules. Les entrées vides sont
  // écartées : « Oui, Non, » ne doit pas produire un troisième choix vide.
  const options = brutOptions
    .split(",")
    .map((choix) => choix.trim())
    .filter(Boolean)
    .map((choix) => ({ label: choix }));

  try {
    await apiFetch(`/projects/${projectId}/questions`, {
      method: "POST",
      body: {
        label,
        type,
        required,
        ...(options.length > 0 ? { options } : {}),
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/projets/${projectId}`);

  return { success: `Question « ${label} » ajoutée.` };
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

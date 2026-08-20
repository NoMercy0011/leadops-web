"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ApiError, apiFetch } from "@/lib/api";
import type { StageColor } from "@/lib/types";

const BASE_PATH = "/projets";

export interface ActionState {
  message?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Traduit une erreur d'API en état de formulaire.
 *
 * Les erreurs de validation remontent champ par champ ; les codes métier —
 * plafond de plan atteint, écriture bloquée — en message global, car ils ne
 * visent aucun champ en particulier et appellent une autre action.
 */
function toState(error: unknown): ActionState {
  if (error instanceof ApiError) {
    if (error.errors) {
      return {
        fieldErrors: Object.fromEntries(
          Object.entries(error.errors).map(([champ, messages]) => [
            champ,
            messages[0],
          ]),
        ),
      };
    }

    return { message: error.message };
  }

  return { message: "Le service est momentanément indisponible." };
}

// Zod 4 : le message passe par `error`, et non plus `message`.
const projectSchema = z.object({
  name: z.string().min(1, { error: "Le nom du projet est obligatoire." }).max(255),
  product: z.string().max(255).optional(),
  target: z.string().max(255).optional(),
  description: z.string().max(5000).optional(),
  variant_id: z.coerce.number().int().positive().optional(),
});

export async function createProject(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const brut = Object.fromEntries(formData);

  // Un <select> vide renvoie une chaîne vide, que `coerce.number` convertirait
  // en 0 — un identifiant invalide. On la ramène donc à « pas de variante ».
  const parsed = projectSchema.safeParse({
    ...brut,
    variant_id: brut.variant_id === "" ? undefined : brut.variant_id,
  });

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);

    return {
      fieldErrors: Object.fromEntries(
        Object.entries(flat.fieldErrors).map(([champ, messages]) => [
          champ,
          messages?.[0] ?? "",
        ]),
      ),
    };
  }

  try {
    await apiFetch("/projects", { method: "POST", body: parsed.data });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(BASE_PATH);

  return { success: `Le projet « ${parsed.data.name} » a été créé avec son pipeline.` };
}

export async function addStage(
  projectId: number,
  formData: FormData,
): Promise<ActionState> {
  const nom = String(formData.get("name") ?? "").trim();

  if (nom === "") {
    return { fieldErrors: { name: "Le nom de l'étape est obligatoire." } };
  }

  try {
    await apiFetch(`/projects/${projectId}/stages`, {
      method: "POST",
      body: {
        name: nom,
        color: (formData.get("color") as StageColor) || "slate",
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`${BASE_PATH}/${projectId}`);

  return { success: `Étape « ${nom} » ajoutée.` };
}

export async function reorderStages(
  projectId: number,
  stageIds: number[],
): Promise<ActionState> {
  try {
    // L'API exige une permutation exacte : un sous-ensemble laisserait des
    // étapes sur une position obsolète, donc un ordre d'affichage faux.
    await apiFetch(`/projects/${projectId}/stages/reorder`, {
      method: "PATCH",
      body: { stages: stageIds },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`${BASE_PATH}/${projectId}`);

  return { success: "Pipeline réordonné." };
}

export async function deleteStage(
  projectId: number,
  stageId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/stages/${stageId}`, { method: "DELETE" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`${BASE_PATH}/${projectId}`);

  return { success: "Étape supprimée." };
}

export async function syncMembers(
  projectId: number,
  memberIds: number[],
): Promise<ActionState> {
  try {
    // Remplacement complet et non ajout : l'écran présente une liste à cocher,
    // et `sync` traduit exactement ce que l'utilisateur voit.
    await apiFetch(`/projects/${projectId}/members`, {
      method: "PUT",
      body: { member_ids: memberIds },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`${BASE_PATH}/${projectId}`);

  return { success: "Équipe mise à jour." };
}

const variantSchema = z.object({
  name: z.string().min(1, { error: "Le nom de la variante est obligatoire." }).max(100),
});

export async function createVariant(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = variantSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    const flat = z.flattenError(parsed.error);

    return { fieldErrors: { name: flat.fieldErrors.name?.[0] ?? "" } };
  }

  try {
    await apiFetch("/variants", { method: "POST", body: parsed.data });
  } catch (error) {
    return toState(error);
  }

  revalidatePath("/parametres/variantes");

  return { success: `Variante « ${parsed.data.name} » créée.` };
}

export async function deleteVariant(variantId: number): Promise<ActionState> {
  try {
    // L'API refuse la suppression d'une variante encore utilisée : la laisser
    // passer détacherait silencieusement les projets et ferait disparaître un
    // axe de reporting.
    await apiFetch(`/variants/${variantId}`, { method: "DELETE" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath("/parametres/variantes");

  return { success: "Variante supprimée." };
}

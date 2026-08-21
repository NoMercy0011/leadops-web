"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ApiError, apiFetch } from "@/lib/api";
import type { BulkAssignReport, ImportReport } from "@/lib/types";

const BASE_PATH = "/prospects";

export interface ActionState {
  message?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Un même prospect se lit depuis trois écrans — la liste, sa fiche, le kanban —
 * qui partagent le layout `/prospects`. Revalider ce layout les couvre tous
 * d'un coup, là où énumérer les chemins un à un laisse systématiquement le
 * dernier écran ajouté sur des données périmées.
 */
function revaliderProspects(): void {
  revalidatePath(BASE_PATH, "layout");
}

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

    // 403 et 404 se confondent volontairement : distinguer « interdit » de
    // « inexistant » confirmerait l'existence d'un prospect à qui n'y a pas
    // accès. Le message brut de Laravel est écarté au passage — il cite le nom
    // de la classe Eloquent, qui n'a rien à faire dans une notification.
    if ([403, 404].includes(error.status)) {
      return { message: "Ce prospect n'est plus dans votre périmètre." };
    }

    return { message: error.message };
  }

  return { message: "Le service est momentanément indisponible." };
}

// Zod 4 : le message passe par `error`.
const prospectSchema = z.object({
  project_id: z.coerce.number().int().positive({ error: "Choisissez un projet." }),
  first_name: z.string().min(1, { error: "Le prénom est obligatoire." }).max(255),
  last_name: z.string().max(255).optional(),
  company_name: z.string().max(255).optional(),
  phone: z.string().max(50).optional(),
  email: z.string().max(255).optional(),
  address: z.string().max(255).optional(),
  source: z.string().max(255).optional(),
});

export async function createProspect(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const brut = Object.fromEntries(formData);

  const parsed = prospectSchema.safeParse({
    ...brut,
    // Un champ vide vaut « non renseigné » et non chaîne vide : l'API
    // refuserait une adresse vide sur la règle `email`.
    email: brut.email === "" ? undefined : brut.email,
    assigned_user_id: undefined,
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

  const affecte = String(formData.get("assigned_user_id") ?? "");

  try {
    await apiFetch("/prospects", {
      method: "POST",
      body: {
        ...parsed.data,
        assigned_user_id: affecte === "" ? null : Number(affecte),
      },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return { success: `${parsed.data.first_name} a été ajouté au projet.` };
}

export async function changeStage(
  prospectId: number,
  stageId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/prospects/${prospectId}/stage`, {
      method: "PATCH",
      body: { stage_id: stageId },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return { success: "Étape mise à jour." };
}

export async function assignProspect(
  prospectId: number,
  userId: number | null,
): Promise<ActionState> {
  try {
    await apiFetch(`/prospects/${prospectId}/assign`, {
      method: "PATCH",
      body: { assigned_user_id: userId },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return { success: userId === null ? "Prospect désaffecté." : "Prospect affecté." };
}

/**
 * Réaffectation en masse — décision §10.3.
 *
 * L'API évalue l'autorisation prospect par prospect et renvoie l'écart entre
 * demandé et réaffecté. Cet écart est remonté tel quel : le masquer laisserait
 * croire à un succès complet alors que des prospects hors périmètre ont été
 * écartés.
 */
export async function bulkAssign(
  prospectIds: number[],
  userId: number | null,
): Promise<ActionState> {
  let rapport: BulkAssignReport;

  try {
    rapport = await apiFetch<BulkAssignReport>("/prospects/bulk-assign", {
      method: "PATCH",
      body: { prospect_ids: prospectIds, assigned_user_id: userId },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  if (rapport.skipped > 0) {
    return {
      success: `${rapport.reassigned} prospect${rapport.reassigned > 1 ? "s" : ""} réaffecté${rapport.reassigned > 1 ? "s" : ""}.`,
      message: `${rapport.skipped} hors de votre périmètre ou déjà affecté${rapport.skipped > 1 ? "s" : ""} — ils n'ont pas été modifiés.`,
    };
  }

  return {
    success: `${rapport.reassigned} prospect${rapport.reassigned > 1 ? "s" : ""} réaffecté${rapport.reassigned > 1 ? "s" : ""}.`,
  };
}

export async function addNote(
  prospectId: number,
  formData: FormData,
): Promise<ActionState> {
  const note = String(formData.get("note") ?? "").trim();

  if (note === "") {
    return { fieldErrors: { note: "La note ne peut pas être vide." } };
  }

  try {
    await apiFetch(`/prospects/${prospectId}/notes`, {
      method: "POST",
      body: { note },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return { success: "Note ajoutée." };
}

export async function planNextAction(
  prospectId: number,
  formData: FormData,
): Promise<ActionState> {
  const quand = String(formData.get("next_action_at") ?? "");
  const note = String(formData.get("next_action_note") ?? "").trim();

  try {
    await apiFetch(`/prospects/${prospectId}/next-action`, {
      method: "PATCH",
      body: {
        next_action_at: quand === "" ? null : quand,
        next_action_note: note === "" ? null : note,
      },
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return { success: quand === "" ? "Relance annulée." : "Relance planifiée." };
}

export async function importProspects(
  _prev: ActionState & { report?: ImportReport },
  formData: FormData,
): Promise<ActionState & { report?: ImportReport }> {
  const projectId = String(formData.get("project_id") ?? "");
  const fichier = formData.get("file");

  if (projectId === "" || !(fichier instanceof File) || fichier.size === 0) {
    return { message: "Choisissez un projet et un fichier CSV." };
  }

  // Le corps est un FormData et non du JSON : `apiFetch` sérialise en JSON par
  // défaut, on court-circuite donc son enveloppe pour un envoi multipart.
  const corps = new FormData();
  corps.set("project_id", projectId);
  corps.set("file", fichier);

  let rapport: ImportReport;

  try {
    rapport = await apiFetch<ImportReport>("/prospects/import", {
      method: "POST",
      body: corps,
      // Ne pas fixer Content-Type : le runtime doit poser lui-même la
      // frontière multipart, qu'on ne peut pas connaître à l'avance.
      rawBody: true,
    });
  } catch (error) {
    return toState(error);
  }

  revaliderProspects();

  return {
    success: `${rapport.imported} prospect${rapport.imported > 1 ? "s" : ""} importé${rapport.imported > 1 ? "s" : ""}.`,
    report: rapport,
  };
}

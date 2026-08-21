"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { ApiError, apiFetch } from "@/lib/api";

const BASE_PATH = "/back-office/entreprises";

export interface ActionState {
  message?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
}

// Zod 4 : le message passe par `error`, `message` n'existe plus.
const companySchema = z.object({
  name: z.string().min(1, { error: "Le nom est obligatoire." }).max(255),
  slug: z
    .string()
    .min(1, { error: "L'identifiant est obligatoire." })
    .regex(/^[a-z0-9-]+$/, {
      error: "Uniquement des minuscules, chiffres et tirets.",
    }),
  timezone: z.string().min(1, { error: "Le fuseau horaire est obligatoire." }),
  default_country_code: z
    .string()
    .length(2, { error: "Code pays sur deux lettres (ex. MG)." }),
  plan_id: z.coerce.number().int().positive({ error: "Choisissez un plan." }),
});

/**
 * Traduit une erreur d'API en état de formulaire.
 *
 * Les erreurs de validation Laravel sont reportées champ par champ ; les codes
 * métier — plafond atteint, écriture bloquée — remontent en message global,
 * car ils ne visent aucun champ en particulier.
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

export async function createCompany(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = companySchema.safeParse(Object.fromEntries(formData));

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
    await apiFetch("/admin/companies", {
      method: "POST",
      body: parsed.data,
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(BASE_PATH);

  return { success: `L'entreprise « ${parsed.data.name} » a été créée.` };
}

export async function suspendCompany(
  companyId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/admin/companies/${companyId}/suspend`, { method: "POST" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(BASE_PATH);
  revalidatePath(`${BASE_PATH}/${companyId}`);

  return { success: "Entreprise suspendue. Les sessions ouvertes sont fermées." };
}

export async function activateCompany(
  companyId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/admin/companies/${companyId}/activate`, { method: "POST" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(BASE_PATH);
  revalidatePath(`${BASE_PATH}/${companyId}`);

  return { success: "Entreprise réactivée." };
}

export async function changePlan(
  companyId: number,
  planId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/admin/companies/${companyId}/subscription`, {
      method: "PATCH",
      body: { plan_id: planId },
    });
  } catch (error) {
    // Cas important : une rétrogradation sous la consommation actuelle est
    // refusée par l'API, avec le détail du dépassement.
    return toState(error);
  }

  revalidatePath(`${BASE_PATH}/${companyId}`);

  return { success: "Plan modifié." };
}

"use server";

import { revalidatePath } from "next/cache";

import { ApiError, apiFetch } from "@/lib/api";
import type { AppointmentStatus } from "@/lib/types";

export interface ActionState {
  message?: string;
  success?: string;
  fieldErrors?: Record<string, string>;
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

    return { message: error.message };
  }

  return { message: "Le service est momentanément indisponible." };
}

export async function scheduleAppointment(
  prospectId: number,
  formData: FormData,
): Promise<ActionState> {
  const quand = String(formData.get("scheduled_at") ?? "");

  if (quand === "") {
    return { fieldErrors: { scheduled_at: "La date est obligatoire." } };
  }

  const lieu = String(formData.get("location") ?? "").trim();

  try {
    await apiFetch("/appointments", {
      method: "POST",
      body: {
        prospect_id: prospectId,
        // La valeur d'un `datetime-local` est une heure locale sans fuseau.
        // Le navigateur du commercial étant réglé sur le fuseau de son
        // entreprise dans la quasi-totalité des cas, `new Date()` l'interprète
        // correctement et `toISOString` la ramène en UTC — le seul format que
        // l'API accepte.
        scheduled_at: new Date(quand).toISOString(),
        duration_minutes: Number(formData.get("duration_minutes") ?? 60),
        type: formData.get("type"),
        location: lieu === "" ? null : lieu,
        notes: String(formData.get("notes") ?? "").trim() || null,
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/calendrier");

  return { success: "Rendez-vous planifié." };
}

/**
 * Report ou correction d'un rendez-vous.
 *
 * Déplacer un rendez-vous est l'opération la plus courante d'un agenda
 * commercial, et elle n'était possible depuis aucun écran : seul le statut
 * pouvait changer. Un rendez-vous décalé d'une heure devait être supprimé puis
 * recréé — ce qui perd ses notes au passage.
 *
 * Le prospect ne figure pas dans la charge : l'API le refuse explicitement
 * (`prospect_id` est `prohibited` en modification), un rendez-vous appartenant
 * au dossier où il a été pris.
 *
 * `user_id` non plus : en changer relève de l'encadrement et passe par une
 * autorisation distincte côté API. Le proposer ici ferait échouer une
 * modification sur deux selon le rôle.
 */
export async function updateAppointment(
  prospectId: number,
  appointmentId: number,
  formData: FormData,
): Promise<ActionState> {
  const quand = String(formData.get("scheduled_at") ?? "");

  if (quand === "") {
    return { fieldErrors: { scheduled_at: "La date est obligatoire." } };
  }

  const lieu = String(formData.get("location") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  try {
    await apiFetch(`/appointments/${appointmentId}`, {
      method: "PATCH",
      body: {
        // Même conversion qu'à la planification : la valeur d'un
        // `datetime-local` est une heure locale sans fuseau, que
        // `toISOString` ramène en UTC — le seul format accepté par l'API.
        scheduled_at: new Date(quand).toISOString(),
        duration_minutes: Number(formData.get("duration_minutes") ?? 60),
        type: formData.get("type"),
        // Envoyés à `null` plutôt qu'omis : sans cela, effacer un lieu ou des
        // notes ne les effacerait jamais, la règle `sometimes` de Laravel
        // ignorant les clés absentes.
        location: lieu === "" ? null : lieu,
        notes: notes === "" ? null : notes,
      },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/calendrier");

  return { success: "Rendez-vous mis à jour." };
}

export async function changeAppointmentStatus(
  prospectId: number,
  appointmentId: number,
  statut: AppointmentStatus,
): Promise<ActionState> {
  try {
    await apiFetch(`/appointments/${appointmentId}`, {
      method: "PATCH",
      body: { status: statut },
    });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/calendrier");

  return { success: "Rendez-vous mis à jour." };
}

export async function deleteAppointment(
  prospectId: number,
  appointmentId: number,
): Promise<ActionState> {
  try {
    await apiFetch(`/appointments/${appointmentId}`, { method: "DELETE" });
  } catch (error) {
    return toState(error);
  }

  revalidatePath(`/prospects/${prospectId}`);
  revalidatePath("/calendrier");

  return { success: "Rendez-vous supprimé." };
}

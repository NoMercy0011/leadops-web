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

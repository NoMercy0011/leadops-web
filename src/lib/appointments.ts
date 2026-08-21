import "server-only";

import { apiFetch } from "@/lib/api";
import type { Appointment } from "@/lib/types";

/**
 * Accès à l'agenda.
 *
 * Les bornes `from` et `to` sont des **dates locales** (`AAAA-MM-JJ`), pas des
 * instants : l'API les interprète dans le fuseau de l'entreprise et les
 * convertit en bornes UTC. Envoyer un instant ISO ici ferait déraper la
 * journée d'autant d'heures que le décalage.
 */
export interface AppointmentFilters {
  from?: string;
  to?: string;
  /** `"none"` filtre les rendez-vous sans commercial. */
  user_id?: string;
  project_id?: number;
  /**
   * Remplace les bornes temporelles plutôt que de s'y ajouter : la fiche d'un
   * prospect montre tout son historique, passé comme à venir.
   */
  prospect_id?: number;
  status?: string;
}

export async function listAppointments(
  filters: AppointmentFilters = {},
): Promise<Appointment[]> {
  const query = new URLSearchParams();

  for (const [cle, valeur] of Object.entries(filters)) {
    if (valeur !== undefined && valeur !== "" && valeur !== null) {
      query.set(cle, String(valeur));
    }
  }

  const suffixe = query.size > 0 ? `?${query.toString()}` : "";

  return apiFetch<Appointment[]>(`/appointments${suffixe}`);
}

export async function getAppointment(id: number): Promise<Appointment> {
  return apiFetch<Appointment>(`/appointments/${id}`);
}

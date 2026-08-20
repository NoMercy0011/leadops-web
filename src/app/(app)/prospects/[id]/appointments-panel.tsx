"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  changeAppointmentStatus,
  deleteAppointment,
  scheduleAppointment,
} from "../appointment-actions";
import {
  AppointmentStatusBadge,
  AppointmentTypeIcon,
} from "@/components/appointment-badge";
import { ChampSelect, ChampTexte, NativeSelect } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateHeure } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const STATUTS: { value: AppointmentStatus; label: string }[] = [
  { value: "planned", label: "Planifié" },
  { value: "completed", label: "Réalisé" },
  { value: "cancelled", label: "Annulé" },
  { value: "no_show", label: "Absent" },
];

/**
 * Rendez-vous d'un prospect.
 *
 * La planification part d'ici et non du calendrier : le rendez-vous hérite
 * alors du projet et du commercial du prospect, sans ressaisie ni risque de
 * les faire diverger.
 */
export function AppointmentsPanel({
  prospectId,
  rendezVous,
  fuseau,
}: {
  prospectId: number;
  rendezVous: Appointment[];
  fuseau?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [ouvert, setOuvert] = useState(false);
  const [type, setType] = useState("phone");

  function executer(action: () => Promise<{ message?: string; success?: string }>) {
    startTransition(async () => {
      const resultat = await action();

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  return (
    <div className="space-y-4">
      {rendezVous.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucun rendez-vous planifié.
        </p>
      ) : (
        <ul className="divide-border border-border divide-y rounded-lg border">
          {rendezVous.map((rdv) => (
            <li key={rdv.id} className="space-y-2 px-3 py-2.5">
              <div className="flex items-start gap-2">
                <AppointmentTypeIcon
                  type={rdv.type}
                  libelle={rdv.type_label}
                  className="text-muted-foreground mt-0.5 size-4 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {formatDateHeure(rdv.scheduled_at, { timeZone: fuseau })}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {rdv.duration_minutes} min
                    {rdv.user ? ` · ${rdv.user.name}` : " · non affecté"}
                    {rdv.location ? ` · ${rdv.location}` : ""}
                  </p>
                </div>

                <AppointmentStatusBadge
                  statut={rdv.status}
                  libelle={rdv.status_label}
                  enRetard={rdv.is_overdue}
                />
              </div>

              <div className="flex items-center gap-2">
                <NativeSelect
                  aria-label={`Statut du rendez-vous du ${formatDateHeure(rdv.scheduled_at, { timeZone: fuseau })}`}
                  className="h-7 w-auto text-xs"
                  value={rdv.status}
                  disabled={pending}
                  onChange={(e) =>
                    executer(() =>
                      changeAppointmentStatus(
                        prospectId,
                        rdv.id,
                        e.target.value as AppointmentStatus,
                      ),
                    )
                  }
                >
                  {STATUTS.map((statut) => (
                    <option key={statut.value} value={statut.value}>
                      {statut.label}
                    </option>
                  ))}
                </NativeSelect>

                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive ml-auto size-7"
                  disabled={pending}
                  onClick={() =>
                    executer(() => deleteAppointment(prospectId, rdv.id))
                  }
                  aria-label="Supprimer ce rendez-vous"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {ouvert ? (
        <form
          action={(formData) => {
            setOuvert(false);
            executer(() => scheduleAppointment(prospectId, formData));
          }}
          className="border-border space-y-3 rounded-lg border border-dashed p-3"
        >
          <FieldGroup>
            <ChampTexte
              id="scheduled_at"
              label="Date et heure"
              type="datetime-local"
              required
              autoFocus
              aide="Dans le fuseau de votre entreprise."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <ChampSelect
                id="type"
                label="Modalité"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="phone">Téléphone</option>
                <option value="video">Visioconférence</option>
                <option value="on_site">Physique</option>
              </ChampSelect>

              <ChampSelect id="duration_minutes" label="Durée" defaultValue="60">
                {[15, 30, 45, 60, 90, 120].map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} min
                  </option>
                ))}
              </ChampSelect>
            </div>

            {/* Le lieu n'est demandé que pour un rendez-vous physique : l'API
                l'exige dans ce seul cas, et l'afficher toujours produirait un
                champ vide de sens rempli n'importe comment. */}
            {type === "on_site" ? (
              <ChampTexte
                id="location"
                label="Lieu"
                placeholder="Antananarivo, Analakely"
                required
              />
            ) : null}

            <Textarea
              name="notes"
              rows={2}
              placeholder="Notes (facultatif)"
              aria-label="Notes du rendez-vous"
            />
          </FieldGroup>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              Planifier
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setOuvert(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOuvert(true)}
          disabled={pending}
        >
          <CalendarPlus className="size-4" aria-hidden />
          Planifier un rendez-vous
        </Button>
      )}
    </div>
  );
}

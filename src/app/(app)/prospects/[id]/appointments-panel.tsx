"use client";

import { useState, useTransition } from "react";
import { CalendarPlus, LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  changeAppointmentStatus,
  deleteAppointment,
  scheduleAppointment,
  updateAppointment,
} from "../appointment-actions";
import {
  AppointmentStatusBadge,
  AppointmentTypeIcon,
} from "@/components/appointment-badge";
import { ChampSelect, ChampTexte, NativeSelect } from "@/components/form-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { formatDateHeure, versDatetimeLocal } from "@/lib/format";
import type { Appointment, AppointmentStatus } from "@/lib/types";

const STATUTS: { value: AppointmentStatus; label: string }[] = [
  { value: "planned", label: "Planifié" },
  { value: "completed", label: "Réalisé" },
  { value: "cancelled", label: "Annulé" },
  { value: "no_show", label: "Absent" },
];

const DUREES = [15, 30, 45, 60, 90, 120];

type Resultat = { message?: string; success?: string };

/**
 * Formulaire d'un rendez-vous, partagé par la planification et le report.
 *
 * Les champs sont rigoureusement les mêmes : reporter un rendez-vous, c'est en
 * changer la date, et rien ne justifierait un second formulaire qui divergerait
 * du premier. Le prospect n'y figure pas — il est porté par la fiche, et l'API
 * refuse explicitement de le changer.
 */
function AppointmentForm({
  rendezVous,
  pending,
  onSubmit,
  onCancel,
}: {
  /** Absent à la planification. */
  rendezVous?: Appointment;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const creation = rendezVous === undefined;
  const [type, setType] = useState(rendezVous?.type ?? "phone");

  return (
    <form
      action={onSubmit}
      className="border-border bg-muted/30 space-y-3 rounded-lg border border-dashed p-3"
    >
      <FieldGroup>
        <ChampTexte
          id="scheduled_at"
          label="Date et heure"
          type="datetime-local"
          required
          autoFocus
          defaultValue={versDatetimeLocal(rendezVous?.scheduled_at)}
          aide="Dans le fuseau de votre entreprise."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ChampSelect
            id="type"
            label="Modalité"
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
          >
            <option value="phone">Téléphone</option>
            <option value="video">Visioconférence</option>
            <option value="on_site">Physique</option>
          </ChampSelect>

          <ChampSelect
            id="duration_minutes"
            label="Durée"
            defaultValue={String(rendezVous?.duration_minutes ?? 60)}
          >
            {DUREES.map((minutes) => (
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
            defaultValue={rendezVous?.location ?? ""}
          />
        ) : null}

        <Textarea
          name="notes"
          rows={2}
          placeholder="Notes (facultatif)"
          aria-label="Notes du rendez-vous"
          defaultValue={rendezVous?.notes ?? ""}
        />
      </FieldGroup>

      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          {creation ? "Planifier" : "Enregistrer"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

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
  /** Identifiant du rendez-vous en cours de report, le cas échéant. */
  const [enEdition, setEnEdition] = useState<number | null>(null);

  function executer(action: () => Promise<Resultat>) {
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
          {rendezVous.map((rdv) =>
            enEdition === rdv.id ? (
              <li key={rdv.id} className="p-2">
                <AppointmentForm
                  rendezVous={rdv}
                  pending={pending}
                  onCancel={() => setEnEdition(null)}
                  onSubmit={(formData) => {
                    setEnEdition(null);
                    executer(() =>
                      updateAppointment(prospectId, rdv.id, formData),
                    );
                  }}
                />
              </li>
            ) : (
              <li key={rdv.id} className="space-y-2 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <AppointmentTypeIcon
                    type={rdv.type}
                    libelle={rdv.type_label}
                    className="text-muted-foreground mt-0.5 size-4 shrink-0"
                  />

                  <div className="min-w-0 flex-1">
                    {/* La date et l'heure sont l'information de la ligne : le
                        reste — durée, commercial, lieu — la qualifie. */}
                    <p className="text-[0.9375rem] font-medium tabular-nums">
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
                    className="ml-auto size-7"
                    disabled={pending}
                    onClick={() => {
                      setOuvert(false);
                      setEnEdition(rdv.id);
                    }}
                    aria-label="Reporter ce rendez-vous"
                  >
                    <Pencil className="size-3.5" />
                  </Button>

                  {/* La suppression passait auparavant par un simple clic sur
                      une corbeille, sans retour possible — et le bouton est
                      voisin du sélecteur de statut, qu'on manipule souvent. */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive duration-(--duration-fast) ease-brand size-7 transition-colors"
                        disabled={pending}
                        aria-label="Supprimer ce rendez-vous"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>

                    <AlertDialogContent className="shadow-dialog">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Supprimer ce rendez-vous ?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {formatDateHeure(rdv.scheduled_at, {
                            timeZone: fuseau,
                          })}
                          {rdv.notes ? " — ses notes seront perdues." : "."} Pour
                          un rendez-vous qui n&apos;a pas eu lieu, préférez le
                          statut « Annulé » ou « Absent » : il reste alors dans
                          l&apos;historique et dans les statistiques.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(event) => {
                            // Sans ceci, Radix referme la boîte et démonte le
                            // bouton avant que l'action serveur ne parte.
                            event.preventDefault();
                            executer(() =>
                              deleteAppointment(prospectId, rdv.id),
                            );
                          }}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {ouvert ? (
        <AppointmentForm
          pending={pending}
          onCancel={() => setOuvert(false)}
          onSubmit={(formData) => {
            setOuvert(false);
            executer(() => scheduleAppointment(prospectId, formData));
          }}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEnEdition(null);
            setOuvert(true);
          }}
          disabled={pending}
        >
          <CalendarPlus className="size-4" aria-hidden />
          Planifier un rendez-vous
        </Button>
      )}
    </div>
  );
}

import Link from "next/link";

import {
  AppointmentStatusBadge,
  AppointmentTypeIcon,
} from "@/components/appointment-badge";
import { aujourdhui, cleJour, formatHeure } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

/**
 * Grille mensuelle.
 *
 * Le regroupement se fait par journée **locale** via `cleJour`, jamais par
 * découpage d'une chaîne ISO : celle-ci porte l'instant UTC, et pour une
 * entreprise à +03 un rendez-vous de 01h00 se rangerait la veille. La case
 * serait simplement vide, sans qu'aucune erreur ne le signale.
 */
const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function grilleDuMois(annee: number, mois: number): Date[] {
  const premier = new Date(Date.UTC(annee, mois, 1));

  // La semaine commence lundi : `getUTCDay()` renvoie 0 pour dimanche, qu'on
  // ramène en fin de semaine.
  const decalage = (premier.getUTCDay() + 6) % 7;

  const debut = new Date(premier);
  debut.setUTCDate(1 - decalage);

  // Six semaines couvrent tous les cas de figure, y compris un mois de 31
  // jours commençant un dimanche. La grille garde ainsi une hauteur stable
  // d'un mois à l'autre, ce qui évite de faire sauter la page.
  return Array.from({ length: 42 }, (_, index) => {
    const jour = new Date(debut);
    jour.setUTCDate(debut.getUTCDate() + index);

    return jour;
  });
}

export function MonthGrid({
  annee,
  mois,
  rendezVous,
  fuseau,
}: {
  annee: number;
  mois: number;
  rendezVous: Appointment[];
  fuseau?: string;
}) {
  const parJour = new Map<string, Appointment[]>();

  for (const rdv of rendezVous) {
    const cle = cleJour(rdv.scheduled_at, { timeZone: fuseau });
    parJour.set(cle, [...(parJour.get(cle) ?? []), rdv]);
  }

  const cases = grilleDuMois(annee, mois);
  const ceJour = aujourdhui({ timeZone: fuseau });

  return (
    <div className="border-border overflow-hidden rounded-xl border">
      <div className="bg-muted/50 text-muted-foreground grid grid-cols-7 border-b text-xs font-medium">
        {JOURS.map((jour) => (
          <div key={jour} className="px-2 py-2 text-center">
            {jour}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cases.map((jour) => {
          // La clé de grille est construite en UTC parce que les cases le
          // sont : c'est le contenu qui est groupé en heure locale.
          const cle = jour.toISOString().slice(0, 10);
          const duMois = jour.getUTCMonth() === mois;
          const evenements = parJour.get(cle) ?? [];
          const estAujourdhui = cle === ceJour;

          return (
            <div
              key={cle}
              className={cn(
                "border-border min-h-24 border-r border-b p-1.5 last:border-r-0",
                !duMois && "bg-muted/30",
              )}
            >
              <div className="mb-1 flex items-center justify-between">
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full text-xs tabular-nums",
                    estAujourdhui && "bg-primary text-primary-foreground font-semibold",
                    !duMois && "text-muted-foreground/50",
                  )}
                >
                  {jour.getUTCDate()}
                </span>
              </div>

              <ul className="space-y-1">
                {evenements.slice(0, 3).map((rdv) => (
                  <li key={rdv.id}>
                    <Link
                      href={`/prospects/${rdv.prospect_id}`}
                      className={cn(
                        "hover:bg-accent flex items-center gap-1 rounded px-1 py-0.5 text-xs transition-colors",
                        rdv.is_overdue && "text-warning-subtle-foreground",
                      )}
                      title={`${formatHeure(rdv.scheduled_at, { timeZone: fuseau })} — ${rdv.prospect?.full_name ?? ""} (${rdv.status_label})`}
                    >
                      <AppointmentTypeIcon
                        type={rdv.type}
                        libelle={rdv.type_label}
                        className="size-3 shrink-0"
                      />
                      <span className="shrink-0 tabular-nums">
                        {formatHeure(rdv.scheduled_at, { timeZone: fuseau })}
                      </span>
                      <span className="truncate">
                        {rdv.prospect?.full_name ?? "—"}
                      </span>
                    </Link>
                  </li>
                ))}

                {evenements.length > 3 ? (
                  <li className="text-muted-foreground px-1 text-xs">
                    +{evenements.length - 3} autre
                    {evenements.length - 3 > 1 ? "s" : ""}
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Liste chronologique — vue jour et semaine.
 *
 * Une liste plutôt qu'une grille horaire : les rendez-vous commerciaux sont
 * peu nombreux dans une journée, et une grille de 24 lignes serait vide à 90 %
 * tout en repoussant l'information utile hors de l'écran.
 */
export function AgendaList({
  rendezVous,
  fuseau,
}: {
  rendezVous: Appointment[];
  fuseau?: string;
}) {
  const parJour = new Map<string, Appointment[]>();

  for (const rdv of rendezVous) {
    const cle = cleJour(rdv.scheduled_at, { timeZone: fuseau });
    parJour.set(cle, [...(parJour.get(cle) ?? []), rdv]);
  }

  const ceJour = aujourdhui({ timeZone: fuseau });

  return (
    <div className="space-y-6">
      {[...parJour.entries()].map(([cle, evenements]) => (
        <section key={cle} className="space-y-2">
          <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {new Intl.DateTimeFormat("fr-FR", {
              weekday: "long",
              day: "numeric",
              month: "long",
              timeZone: "UTC",
            }).format(new Date(`${cle}T12:00:00Z`))}
            {cle === ceJour ? (
              <span className="text-primary ml-2 normal-case">
                — aujourd&apos;hui
              </span>
            ) : null}
          </h2>

          <ul className="divide-border border-border divide-y rounded-xl border">
            {evenements.map((rdv) => (
              <li key={rdv.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-12 shrink-0 text-sm tabular-nums">
                  {formatHeure(rdv.scheduled_at, { timeZone: fuseau })}
                </span>

                <AppointmentTypeIcon
                  type={rdv.type}
                  libelle={rdv.type_label}
                  className="text-muted-foreground size-4 shrink-0"
                />

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/prospects/${rdv.prospect_id}`}
                    className="block truncate text-sm font-medium hover:underline"
                  >
                    {rdv.prospect?.full_name ?? "—"}
                  </Link>
                  <p className="text-muted-foreground truncate text-xs">
                    {rdv.project?.name}
                    {rdv.user ? ` · ${rdv.user.name}` : " · non affecté"}
                    {rdv.location ? ` · ${rdv.location}` : ""}
                  </p>
                </div>

                <AppointmentStatusBadge
                  statut={rdv.status}
                  libelle={rdv.status_label}
                  enRetard={rdv.is_overdue}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

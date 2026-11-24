import Link from "next/link";
import { CalendarDays, MapPin } from "lucide-react";

import {
  AppointmentStatusBadge,
  AppointmentTypeIcon,
} from "@/components/appointment-badge";
import { StatusBadge } from "@/components/status-badge";
import { formatDateCourte, formatHeure } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

/**
 * Détail de la période sélectionnée.
 *
 * C'est la contrepartie du navigateur mensuel : la grille dit combien, ce
 * panneau dit qui — en entier, sans troncature, avec le projet, le type, la
 * durée et le lieu.
 *
 * **Le projet y figure toujours.** Une même personne peut exister dans
 * plusieurs projets — la modélisation l'admet explicitement — et deux
 * rendez-vous voisins affichent alors le même nom à la même heure. Sur la
 * grille, rien ne les distinguait ; ici, leur projet suffit.
 *
 * La liste défile à l'intérieur du panneau. C'est la seule zone défilante de
 * l'écran, et elle reste à sa place : le repère mensuel ne bouge jamais.
 */
export function PanneauAgenda({
  rendezVous,
  titre,
  /** Affiche la date de chaque ligne — utile dès que la période dépasse un jour. */
  avecDate = false,
  fuseau,
}: {
  rendezVous: Appointment[];
  titre: string;
  avecDate?: boolean;
  fuseau?: string;
}) {
  return (
    <div className="bg-card flex min-h-0 flex-col overflow-hidden rounded-xl border">
      <div className="flex flex-none items-baseline justify-between gap-3 border-b px-4 py-2.5">
        <h2 className="text-sm font-semibold first-letter:uppercase">{titre}</h2>
        <span className="text-muted-foreground text-xs">
          {rendezVous.length === 0
            ? "aucun rendez-vous"
            : `${rendezVous.length} rendez-vous`}
        </span>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {rendezVous.length === 0 ? (
          <div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm">
            <CalendarDays className="size-6 opacity-50" aria-hidden />
            <p className="max-w-xs leading-relaxed">
              Aucun rendez-vous sur cette période. Les rendez-vous se planifient
              depuis la fiche d&apos;un prospect, dont ils héritent le projet et
              le commercial.
            </p>
          </div>
        ) : (
          <ul className="space-y-px">
            {rendezVous.map((rdv) => (
              <li key={rdv.id}>
                <Link
                  href={`/prospects/${rdv.prospect_id}`}
                  className="hover:bg-muted duration-(--duration-fast) ease-brand flex gap-3 rounded-lg px-2.5 py-2 transition-colors"
                >
                  <span className="w-14 shrink-0 pt-0.5 text-right font-mono text-xs tabular-nums">
                    {formatHeure(rdv.scheduled_at, { timeZone: fuseau })}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <AppointmentTypeIcon
                        type={rdv.type}
                        libelle={rdv.type_label}
                        className="text-muted-foreground size-3.5 shrink-0"
                      />
                      <span
                        className={cn(
                          "truncate text-sm font-medium",
                          // Un rendez-vous clos ne réclame plus rien : il
                          // s'efface au profit de ceux qui restent à traiter.
                          (rdv.status === "cancelled" ||
                            rdv.status === "completed") &&
                            "text-muted-foreground",
                        )}
                      >
                        {rdv.prospect?.full_name ?? "Prospect inconnu"}
                      </span>
                      {/* Lot 9, décision P8 : l'archivage range le prospect,
                          il ne cache pas ses rendez-vous. La mention dit
                          pourquoi celui-ci ne compte dans aucun total. */}
                      {rdv.prospect?.is_archived ? (
                        <StatusBadge tone="neutral">Archivé</StatusBadge>
                      ) : null}
                    </span>

                    <span className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
                      <AppointmentStatusBadge
                        statut={rdv.status}
                        libelle={rdv.status_label}
                        enRetard={rdv.is_overdue}
                      />

                      {avecDate ? (
                        <span>
                          {formatDateCourte(rdv.scheduled_at, {
                            timeZone: fuseau,
                          })}
                        </span>
                      ) : null}

                      {rdv.project?.name ? <span>{rdv.project.name}</span> : null}

                      <span>·</span>
                      <span>{rdv.duration_minutes} min</span>

                      {rdv.location ? (
                        <>
                          <span>·</span>
                          <span className="inline-flex min-w-0 items-center gap-1">
                            <MapPin className="size-3 shrink-0" aria-hidden />
                            <span className="truncate">{rdv.location}</span>
                          </span>
                        </>
                      ) : null}

                      {rdv.user?.name ? (
                        <>
                          <span>·</span>
                          <span className="truncate">{rdv.user.name}</span>
                        </>
                      ) : null}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

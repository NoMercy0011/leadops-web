"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { NativeSelect } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import type { Project, User } from "@/lib/types";

type Vue = "jour" | "semaine" | "mois";

const LIBELLES: Record<Vue, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
};

/**
 * Navigation et filtres du calendrier.
 *
 * L'état vit dans l'URL, comme pour la liste des prospects : un manager doit
 * pouvoir envoyer « la semaine de Sarah sur le projet Santé » par lien, et le
 * retour arrière du navigateur doit ramener la période précédente.
 */
export function CalendarControls({
  vue,
  ancre,
  projets,
  utilisateurs,
}: {
  vue: Vue;
  ancre: string;
  projets: Project[];
  utilisateurs: User[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function naviguer(modifications: Record<string, string | null>) {
    const suivants = new URLSearchParams(params.toString());

    for (const [cle, valeur] of Object.entries(modifications)) {
      if (valeur === null || valeur === "") {
        suivants.delete(cle);
      } else {
        suivants.set(cle, valeur);
      }
    }

    startTransition(() => router.replace(`/calendrier?${suivants}`));
  }

  /**
   * Décale l'ancre d'une période.
   *
   * Le calcul se fait en UTC sur une date sans heure : passer par un `Date`
   * local ferait sauter un jour à chaque changement d'heure, et l'ancre est
   * précisément ce qui ne doit pas bouger.
   */
  function decaler(sens: -1 | 1) {
    const [annee, mois, jour] = ancre.split("-").map(Number);
    const date = new Date(Date.UTC(annee, mois - 1, jour));

    if (vue === "jour") {
      date.setUTCDate(date.getUTCDate() + sens);
    } else if (vue === "semaine") {
      date.setUTCDate(date.getUTCDate() + sens * 7);
    } else {
      date.setUTCMonth(date.getUTCMonth() + sens);
    }

    naviguer({ date: date.toISOString().slice(0, 10) });
  }

  const [annee, mois, jour] = ancre.split("-").map(Number);
  const reference = new Date(Date.UTC(annee, mois - 1, jour));

  const titre = new Intl.DateTimeFormat("fr-FR", {
    ...(vue === "mois"
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" }),
    timeZone: "UTC",
  }).format(reference);

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-pending={pending || undefined}
    >
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => decaler(-1)}
          aria-label="Période précédente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="size-8"
          onClick={() => decaler(1)}
          aria-label="Période suivante"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => naviguer({ date: null })}
        >
          Aujourd&apos;hui
        </Button>
      </div>

      <p className="font-heading min-w-44 text-base font-semibold first-letter:uppercase">
        {titre}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <NativeSelect
          aria-label="Affichage"
          className="w-auto"
          value={vue}
          onChange={(e) => naviguer({ vue: e.target.value })}
        >
          {(Object.keys(LIBELLES) as Vue[]).map((v) => (
            <option key={v} value={v}>
              {LIBELLES[v]}
            </option>
          ))}
        </NativeSelect>

        <NativeSelect
          aria-label="Filtrer par projet"
          className="w-auto min-w-36"
          value={params.get("project_id") ?? ""}
          onChange={(e) => naviguer({ project_id: e.target.value })}
        >
          <option value="">Tous les projets</option>
          {projets.map((projet) => (
            <option key={projet.id} value={projet.id}>
              {projet.name}
            </option>
          ))}
        </NativeSelect>

        {utilisateurs.length > 0 ? (
          <NativeSelect
            aria-label="Filtrer par commercial"
            className="w-auto min-w-40"
            value={params.get("user_id") ?? ""}
            onChange={(e) => naviguer({ user_id: e.target.value })}
          >
            <option value="">Tous les commerciaux</option>
            <option value="none">Sans commercial</option>
            {utilisateurs.map((membre) => (
              <option key={membre.id} value={membre.id}>
                {membre.name}
              </option>
            ))}
          </NativeSelect>
        ) : null}

        <NativeSelect
          aria-label="Filtrer par statut"
          className="w-auto min-w-32"
          value={params.get("status") ?? ""}
          onChange={(e) => naviguer({ status: e.target.value })}
        >
          <option value="">Tous les statuts</option>
          <option value="planned">Planifié</option>
          <option value="completed">Réalisé</option>
          <option value="cancelled">Annulé</option>
          <option value="no_show">Absent</option>
        </NativeSelect>
      </div>
    </div>
  );
}

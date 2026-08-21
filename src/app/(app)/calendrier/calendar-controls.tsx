import Link from "next/link";
import { ChevronLeft, ChevronRight, SlidersHorizontal } from "lucide-react";

import {
  FamilleFiltre,
  type OptionFiltre,
} from "@/components/filtres";
import { Button } from "@/components/ui/button";
import type { Project, User } from "@/lib/types";

export type Vue = "jour" | "semaine" | "mois";

const LIBELLES: Record<Vue, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
};

/**
 * Statuts de rendez-vous, dans les teintes de leurs pastilles.
 *
 * Reprises de `AppointmentStatusBadge` : un filtre et la ligne qu'il ramène
 * doivent porter la même couleur, sans quoi le rapprochement se refait de tête
 * à chaque fois.
 */
const STATUTS: OptionFiltre[] = [
  { valeur: "", libelle: "Tous" },
  { valeur: "planned", libelle: "Planifié", ton: "blue" },
  { valeur: "completed", libelle: "Réalisé", ton: "sage" },
  { valeur: "cancelled", libelle: "Annulé", ton: "slate" },
  { valeur: "no_show", libelle: "Absent", ton: "red" },
];

/**
 * Décale la date d'ancrage d'une période, en UTC.
 *
 * Le calcul porte sur une date sans heure : passer par un `Date` local ferait
 * sauter un jour à chaque changement d'heure, et l'ancre est précisément ce
 * qui ne doit pas bouger.
 */
export function decaler(ancre: string, vue: Vue, sens: -1 | 1): string {
  const [annee, mois, jour] = ancre.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));

  if (vue === "jour") date.setUTCDate(date.getUTCDate() + sens);
  else if (vue === "semaine") date.setUTCDate(date.getUTCDate() + sens * 7);
  else date.setUTCMonth(date.getUTCMonth() + sens);

  return date.toISOString().slice(0, 10);
}

/**
 * Commandes du calendrier : navigation, échelle, filtres.
 *
 * **Les flèches déplacent ce qu'on lit, pas la grille.** L'échelle choisie —
 * jour, semaine, mois — détermine à la fois l'étendue du panneau de détail et
 * le pas des flèches. La grille, elle, suit toujours le mois de la date
 * retenue : elle sert à se repérer, pas à afficher.
 *
 * **Les filtres se replient dans un `details` natif.** Fermés, ils tiennent
 * sur une ligne et résument ce qui est appliqué ; ouverts, ils poussent la
 * grille et le panneau, qui absorbent la différence sans que la page défile.
 * Aucun script : l'élément est utilisable au clavier par construction.
 */
export function CalendarControls({
  vue,
  ancre,
  titre,
  fuseau,
  projets,
  utilisateurs,
  parametres,
}: {
  vue: Vue;
  ancre: string;
  /** Libellé de la période affichée, déjà mis en forme par la page. */
  titre: string;
  fuseau?: string;
  projets: Project[];
  utilisateurs: User[];
  parametres: URLSearchParams;
}) {
  const base = "/calendrier";

  const versDate = (date: string | null) => {
    const suivants = new URLSearchParams(parametres);

    if (date === null) suivants.delete("date");
    else suivants.set("date", date);

    return suivants.size > 0 ? `${base}?${suivants}` : base;
  };

  const optionsProjet: OptionFiltre[] = [
    { valeur: "", libelle: "Tous" },
    ...projets.map((projet) => ({
      valeur: String(projet.id),
      libelle: projet.name,
    })),
  ];

  const optionsCommercial: OptionFiltre[] = [
    { valeur: "", libelle: "Tous" },
    ...utilisateurs.map((membre) => ({
      valeur: String(membre.id),
      libelle: membre.name,
    })),
    { valeur: "none", libelle: "Sans commercial" },
  ];

  // Résumé des filtres appliqués, pour que la ligne fermée dise ce qu'elle
  // cache. Un replié muet obligerait à l'ouvrir pour savoir s'il agit.
  const nomActif = (options: OptionFiltre[], cle: string) =>
    options.find((o) => o.valeur === (parametres.get(cle) ?? ""))?.libelle ??
    "Tous";

  const resume = [
    parametres.get("project_id")
      ? nomActif(optionsProjet, "project_id")
      : "tous les projets",
    parametres.get("user_id")
      ? nomActif(optionsCommercial, "user_id")
      : "tous les commerciaux",
    parametres.get("status")
      ? nomActif(STATUTS, "status")
      : "tous les statuts",
  ];

  const filtre = ["project_id", "user_id", "status"].some((cle) =>
    parametres.get(cle),
  );

  return (
    <div className="flex flex-none flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" className="size-7">
            <Link
              href={versDate(decaler(ancre, vue, -1))}
              aria-label="Période précédente"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-7">
            <Link
              href={versDate(decaler(ancre, vue, 1))}
              aria-label="Période suivante"
            >
              <ChevronRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href={versDate(null)}>Aujourd&apos;hui</Link>
          </Button>
        </div>

        <p className="font-heading text-[0.9375rem] font-semibold first-letter:uppercase">
          {titre}
        </p>

        {/* Le fuseau conditionne toutes les heures affichées : il se dit une
            fois, à côté de la période, plutôt que dans une description de page
            que l'écran n'a plus. */}
        {fuseau ? (
          <span className="text-muted-foreground text-xs">{fuseau}</span>
        ) : null}

        <div className="ml-auto">
          <FamilleFiltre
            libelle="Étendue affichée"
            parametre="vue"
            options={(Object.keys(LIBELLES) as Vue[]).map((v) => ({
              valeur: v,
              libelle: LIBELLES[v],
            }))}
            valeurActive={vue}
            base={base}
            parametres={parametres}
            compact
          />
        </div>
      </div>

      <details className="bg-card rounded-xl border" open={filtre}>
        <summary className="text-muted-foreground marker:content-none flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[0.8125rem]">
          <SlidersHorizontal className="size-3.5 shrink-0" aria-hidden />
          Filtres —{" "}
          <span className={filtre ? "text-foreground font-medium" : undefined}>
            {resume.join(", ")}
          </span>
        </summary>

        <div className="flex flex-col gap-2 px-3 pt-1 pb-3">
          <FamilleFiltre
            libelle="Projet"
            parametre="project_id"
            options={optionsProjet}
            valeurActive={parametres.get("project_id") ?? ""}
            base={base}
            parametres={parametres}
          />

          {utilisateurs.length > 0 ? (
            <FamilleFiltre
              libelle="Commercial"
              parametre="user_id"
              options={optionsCommercial}
              valeurActive={parametres.get("user_id") ?? ""}
              base={base}
              parametres={parametres}
            />
          ) : null}

          <FamilleFiltre
            libelle="Statut"
            parametre="status"
            options={STATUTS}
            valeurActive={parametres.get("status") ?? ""}
            base={base}
            parametres={parametres}
          />
        </div>
      </details>
    </div>
  );
}

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  BarreFiltres,
  FamilleFiltre,
  LigneFiltre,
  type OptionFiltre,
} from "@/components/filtres";
import { Button } from "@/components/ui/button";
import type { Project, User } from "@/lib/types";

type Vue = "jour" | "semaine" | "mois";

const LIBELLES: Record<Vue, string> = {
  jour: "Jour",
  semaine: "Semaine",
  mois: "Mois",
};

/**
 * Statuts de rendez-vous, dans les mêmes teintes que leurs pastilles.
 *
 * La correspondance est reprise de `AppointmentStatusBadge` : un filtre et la
 * ligne qu'il ramène doivent porter la même couleur, sans quoi le rapprochement
 * se fait de tête à chaque fois.
 */
const STATUTS: OptionFiltre[] = [
  { valeur: "", libelle: "Tous" },
  { valeur: "planned", libelle: "Planifié", ton: "blue" },
  { valeur: "completed", libelle: "Réalisé", ton: "sage" },
  { valeur: "cancelled", libelle: "Annulé", ton: "slate" },
  { valeur: "no_show", libelle: "Absent", ton: "red" },
];

/**
 * Décale une date d'une période, en UTC.
 *
 * Le calcul porte sur une date sans heure : passer par un `Date` local ferait
 * sauter un jour à chaque changement d'heure, et l'ancre est précisément ce
 * qui ne doit pas bouger.
 */
function decaler(ancre: string, vue: Vue, sens: -1 | 1): string {
  const [annee, mois, jour] = ancre.split("-").map(Number);
  const date = new Date(Date.UTC(annee, mois - 1, jour));

  if (vue === "jour") date.setUTCDate(date.getUTCDate() + sens);
  else if (vue === "semaine") date.setUTCDate(date.getUTCDate() + sens * 7);
  else date.setUTCMonth(date.getUTCMonth() + sens);

  return date.toISOString().slice(0, 10);
}

/**
 * Navigation et filtres du calendrier.
 *
 * Même modèle que la liste des prospects : des jetons cliquables plutôt que
 * des listes déroulantes, et un composant *serveur* — les jetons et les
 * flèches sont des liens, il n'y a plus rien à exécuter dans le navigateur.
 *
 * L'état reste dans l'URL : un manager envoie « la semaine de Sarah sur le
 * projet Santé » par lien, et le retour arrière ramène la période précédente.
 */
export function CalendarControls({
  vue,
  ancre,
  projets,
  utilisateurs,
  parametres,
}: {
  vue: Vue;
  ancre: string;
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

  const [annee, mois, jour] = ancre.split("-").map(Number);
  const reference = new Date(Date.UTC(annee, mois - 1, jour));

  const titre = new Intl.DateTimeFormat("fr-FR", {
    ...(vue === "mois"
      ? { month: "long", year: "numeric" }
      : { day: "numeric", month: "long", year: "numeric" }),
    timeZone: "UTC",
  }).format(reference);

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

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button asChild variant="outline" size="icon" className="size-8">
            <Link
              href={versDate(decaler(ancre, vue, -1))}
              aria-label="Période précédente"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline" size="icon" className="size-8">
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

        <p className="font-heading min-w-44 text-base font-semibold first-letter:uppercase">
          {titre}
        </p>

        {/* L'affichage n'est pas un filtre mais une échelle de lecture : il
            reste sur la ligne de navigation, à côté de la période qu'il
            découpe, plutôt que dans la barre du dessous. */}
        <div className="ml-auto">
          <FamilleFiltre
            libelle="Vue"
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

      <BarreFiltres>
        <LigneFiltre>
          <FamilleFiltre
            libelle="Projet"
            parametre="project_id"
            options={optionsProjet}
            valeurActive={parametres.get("project_id") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>

        {utilisateurs.length > 0 ? (
          <LigneFiltre>
            <FamilleFiltre
              libelle="Commercial"
              parametre="user_id"
              options={optionsCommercial}
              valeurActive={parametres.get("user_id") ?? ""}
              base={base}
              parametres={parametres}
            />
          </LigneFiltre>
        ) : null}

        <LigneFiltre>
          <FamilleFiltre
            libelle="Statut"
            parametre="status"
            options={STATUTS}
            valeurActive={parametres.get("status") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>
      </BarreFiltres>
    </div>
  );
}

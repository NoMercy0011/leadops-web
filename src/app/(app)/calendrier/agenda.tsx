/**
 * Agenda partagé par le Calendrier et l'onglet Rendez-vous d'un projet
 * (lot 9, décision P6) : un seul écran, borné ou non à un projet. Deux agendas
 * distincts finissaient par diverger — la branche affichait dans l'onglet une
 * grille mensuelle différente de celle du Calendrier.
 */
import { CalendarControls, type Vue } from "./calendar-controls";
import { MiniMois } from "./mini-mois";
import { PanneauAgenda } from "./panneau-agenda";
import { resumeAgenda } from "@/lib/agenda";
import { listAppointments } from "@/lib/appointments";
import { requireUser } from "@/lib/dal";
import { aujourdhui, cleJour, formatNombre } from "@/lib/format";
import { getOptionsFiltres } from "@/lib/options";
import { cn } from "@/lib/utils";
import type { Appointment } from "@/lib/types";

/**
 * Plage à demander à l'API : le mois affiché, débordé d'une semaine.
 *
 * La semaine de part et d'autre couvre deux besoins d'un coup — les cases de
 * la grille qui appartiennent aux mois voisins, et une semaine sélectionnée
 * qui chevauche un changement de mois.
 */
function bornes(ancre: string): { from: string; to: string } {
  const [annee, mois] = ancre.split("-").map(Number);

  const debut = new Date(Date.UTC(annee, mois - 1, 1));
  debut.setUTCDate(debut.getUTCDate() - 7);

  const fin = new Date(Date.UTC(annee, mois, 0));
  fin.setUTCDate(fin.getUTCDate() + 7);

  return {
    from: debut.toISOString().slice(0, 10),
    to: fin.toISOString().slice(0, 10),
  };
}

/** Lundi de la semaine contenant cette date locale. */
function lundi(date: string): string {
  const [annee, mois, jour] = date.split("-").map(Number);
  const d = new Date(Date.UTC(annee, mois - 1, jour));

  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));

  return d.toISOString().slice(0, 10);
}

function plusDeJours(date: string, jours: number): string {
  const [annee, mois, jour] = date.split("-").map(Number);
  const d = new Date(Date.UTC(annee, mois - 1, jour + jours));

  return d.toISOString().slice(0, 10);
}

const JOUR_LONG = new Intl.DateTimeFormat("fr-FR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const JOUR_COURT = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const MOIS_LONG = new Intl.DateTimeFormat("fr-FR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const enUtc = (date: string) => new Date(`${date}T00:00:00Z`);

/**
 * Calendrier — grille de navigation à gauche, détail à droite.
 *
 * **L'écran ne défile pas.** La coquille se fixe à la hauteur de la fenêtre
 * (voir le layout de l'espace) et cette page occupe ce qui reste : seul le
 * panneau de détail défile, à sa place. Le repère mensuel ne bouge jamais, ce
 * qui est tout l'intérêt d'une vue calendaire.
 *
 * **La grille montre la densité, le panneau montre le détail.** L'ancienne
 * version affichait trois lignes tronquées par case puis « +2 autres » : ni
 * lisible, ni comptable. Ici la grille répond à « quand », le panneau à
 * « qui » — et il a la hauteur pour le dire en entier.
 *
 * L'échelle — jour, semaine, mois — pilote l'étendue du panneau, plus la
 * grille : celle-ci suit toujours le mois de la date retenue.
 */
export async function Agenda({
  params,
  base,
  projetId,
}: {
  params: Record<string, string | string[] | undefined>;
  /** Adresse de l'écran, pour les liens de navigation et de filtre. */
  base: string;
  /** Onglet Rendez-vous d'un projet : l'agenda est borné à ce projet (lot 9, P6). */
  projetId?: number;
}) {
  const user = await requireUser();

  const fuseau = user.company?.timezone;
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const vue: Vue =
    params.vue === "semaine" || params.vue === "mois" ? params.vue : "jour";

  // L'ancre par défaut est la journée locale de l'entreprise, pas celle du
  // serveur : à Antananarivo, un serveur en UTC bascule trois heures trop tard.
  const ceJour = aujourdhui({ timeZone: fuseau });
  const ancre =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : ceJour;

  const [rendezVous, options] = await Promise.all([
    listAppointments({
      ...bornes(ancre),
      user_id: typeof params.user_id === "string" ? params.user_id : undefined,
      project_id: projetId ?? (Number(params.project_id) || undefined),
      status: typeof params.status === "string" ? params.status : undefined,
    }),
    // Tout le périmètre, sans la borne de 25 des listes paginées (lot 10, R2).
    getOptionsFiltres(),
  ]);

  // Le projet est fixé dans l'onglet d'un projet : la liste ne sert à rien.
  const projets = { data: projetId ? [] : options.projects };
  const utilisateurs = { data: encadrement ? options.users : [] };

  const filtresActifs = new URLSearchParams(
    Object.entries(params).flatMap(([cle, valeur]) =>
      typeof valeur === "string" && valeur !== "" ? [[cle, valeur]] : [],
    ),
  );

  // Effectifs par journée locale, pour les points de la grille. Le regroupement
  // passe par `cleJour`, seul endroit qui connaît la conversion de fuseau.
  const parJour = new Map<string, { total: number; retard: boolean }>();

  for (const rdv of rendezVous) {
    const jour = cleJour(rdv.scheduled_at, { timeZone: fuseau });
    const actuel = parJour.get(jour) ?? { total: 0, retard: false };

    parJour.set(jour, {
      total: actuel.total + 1,
      retard: actuel.retard || rdv.is_overdue,
    });
  }

  // Étendue du panneau. Les bornes sont inclusives et comparées en chaînes :
  // au format `AAAA-MM-JJ`, l'ordre lexicographique est l'ordre calendaire.
  const [debut, fin, titre]: [string, string, string] =
    vue === "jour"
      ? [ancre, ancre, JOUR_LONG.format(enUtc(ancre))]
      : vue === "semaine"
        ? [
            lundi(ancre),
            plusDeJours(lundi(ancre), 6),
            `Du ${JOUR_COURT.format(enUtc(lundi(ancre)))} au ${JOUR_COURT.format(
              enUtc(plusDeJours(lundi(ancre), 6)),
            )}`,
          ]
        : [
            `${ancre.slice(0, 7)}-01`,
            `${ancre.slice(0, 7)}-31`,
            MOIS_LONG.format(enUtc(ancre)),
          ];

  const dansLEtendue = (rdv: Appointment) => {
    const jour = cleJour(rdv.scheduled_at, { timeZone: fuseau });

    return jour >= debut && jour <= fin;
  };

  const affiches = rendezVous.filter(dansLEtendue);

  // Les compteurs portent sur la période affichée (lot 9, faille F18) : ils
  // étaient calculés sur le mois chargé, ±7 jours, quand le panneau montrait
  // un seul jour, et rien ne le disait. Comme les tuiles du tableau de bord,
  // ils ignorent les rendez-vous des prospects archivés (règle R5) ; le
  // panneau, lui, les montre, marqués « Archivé ».
  const resume = resumeAgenda(
    affiches.filter((rdv) => !rdv.prospect?.is_archived),
    { fuseau, ceJour },
  );
  const periodeContientAujourdhui = ceJour >= debut && ceJour <= fin;
  const [annee, mois] = ancre.split("-").map(Number);

  const COMPTEURS = [
    { libelle: "À clôturer", valeur: resume.aCloturer, alerte: true },
    // Masqué quand la période affichée ne contient pas aujourd'hui : un
    // zéro y serait vrai et trompeur (question ouverte de la planche).
    ...(periodeContientAujourdhui
      ? [{ libelle: "Aujourd’hui", valeur: resume.aujourdhui, alerte: false }]
      : []),
    { libelle: "À venir", valeur: resume.aVenir, alerte: false },
    { libelle: "Réalisés", valeur: resume.realises, alerte: false },
    { libelle: "Absents", valeur: resume.absents, alerte: false },
  ];

  return (
    // `min-h-0` est ce qui rend l'écran non défilant : sans lui, un enfant en
    // `flex-1` prend sa hauteur de contenu au lieu de celle du parent, et c'est
    // la coquille qui se met à défiler.
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <CalendarControls
        vue={vue}
        ancre={ancre}
        titre={titre}
        fuseau={fuseau}
        projets={projets.data}
        utilisateurs={utilisateurs.data}
        parametres={filtresActifs}
        base={base}
        projetFixe={projetId !== undefined}
      />

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[19rem_1fr]">
        {/* Colonne de repérage : où sont les rendez-vous, et ce qui appelle une
            action. Les cinq nombres tenaient auparavant dans des tuiles pleine
            largeur, pour 311 px — ils occupent ici la place que la colonne
            laissait vide. */}
        {/* `self-start` : la carte s'arrête à sa hauteur utile. Étirée par la
            grille, elle laissait trois cents pixels de vide encadrés d'une
            bordure, ce qui se lit comme un bloc inachevé plutôt que comme une
            colonne courte. */}
        <div className="bg-card flex flex-col self-start overflow-hidden rounded-xl border">
          <MiniMois
            annee={annee}
            mois={mois - 1}
            jourChoisi={ancre}
            ceJour={ceJour}
            parJour={parJour}
            base={base}
            parametres={filtresActifs}
          />

          <dl className="flex flex-col gap-1.5 border-t px-4 py-3">
            {COMPTEURS.map((compteur) => (
              <div
                key={compteur.libelle}
                className="flex items-baseline justify-between gap-3"
              >
                <dt
                  className={cn(
                    "text-xs",
                    compteur.alerte && compteur.valeur > 0
                      ? "text-warning-subtle-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {compteur.libelle}
                </dt>
                <dd
                  className={cn(
                    "font-mono text-sm tabular-nums",
                    // L'accent n'apparaît que s'il y a matière : colorer un
                    // zéro en alerte crie sans raison, et l'œil finit par
                    // ignorer la couleur.
                    compteur.alerte && compteur.valeur > 0
                      ? "text-warning-subtle-foreground font-semibold"
                      : undefined,
                  )}
                >
                  {formatNombre(compteur.valeur)}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <PanneauAgenda
          rendezVous={affiches}
          titre={titre}
          avecDate={vue !== "jour"}
          fuseau={fuseau}
        />
      </div>
    </div>
  );
}

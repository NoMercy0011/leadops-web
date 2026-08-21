import { CalendarCheck, CalendarClock, CircleCheck, UserX } from "lucide-react";

import { StatTile } from "@/components/stat-tile";
import type { ResumeAgenda } from "@/lib/agenda";

/**
 * En-tête chiffré du calendrier.
 *
 * **Ce qui compte le plus n'est pas ce qui vient, mais ce qui traîne.** Un
 * rendez-vous encore « planifié » alors que son heure est passée n'est pas un
 * détail d'affichage : tant qu'il n'est pas clôturé, les statistiques de
 * conversion ne savent pas s'il a eu lieu. C'est la seule ligne qui appelle une
 * action, elle occupe donc deux colonnes en `text-4xl` — le reste est du
 * contexte en `text-2xl`.
 *
 * « Aujourd'hui » disparaît quand la journée courante sort de la période
 * affichée : afficher « 0 aujourd'hui » en consultant le mois prochain serait
 * un chiffre exact et pourtant trompeur.
 *
 * **Absents et annulés ne sont pas confondus.** Une annulation est un fait
 * neutre — le prospect a prévenu ; une absence est un signal commercial. Seule
 * la seconde figure ici, la première n'appelant rien.
 */
export function AgendaSummary({ resume }: { resume: ResumeAgenda }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatTile
        className="lg:col-span-2"
        taille="lg"
        label="À clôturer"
        valeur={resume.aCloturer}
        icon={CalendarClock}
        accent={resume.aCloturer > 0 ? "warning" : undefined}
        detail={
          resume.aCloturer > 0
            ? "Rendez-vous passés encore marqués « planifié ». Tant qu'ils le restent, les taux de conversion les ignorent."
            : "Aucun rendez-vous passé en attente de statut."
        }
      />

      {resume.contientCeJour ? (
        <StatTile
          label="Aujourd'hui"
          valeur={resume.aujourdhui}
          icon={CalendarCheck}
        />
      ) : null}

      <StatTile label="À venir" valeur={resume.aVenir} icon={CalendarClock} />

      <StatTile
        label="Réalisés"
        valeur={resume.realises}
        icon={CircleCheck}
        accent={resume.realises > 0 ? "success" : undefined}
      />

      {/* N'apparaît que s'il y a matière : une tuile à zéro en permanence
          occupe une colonne pour ne rien dire, et fait perdre à la rangée la
          place que « Aujourd'hui » y prend le reste du temps. */}
      {resume.absents > 0 ? (
        <StatTile label="Absents" valeur={resume.absents} icon={UserX} />
      ) : null}
    </div>
  );
}

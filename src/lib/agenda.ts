import { cleJour } from "@/lib/format";
import type { Appointment } from "@/lib/types";

/**
 * Lecture de l'agenda.
 *
 * Comme pour la qualification, et à la différence de la liste des prospects,
 * le calcul se fait côté front : `GET /appointments` renvoie l'intégralité des
 * rendez-vous de la période demandée, sans pagination. Il n'y a donc aucun
 * écart possible entre ce que le front voit et ce qui existe sur la période.
 */

export interface ResumeAgenda {
  total: number;
  /**
   * Rendez-vous planifiés dont l'heure est passée.
   *
   * Le seul compte qui appelle une action : tant qu'ils ne sont pas clôturés,
   * ils faussent les statistiques de conversion, qui distinguent un
   * rendez-vous réalisé d'un rendez-vous manqué. L'API le calcule elle-même
   * (`is_overdue`) — le rejouer ici en comparant des dates dupliquerait une
   * règle métier hors de son unique point de vérité.
   */
  aCloturer: number;
  aujourdhui: number;
  aVenir: number;
  realises: number;
  /** Absences non prévenues : signal commercial, distinct d'une annulation. */
  absents: number;
  /** `true` si la journée courante tombe dans la période affichée. */
  contientCeJour: boolean;
}

export function resumeAgenda(
  rendezVous: Appointment[],
  { fuseau, ceJour }: { fuseau?: string; ceJour: string },
): ResumeAgenda {
  let aCloturer = 0;
  let aujourdhui = 0;
  let aVenir = 0;
  let realises = 0;
  let absents = 0;
  let contientCeJour = false;

  const maintenant = Date.now();

  for (const rdv of rendezVous) {
    const jour = cleJour(rdv.scheduled_at, { timeZone: fuseau });

    if (jour === ceJour) {
      contientCeJour = true;
      aujourdhui += 1;
    }

    if (rdv.is_overdue) {
      aCloturer += 1;
    } else if (
      rdv.status === "planned" &&
      new Date(rdv.scheduled_at).getTime() > maintenant
    ) {
      aVenir += 1;
    }

    if (rdv.status === "completed") realises += 1;
    if (rdv.status === "no_show") absents += 1;
  }

  return {
    total: rendezVous.length,
    aCloturer,
    aujourdhui,
    aVenir,
    realises,
    absents,
    contientCeJour,
  };
}

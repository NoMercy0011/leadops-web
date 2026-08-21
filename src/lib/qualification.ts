import type { ProspectAnswer, Question } from "@/lib/types";

/**
 * Lecture de l'état de qualification d'un prospect.
 *
 * Fonctions pures, volontairement hors de `lib/questionnaire.ts` qui est
 * `server-only` : le formulaire de qualification est un composant client et
 * recalcule ces compteurs à chaque frappe, sans aller-retour réseau.
 *
 * **Pourquoi pas un bloc `summary` côté API, comme pour la liste des
 * prospects.** Le cas est différent : `GET /prospects/{id}/questionnaire`
 * renvoie l'intégralité des questions et des réponses — il n'y a pas de
 * pagination, donc pas d'écart possible entre ce que le front voit et ce qui
 * existe. Le calculer ici est exact, et suit l'état du formulaire en cours de
 * saisie, ce qu'un compteur serveur ne saurait pas faire.
 */

/**
 * Une valeur compte comme réponse si elle porte une information.
 *
 * Les trois cas particuliers sont ceux qui font qu'une comparaison naïve à
 * `null` se trompe :
 *
 * - `false` est une réponse pour une case à cocher ou un oui/non — « non »
 *   qualifie autant que « oui ». Un `if (!valeur)` l'écarterait à tort.
 * - `0` est une réponse pour un champ nombre, pour la même raison.
 * - un tableau vide n'en est pas une : c'est un choix multiple où rien n'a
 *   été coché.
 */
export function estRenseignee(
  valeur: string | number | boolean | string[] | null | undefined,
): boolean {
  if (valeur === null || valeur === undefined) {
    return false;
  }

  if (Array.isArray(valeur)) {
    return valeur.length > 0;
  }

  if (typeof valeur === "string") {
    return valeur.trim() !== "";
  }

  return true;
}

export interface EtatQualification {
  /** Questions actives du questionnaire. */
  total: number;
  repondues: number;
  /** Obligatoires restant sans réponse — le seul compte qui appelle une action. */
  obligatoiresManquantes: number;
  /** 0 à 100. `null` si le questionnaire est vide : il n'y a rien à mesurer. */
  progression: number | null;
  complete: boolean;
}

/**
 * État de qualification, à partir d'un jeu de valeurs courant.
 *
 * `valeurs` est indexé par identifiant de question — c'est la forme que tient
 * le formulaire pendant la saisie, ce qui permet à la barre de progression de
 * bouger sous les doigts plutôt qu'au seul enregistrement.
 */
export function etatQualification(
  questions: Question[],
  valeurs: Record<number, string | number | boolean | string[] | null>,
): EtatQualification {
  const total = questions.length;

  if (total === 0) {
    return {
      total: 0,
      repondues: 0,
      obligatoiresManquantes: 0,
      // Un questionnaire vide n'est pas « 0 % qualifié » : il n'y a rien à
      // remplir, et afficher zéro laisserait croire à un retard.
      progression: null,
      complete: true,
    };
  }

  let repondues = 0;
  let obligatoiresManquantes = 0;

  for (const question of questions) {
    const renseignee = estRenseignee(valeurs[question.id]);

    if (renseignee) {
      repondues += 1;
    } else if (question.required) {
      obligatoiresManquantes += 1;
    }
  }

  return {
    total,
    repondues,
    obligatoiresManquantes,
    progression: Math.round((repondues / total) * 100),
    // « Complet » se juge sur les obligatoires, pas sur le total : un
    // questionnaire dont toutes les questions facultatives sont vides est
    // néanmoins correctement qualifié.
    complete: obligatoiresManquantes === 0,
  };
}

/** Valeurs initiales du formulaire, à partir des réponses enregistrées. */
export function valeursInitiales(
  questions: Question[],
  answers: ProspectAnswer[],
): Record<number, string | number | boolean | string[] | null> {
  return Object.fromEntries(
    questions.map((question) => {
      const reponse = answers.find((a) => a.question_id === question.id);

      // Un choix multiple sans réponse doit démarrer sur un tableau vide et
      // non sur `null` : les cases à cocher itèrent dessus.
      const defaut = question.multi_value ? [] : null;

      return [question.id, reponse?.value ?? defaut];
    }),
  );
}

export interface ResumeQuestionnaire {
  total: number;
  obligatoires: number;
  avecReponses: number;
  aOptions: number;
}

/**
 * Résumé du questionnaire côté constructeur.
 *
 * `avecReponses` est le compte qui pèse le plus lourd : ces questions ont leur
 * type verrouillé et leur suppression ne sera que douce, parce que détruire
 * leurs réponses détruirait l'historique de qualification, donc les
 * statistiques passées.
 */
export function resumeQuestionnaire(questions: Question[]): ResumeQuestionnaire {
  return {
    total: questions.length,
    obligatoires: questions.filter((q) => q.required).length,
    avecReponses: questions.filter((q) => q.has_answers).length,
    aOptions: questions.filter((q) => (q.options?.length ?? 0) > 0).length,
  };
}

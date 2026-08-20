/**
 * Point de formatage unique — le pendant front de `resolveTimezone()` côté API.
 *
 * L'API stocke et renvoie tout en UTC (décision §10.5 du plan d'action) ; la
 * conversion se fait à la seule frontière de présentation, c'est-à-dire ici.
 * Aucun composant ne doit appeler `toLocaleDateString`, `Intl.DateTimeFormat`
 * ni construire un `new Date(...).getHours()` de son côté.
 *
 * La raison est la même que pour les coutures du §3.8 : le jour où le fuseau
 * passera de l'entreprise à l'utilisateur, la migration touchera ce fichier et
 * rien d'autre — pas chaque vue calendrier, chaque export et chaque rapport.
 *
 * Ce module n'est volontairement pas `server-only` : les vues interactives du
 * kanban et du calendrier en auront besoin côté client, et un second module de
 * formatage pour le client recréerait exactement la divergence qu'on évite.
 */

/** Repli quand l'entreprise n'est pas connue — le Super Admin n'en a pas. */
const FUSEAU_PAR_DEFAUT = "Indian/Antananarivo";

const LOCALE = "fr-FR";

/**
 * Espace fine insécable avant les ponctuations doubles, comme l'exige la
 * typographie française. Sans elle, « Projets : 12 » peut se couper entre le
 * mot et son deux-points en fin de ligne.
 *
 * S'emploie sur les libellés composés, pas sur les chaînes littérales du code,
 * où le caractère se saisit directement.
 */
export function nbsp(texte: string): string {
  return texte.replace(/ ([:;!?»])/g, " $1").replace(/« /g, "« ");
}

interface OptionsDate {
  /** Fuseau de l'entreprise, tel que renvoyé par l'API. */
  timeZone?: string | null;
}

function formatter(
  options: Intl.DateTimeFormatOptions,
  timeZone?: string | null,
): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat(LOCALE, {
    ...options,
    timeZone: timeZone ?? FUSEAU_PAR_DEFAUT,
  });
}

/**
 * Analyse une date ISO renvoyée par l'API.
 *
 * Renvoie `null` plutôt que `Invalid Date` : une date invalide qui se propage
 * jusqu'au rendu s'affiche « Invalid Date » à l'utilisateur, ce qui est pire
 * qu'un tiret. L'appelant décide de son repli.
 */
function analyser(valeur: string | null | undefined): Date | null {
  if (!valeur) {
    return null;
  }

  const date = new Date(valeur);

  return Number.isNaN(date.getTime()) ? null : date;
}

/** 19 août 2026 */
export function formatDate(
  valeur: string | null | undefined,
  { timeZone }: OptionsDate = {},
): string {
  const date = analyser(valeur);

  if (!date) {
    return "—";
  }

  return formatter(
    { day: "numeric", month: "long", year: "numeric" },
    timeZone,
  ).format(date);
}

/** 19/08/2026 — pour les tableaux denses, où le mois en toutes lettres tasse. */
export function formatDateCourte(
  valeur: string | null | undefined,
  { timeZone }: OptionsDate = {},
): string {
  const date = analyser(valeur);

  if (!date) {
    return "—";
  }

  return formatter(
    { day: "2-digit", month: "2-digit", year: "numeric" },
    timeZone,
  ).format(date);
}

/** 19 août 2026 à 14:30 */
export function formatDateHeure(
  valeur: string | null | undefined,
  { timeZone }: OptionsDate = {},
): string {
  const date = analyser(valeur);

  if (!date) {
    return "—";
  }

  return formatter(
    {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
    timeZone,
  ).format(date);
}

/**
 * « dans 3 mois », « il y a 2 jours ».
 *
 * Sert aux échéances d'abonnement et à la colonne « dernière interaction », où
 * la distance compte plus que la date exacte. La date exacte reste accessible
 * en infobulle — le relatif seul empêcherait de comparer deux lignes.
 */
export function formatDistance(valeur: string | null | undefined): string {
  const date = analyser(valeur);

  if (!date) {
    return "—";
  }

  const secondes = (date.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto" });

  const paliers: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 60 * 60 * 24 * 365],
    ["month", 60 * 60 * 24 * 30],
    ["week", 60 * 60 * 24 * 7],
    ["day", 60 * 60 * 24],
    ["hour", 60 * 60],
    ["minute", 60],
  ];

  for (const [unite, taille] of paliers) {
    if (Math.abs(secondes) >= taille) {
      return rtf.format(Math.round(secondes / taille), unite);
    }
  }

  return rtf.format(Math.round(secondes), "second");
}

/** 10 000 — espace insécable comme séparateur, norme française. */
export function formatNombre(valeur: number | null | undefined): string {
  if (valeur === null || valeur === undefined) {
    return "—";
  }

  return new Intl.NumberFormat(LOCALE).format(valeur);
}

/**
 * Plafond de plan. `null` signifie « illimité » côté API (plan Enterprise) et
 * doit se lire comme tel, jamais comme un zéro ou un tiret.
 */
export function formatQuota(valeur: number | null | undefined): string {
  return valeur === null || valeur === undefined
    ? "Illimité"
    : formatNombre(valeur);
}

/** 14:30 — heure seule, pour les créneaux du calendrier. */
export function formatHeure(
  valeur: string | null | undefined,
  { timeZone }: OptionsDate = {},
): string {
  const date = analyser(valeur);

  if (!date) {
    return "—";
  }

  return formatter({ hour: "2-digit", minute: "2-digit" }, timeZone).format(date);
}

/**
 * Clé de regroupement par journée **locale** : « 2026-08-20 ».
 *
 * C'est le pendant front de `TimezoneResolver::dayBounds`. Un
 * `date.toISOString().slice(0, 10)` donnerait la journée UTC : pour une
 * entreprise à +03, un rendez-vous à 01h00 locale serait rangé la veille et
 * disparaîtrait de sa colonne. L'erreur ne lève rien — la case est simplement
 * vide.
 *
 * `en-CA` produit nativement le format ISO, ce qui évite de recomposer la
 * chaîne à partir des parties.
 */
export function cleJour(
  valeur: string | Date | null | undefined,
  { timeZone }: OptionsDate = {},
): string {
  const date = valeur instanceof Date ? valeur : analyser(valeur);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: timeZone ?? FUSEAU_PAR_DEFAUT,
  }).format(date);
}

/** Journée locale courante, au même format que `cleJour`. */
export function aujourdhui({ timeZone }: OptionsDate = {}): string {
  return cleJour(new Date(), { timeZone });
}

/** Initiales pour un avatar sans photo : « Andry Nantenaina » → « AN ». */
export function initiales(nom: string): string {
  return nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((mot) => mot[0]?.toUpperCase() ?? "")
    .join("");
}

/** Prénom seul, pour les salutations. */
export function prenom(nom: string): string {
  return nom.split(/\s+/)[0] ?? nom;
}

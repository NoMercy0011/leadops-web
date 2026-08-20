/**
 * Fuseaux horaires et pays, pour les champs qui ne peuvent pas rester libres.
 *
 * Le fuseau de l'entreprise gouverne l'affichage de **toutes** les dates du
 * produit — calendrier, échéances d'abonnement, journal d'activités. Le
 * saisir dans un champ texte, comme le faisait la création d'entreprise du
 * lot 2, c'est accepter qu'une faute de frappe (« Indian/Antanarivo ») décale
 * silencieusement tous les rendez-vous d'un client. Laravel rejetterait la
 * valeur, mais l'utilisateur n'a aucun moyen de deviner l'orthographe exacte
 * d'un identifiant IANA.
 *
 * Même raisonnement pour l'indicatif pays : il sert à normaliser les numéros
 * de téléphone en E.164 (décision §10.1), donc à la détection de doublons. Un
 * code erroné ne fait pas échouer l'import — il produit des doublons
 * silencieux, ce qui est pire.
 */

/**
 * Fuseaux proposés en tête de liste.
 *
 * Le produit est développé et exploité depuis Madagascar ; les entreprises
 * clientes suivantes seront vraisemblablement dans l'océan Indien ou en
 * Europe francophone. La liste complète reste accessible en dessous.
 */
const FUSEAUX_FREQUENTS = [
  "Indian/Antananarivo",
  "Indian/Mauritius",
  "Indian/Reunion",
  "Africa/Nairobi",
  "Europe/Paris",
  "Europe/Brussels",
  "UTC",
];

/**
 * Repli si le moteur JavaScript ne connaît pas `Intl.supportedValuesOf`.
 * Disponible partout depuis 2022, mais un repli vaut mieux qu'un champ vide.
 */
const FUSEAUX_REPLI = [
  ...FUSEAUX_FREQUENTS,
  "Africa/Abidjan",
  "Africa/Casablanca",
  "Africa/Dakar",
  "Africa/Johannesburg",
  "America/Montreal",
  "America/New_York",
  "Asia/Dubai",
  "Europe/London",
];

export interface GroupeOptions {
  label: string;
  options: { value: string; label: string }[];
}

/**
 * Fuseaux groupés par région, précédés des plus probables.
 *
 * Le regroupement compte : une liste plate de quatre cents entrées est
 * impraticable, alors que les `<optgroup>` d'un select natif restent
 * parcourables au clavier.
 */
export function fuseauxHoraires(): GroupeOptions[] {
  const tous =
    typeof Intl.supportedValuesOf === "function"
      ? Intl.supportedValuesOf("timeZone")
      : FUSEAUX_REPLI;

  const parRegion = new Map<string, { value: string; label: string }[]>();

  for (const zone of tous) {
    if (FUSEAUX_FREQUENTS.includes(zone)) {
      continue;
    }

    const [region, ...reste] = zone.split("/");

    // « UTC », « GMT » et consorts n'ont pas de région : ils rejoignent les
    // fréquents plutôt que de créer un groupe d'un seul élément.
    if (reste.length === 0) {
      continue;
    }

    const liste = parRegion.get(region) ?? [];
    liste.push({ value: zone, label: reste.join(" / ").replace(/_/g, " ") });
    parRegion.set(region, liste);
  }

  const groupes: GroupeOptions[] = [
    {
      label: "Fréquents",
      options: FUSEAUX_FREQUENTS.map((zone) => ({
        value: zone,
        label: zone.replace(/_/g, " "),
      })),
    },
  ];

  for (const [region, options] of [...parRegion.entries()].sort()) {
    groupes.push({
      label: region.replace(/_/g, " "),
      options: options.sort((a, b) => a.label.localeCompare(b.label, "fr")),
    });
  }

  return groupes;
}

/**
 * Codes ISO 3166-1 alpha-2 proposés à la création d'une entreprise.
 *
 * Liste volontairement resserrée plutôt qu'exhaustive : les 249 codes de la
 * norme noieraient les quelques-uns réellement utiles, et un pays manquant
 * s'ajoute ici en une ligne. Couvre l'océan Indien, l'Afrique francophone,
 * l'Europe et l'Amérique du Nord.
 */
const CODES_PAYS = [
  "MG", "MU", "RE", "KM", "YT", "SC",
  "BE", "CA", "CH", "FR", "LU", "MC",
  "BJ", "BF", "CD", "CG", "CI", "CM", "DJ", "DZ", "GA", "GN",
  "MA", "ML", "NE", "SN", "TD", "TG", "TN",
  "KE", "NG", "TZ", "UG", "ZA",
  "DE", "ES", "GB", "IT", "NL", "PT",
  "AE", "CN", "IN", "US",
];

/**
 * Pays triés par nom français, Madagascar en tête.
 *
 * Les libellés viennent d'`Intl.DisplayNames` plutôt que d'une table écrite à
 * la main : c'est le navigateur qui connaît les noms officiels, et une table
 * figée vieillit.
 */
export function paysDisponibles(): { value: string; label: string }[] {
  const noms =
    typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames(["fr"], { type: "region" })
      : null;

  return CODES_PAYS.map((code) => ({
    value: code,
    label: `${noms?.of(code) ?? code} (${code})`,
  })).sort((a, b) => {
    if (a.value === "MG") return -1;
    if (b.value === "MG") return 1;

    return a.label.localeCompare(b.label, "fr");
  });
}

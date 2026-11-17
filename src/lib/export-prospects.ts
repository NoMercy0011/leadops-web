/**
 * Lien d'export CSV des prospects — revue du lot 9, faille F17.
 *
 * L'export doit renvoyer ce que l'écran montre : la vue (actifs ou archivés)
 * et tous les filtres de la liste. La liste globale ne transmettait que le
 * projet, l'onglet Prospects que le projet et la vue. Le lien se construit
 * désormais ici, avec la même liste blanche que le relais
 * `src/app/api/prospects/export/route.ts` et que le contrat (§10).
 *
 * Module pur : il ne lit que des paramètres d'URL.
 */
export const FILTRES_EXPORT = [
  "project_id",
  "archived",
  "stage_id",
  "assigned_user_id",
  "search",
] as const;

export function lienExportProspects(
  filtres: Record<string, string | string[] | undefined>,
  fixes: Partial<Record<(typeof FILTRES_EXPORT)[number], string>> = {},
): string {
  const parametres = new URLSearchParams();

  for (const cle of FILTRES_EXPORT) {
    const valeur = fixes[cle] ?? filtres[cle];

    if (typeof valeur === "string" && valeur !== "") {
      parametres.set(cle, valeur);
    }
  }

  return parametres.size > 0
    ? `/api/prospects/export?${parametres.toString()}`
    : "/api/prospects/export";
}

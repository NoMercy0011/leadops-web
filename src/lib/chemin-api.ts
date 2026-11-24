/**
 * Garde des chemins envoyés à l'API — lot 9, faille F14.
 *
 * Les Server Actions reçoivent leurs identifiants du navigateur, et les types
 * TypeScript disparaissent à l'exécution : un `prospectId` peut arriver sous
 * la forme `"1/../../users"`. Interpolé dans `/prospects/${prospectId}`, il
 * atteignait une autre route, avec le jeton de l'utilisateur. Laravel
 * continuait d'autoriser chaque route, mais l'action n'était plus une
 * frontière.
 *
 * Plutôt que de valider l'identifiant dans chacune des trente actions, la
 * règle vit ici, et `apiFetch` l'applique à tout appel : un chemin ne contient
 * que des segments faits de lettres, chiffres, tirets et soulignés — jamais
 * `.`, `..`, un segment vide ni un caractère encodé. La chaîne de requête,
 * après `?`, n'est pas concernée : elle ne change pas de route.
 *
 * Module pur, sans `server-only`, pour pouvoir être testé seul.
 */
const SEGMENT = /^[A-Za-z0-9_-]+$/;

export function cheminApiSur(path: string): boolean {
  const [chemin] = path.split("?", 1);

  if (!chemin.startsWith("/")) {
    return false;
  }

  return chemin
    .slice(1)
    .split("/")
    .every((segment) => SEGMENT.test(segment));
}

/**
 * Identifiant acceptable dans un chemin d'API : un entier strictement positif,
 * et rien d'autre (revue du lot 9). `cheminApiSur` laisse passer `5?`, qui
 * détourne l'appel vers une autre route de même rang : la règle se pose donc
 * sur chaque identifiant, avant qu'il n'entre dans le chemin.
 */
export function estIdentifiantApi(valeur: unknown): valeur is number {
  return typeof valeur === "number" && Number.isInteger(valeur) && valeur > 0;
}

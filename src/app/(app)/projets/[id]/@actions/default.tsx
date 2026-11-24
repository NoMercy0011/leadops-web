/**
 * Aucune action propre à la section — rendu au chargement direct d'une URL.
 *
 * Une route parallèle réclame un `default` : sans lui, les sections qui ne
 * remplissent pas l'emplacement provoquent une 404 au premier rendu direct de
 * l'URL. Il ne suffit pourtant pas : en navigation côté client, Next garde le
 * dernier contenu d'un emplacement sans page correspondante, et les actions
 * de l'onglet Prospects restaient affichées sur les autres onglets (lot 9,
 * faille F12). D'où `page.tsx`, `rendez-vous/page.tsx` et `reglages/page.tsx`,
 * qui rendent ce même vide sur les onglets sans action. Pas d'attrape-tout :
 * il rendait valide toute adresse sous la fiche (écart E-L9-3).
 */
export default function AucuneAction() {
  return null;
}

/**
 * Onglet sans action propre (planche du lot 9, S-01) : une page vide plutôt
 * que rien. En navigation côté client, un emplacement sans page
 * correspondante garde son dernier contenu, et les actions de l'onglet
 * Prospects restaient affichées ici (faille F12).
 *
 * Une page par onglet, et non un attrape-tout : l'attrape-tout rendait
 * valide toute adresse sous la fiche, et un onglet inexistant affichait
 * l'en-tête du projet au lieu d'une 404 (écart E-L9-3).
 */
export default function AucuneAction() {
  return null;
}

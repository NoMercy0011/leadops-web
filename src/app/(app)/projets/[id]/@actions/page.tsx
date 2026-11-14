/**
 * Onglet Tableau de bord : aucune action propre (planche du lot 9, S-01).
 *
 * Une page, et pas seulement le `default` : en navigation côté client, un
 * emplacement sans page correspondante garde son dernier contenu. Sans elle,
 * revenir au tableau de bord depuis l'onglet Prospects y laissait Kanban,
 * Exporter et Nouveau prospect (faille F12).
 */
export default function ActionsDuTableauDeBord() {
  return null;
}

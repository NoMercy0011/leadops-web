/**
 * Aucune action propre à la section.
 *
 * Une route parallèle réclame un `default` : sans lui, les sections qui ne
 * remplissent pas l'emplacement provoquent une 404 au premier rendu direct de
 * l'URL. C'est le cas du tableau de bord, de l'agenda, de l'abonnement et du
 * back office, dont les commandes vivent à l'intérieur de leurs propres
 * cartes.
 */
export default function AucuneAction() {
  return null;
}

/**
 * Onglets Rendez-vous, Réglages et tout onglet futur : aucune action propre
 * (planche du lot 9, S-01).
 *
 * Attrape-tout plutôt qu'une page par onglet : un onglet ajouté demain
 * n'hériterait pas, sans elle, des actions de l'onglet précédent (faille F12).
 * `@actions/prospects/page.tsx`, plus précis, garde la priorité sur l'onglet
 * Prospects.
 */
export default function AucuneActionDeSection() {
  return null;
}

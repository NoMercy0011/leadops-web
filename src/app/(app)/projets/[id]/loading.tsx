import { Skeleton } from "@/components/ui/skeleton";

/**
 * Chargement d'un onglet de la fiche projet (lot 9, faille F16).
 *
 * Placé sous `projets/[id]`, il ne remplace que le contenu de l'onglet :
 * l'en-tête du projet et ses onglets, rendus par le layout, restent en place.
 * Sans lui, changer d'onglet figeait l'écran précédent le temps des requêtes,
 * sans aucun retour visuel.
 */
export default function ChargementOngletProjet() {
  return (
    <div className="space-y-6" aria-busy aria-label="Chargement de l'onglet">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}

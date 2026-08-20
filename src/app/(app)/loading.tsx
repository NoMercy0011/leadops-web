import { Skeleton } from "@/components/ui/skeleton";

/**
 * État de chargement de l'espace authentifié.
 *
 * Chaque page fait au moins un aller-retour vers l'API depuis le serveur ; sans
 * ce fichier, Next affiche l'écran précédent figé pendant ce temps et
 * l'utilisateur croit son clic perdu.
 *
 * Le squelette reprend la silhouette de l'écran qui arrive — titre, description,
 * rangée de cartes — plutôt qu'un rond qui tourne. La page semble alors se
 * remplir au lieu d'apparaître d'un bloc, et l'œil n'a pas à se repositionner.
 */
export default function Loading() {
  return (
    <div className="space-y-6" aria-busy aria-label="Chargement en cours">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Skeleton key={index} className="h-36 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

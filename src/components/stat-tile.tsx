import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatNombre } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Tuile d'indicateur.
 *
 * Un nombre unique se lit mieux qu'un graphique : dessiner une jauge pour
 * « 48 prospects » ajouterait de l'encre sans ajouter d'information. Les
 * graphiques sont réservés aux répartitions, où la comparaison visuelle
 * apporte vraiment quelque chose.
 *
 * `valeur` accepte `null` pour les taux : « aucun prospect » n'est pas
 * « 0 % de conversion », et afficher zéro laisserait croire à un échec là où
 * il n'y a rien à mesurer.
 *
 * `taille` porte la hiérarchie de lecture. Toutes les tuiles d'un écran à la
 * même taille se valent visuellement, et l'œil doit alors les lire une à une
 * pour trouver celle qui compte. Trois paliers :
 *
 *   lg  la dominante — un seul indicateur par écran, celui qui répond à la
 *       question qu'on se pose en ouvrant la page
 *   md  les mesures qu'on consulte réellement
 *   sm  le contexte : exact, utile, mais qu'on ne vient pas chercher
 *
 * Deux dominantes sur un même écran s'annulent l'une l'autre.
 */
export function StatTile({
  label,
  valeur,
  suffixe,
  detail,
  icon: Icone,
  accent,
  taille = "md",
  href,
  className,
}: {
  label: string;
  valeur: number | null;
  suffixe?: string;
  detail?: string;
  icon?: LucideIcon;
  /** Met la valeur en évidence — réservé aux états qui appellent une action. */
  accent?: "warning" | "success";
  /** Poids visuel. Une seule tuile `lg` par écran. */
  taille?: "sm" | "md" | "lg";
  /** Rend la tuile cliquable, vers la liste filtrée sur ce qu'elle compte. */
  href?: string;
  className?: string;
}) {
  const vide = valeur === null;

  const contenu = (
    <CardContent
      className={cn(
        "space-y-1",
        taille === "lg" && "p-5",
        taille === "md" && "p-4",
        taille === "sm" && "space-y-0.5 p-3",
      )}
    >
      <p
        className={cn(
          "text-muted-foreground flex items-center gap-1.5 font-medium",
          taille === "lg" ? "text-sm" : "text-xs",
        )}
      >
        {Icone ? (
          <Icone
            className={taille === "lg" ? "size-4" : "size-3.5"}
            aria-hidden
          />
        ) : null}
        {label}
      </p>

      <p
        className={cn(
          "font-heading font-semibold tabular-nums",
          taille === "lg" && "text-4xl",
          taille === "md" && "text-2xl",
          taille === "sm" && "text-lg",
          vide && "text-muted-foreground",
          accent === "warning" && !vide && "text-warning-subtle-foreground",
          accent === "success" && !vide && "text-success-subtle-foreground",
        )}
      >
        {vide ? "—" : formatNombre(valeur)}
        {!vide && suffixe ? (
          <span
            className={cn(
              "text-muted-foreground ml-1 font-normal",
              taille === "lg" && "text-lg",
              taille === "md" && "text-base",
              taille === "sm" && "text-sm",
            )}
          >
            {suffixe}
          </span>
        ) : null}
      </p>

      {detail ? (
        <p className="text-muted-foreground text-xs leading-relaxed">{detail}</p>
      ) : null}
    </CardContent>
  );

  if (!href) {
    return <Card className={className}>{contenu}</Card>;
  }

  return (
    <Card
      className={cn(
        "hover:border-ring hover:shadow-raised duration-(--duration-base) ease-brand transition-[color,background-color,border-color,box-shadow]",
        className,
      )}
    >
      <Link
        href={href}
        className="focus-visible:ring-ring/50 block rounded-xl focus-visible:ring-3 focus-visible:outline-none"
      >
        {contenu}
      </Link>
    </Card>
  );
}

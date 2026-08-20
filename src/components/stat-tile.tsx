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
 */
export function StatTile({
  label,
  valeur,
  suffixe,
  detail,
  icon: Icone,
  accent,
  className,
}: {
  label: string;
  valeur: number | null;
  suffixe?: string;
  detail?: string;
  icon?: LucideIcon;
  /** Met la valeur en évidence — réservé aux états qui appellent une action. */
  accent?: "warning" | "success";
  className?: string;
}) {
  const vide = valeur === null;

  return (
    <Card className={className}>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
          {Icone ? <Icone className="size-3.5" aria-hidden /> : null}
          {label}
        </p>

        <p
          className={cn(
            "font-heading text-2xl font-semibold tabular-nums",
            vide && "text-muted-foreground",
            accent === "warning" && !vide && "text-warning-subtle-foreground",
            accent === "success" && !vide && "text-success-subtle-foreground",
          )}
        >
          {vide ? "—" : formatNombre(valeur)}
          {!vide && suffixe ? (
            <span className="text-muted-foreground ml-1 text-base font-normal">
              {suffixe}
            </span>
          ) : null}
        </p>

        {detail ? (
          <p className="text-muted-foreground text-xs">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

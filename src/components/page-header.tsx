import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * En-tête de page : titre, description, actions.
 *
 * Tous les écrans du produit ouvrent de la même façon. Le figer ici évite que
 * la taille du titre, l'espacement sous la description et la position des
 * boutons dérivent d'un écran à l'autre — une dérive invisible écran par écran
 * mais très perceptible à l'usage, quand on passe des projets aux prospects.
 *
 * `actions` est à droite sur grand écran et repasse sous le titre en dessous
 * de `sm`, plutôt que de rétrécir : un bouton « Nouveau prospect » compressé
 * sur un téléphone devient intouchable.
 */
export function PageHeader({
  titre,
  description,
  actions,
  className,
}: {
  titre: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-balance">
          {titre}
        </h1>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}

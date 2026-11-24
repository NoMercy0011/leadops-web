"use client";

import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

function Progress({
  className,
  value,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      // `value` est réinjecté dans la primitive Radix. Le composant livré par
      // shadcn le déstructure pour calculer la translation de l'indicateur,
      // puis ne le transmet pas : Radix voit donc `undefined`, marque la barre
      // `data-state="indeterminate"` et n'émet aucun `aria-valuenow`. La barre
      // se remplissait correctement à l'œil, mais une synthèse vocale
      // annonçait une progression indéterminée — sur les jauges de
      // consommation du back-office comme sur la qualification.
      //
      // À reporter si un `shadcn add progress` réécrit ce fichier.
      value={value}
      className={cn(
        // Hauteur portée à 12px (`h-3`), pour que toutes les barres du produit
        // s'accordent : jauges de consommation, qualification, répartition par
        // étape, santé du pipeline, comparaison par variante. Le composant
        // livré est à `h-1`.
        //
        // À reporter, comme le `value` ci-dessus, si un `shadcn add progress`
        // réécrit ce fichier.
        "relative flex h-3 w-full items-center overflow-x-hidden rounded-full bg-muted",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="size-full flex-1 bg-primary transition-all"
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };

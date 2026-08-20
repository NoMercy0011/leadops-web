import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Écran vide.
 *
 * C'est le premier écran que voit tout nouvel utilisateur du produit : un
 * projet fraîchement créé n'a aucun prospect, un questionnaire aucune question,
 * un calendrier aucun rendez-vous. Le traiter comme un cas dégradé — un tableau
 * vide, ou pire, rien du tout — revient à laisser l'utilisateur devant une page
 * blanche au moment précis où il a le plus besoin d'être guidé.
 *
 * D'où la règle : un état vide porte toujours une action. S'il n'y en a pas
 * (l'utilisateur n'a pas le droit de créer), il porte au moins l'explication de
 * ce qui manque et de qui peut le fournir.
 *
 * Le halo de marque est la seule surface d'accueil autorisée par la direction
 * artistique à porter le dégradé — et il ne passe jamais sous du texte, ce que
 * le plan interdit explicitement.
 */
export function EmptyState({
  icon: Icone,
  titre,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  titre: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-card flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed px-6 py-14 text-center",
        className,
      )}
    >
      <div className="relative flex size-14 items-center justify-center">
        <span
          aria-hidden
          className="bg-brand-gradient absolute inset-0 rounded-full opacity-15"
        />
        <Icone className="text-primary relative size-6" aria-hidden />
      </div>

      <div className="space-y-1.5">
        <p className="font-heading text-base font-semibold tracking-tight">
          {titre}
        </p>
        {description ? (
          <p className="text-muted-foreground mx-auto max-w-sm text-sm leading-relaxed text-balance">
            {description}
          </p>
        ) : null}
      </div>

      {action ? <div className="flex items-center gap-2">{action}</div> : null}
    </div>
  );
}

import { Infinity as InfinityIcon } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatNombre } from "@/lib/format";
import type { UsageEntry } from "@/lib/admin";

const LIBELLES: Record<string, string> = {
  users: "Utilisateurs",
  projects: "Projets",
  prospects: "Prospects",
};

/**
 * Jauge de consommation face au plafond du plan.
 *
 * Un plafond `null` n'affiche pas de barre : une jauge suppose un maximum, et
 * en dessiner une pour « illimité » suggérerait une limite qui n'existe pas.
 */
export function UsageMeter({
  resource,
  entry,
}: {
  resource: string;
  entry: UsageEntry;
}) {
  const libelle = LIBELLES[resource] ?? resource;

  if (entry.limit === null) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-sm">
          <span className="font-medium">{libelle}</span>
          <span className="text-muted-foreground flex items-center gap-1">
            {formatNombre(entry.used)} <span aria-hidden>/</span>
            <InfinityIcon className="size-4" aria-label="illimité" />
          </span>
        </div>
        <p className="text-muted-foreground text-xs">Illimité</p>
      </div>
    );
  }

  const pourcentage =
    entry.limit === 0 ? 100 : Math.min(100, (entry.used / entry.limit) * 100);
  const sature = entry.remaining === 0;
  const proche = !sature && pourcentage >= 80;

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{libelle}</span>
        <span
          className={
            sature
              ? "text-destructive font-medium"
              : proche
                ? "text-warning font-medium"
                : "text-muted-foreground"
          }
        >
          {formatNombre(entry.used)} / {formatNombre(entry.limit)}
        </span>
      </div>
      <Progress value={pourcentage} />
      <p className="text-muted-foreground text-xs">
        {sature
          ? "Plafond atteint — toute création sera refusée."
          : `${formatNombre(entry.remaining)} restant${(entry.remaining ?? 0) > 1 ? "s" : ""}`}
      </p>
    </div>
  );
}

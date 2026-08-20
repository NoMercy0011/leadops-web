import { Flag, Trophy } from "lucide-react";

import { cn } from "@/lib/utils";
import type { PipelineStage, StageColor } from "@/lib/types";

/**
 * Rendu d'une étape de pipeline.
 *
 * Le jeu de couleurs est volontairement restreint et défini ici, pas en base :
 * l'API transmet un *nom* de teinte, la charte décide de son apparence. Un
 * sélecteur libre côté client produirait des pipelines criards et des teintes
 * qui échouent au contraste sur l'un des deux thèmes.
 *
 * Aucune de ces classes ne dépend du libellé de l'étape — invariant n°2. Les
 * icônes terminales sont pilotées par `is_won` / `is_lost`, jamais par le nom.
 */
const TEINTES: Record<StageColor, string> = {
  slate: "bg-muted text-muted-foreground",
  blue: "bg-info-subtle text-info-subtle-foreground",
  teal: "bg-accent text-accent-foreground",
  sage: "bg-success-subtle text-success-subtle-foreground",
  amber: "bg-warning-subtle text-warning-subtle-foreground",
  violet: "bg-violet-subtle text-violet-subtle-foreground",
  rose: "bg-rose-subtle text-rose-subtle-foreground",
  red: "bg-destructive-subtle text-destructive-subtle-foreground",
};

export const COULEURS_ETAPE: { value: StageColor; label: string }[] = [
  { value: "slate", label: "Gris" },
  { value: "blue", label: "Bleu" },
  { value: "teal", label: "Teal" },
  { value: "sage", label: "Sauge" },
  { value: "amber", label: "Ocre" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" },
  { value: "red", label: "Rouge" },
];

export function StageChip({
  stage,
  className,
}: {
  stage: Pick<PipelineStage, "name" | "color" | "is_won" | "is_lost">;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        TEINTES[stage.color] ?? TEINTES.slate,
        className,
      )}
    >
      {stage.is_won ? (
        <Trophy className="size-3" aria-label="Étape gagnante" />
      ) : stage.is_lost ? (
        <Flag className="size-3" aria-label="Étape perdue" />
      ) : null}
      {stage.name}
    </span>
  );
}

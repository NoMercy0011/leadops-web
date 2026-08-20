"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ChevronDown, ChevronUp, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { addStage, deleteStage, reorderStages } from "../actions";
import { COULEURS_ETAPE, StageChip } from "@/components/stage-chip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { PipelineStage } from "@/lib/types";

/**
 * Édition du pipeline d'un projet.
 *
 * Le réordonnancement se fait par boutons haut/bas plutôt que par glisser-
 * déposer. C'est délibéré à ce stade : le déplacement au clavier fonctionne
 * sans effort d'accessibilité supplémentaire, et un pipeline compte rarement
 * plus d'une dizaine d'étapes. Le glisser-déposer (dnd-kit est installé) a sa
 * place sur le kanban des prospects au lot 4, où l'on manipule des centaines
 * de cartes.
 *
 * Aucun libellé n'est interprété : la nature terminale d'une étape vient de
 * `is_won` / `is_lost` renvoyés par l'API — invariant n°2.
 */
export function PipelineEditor({
  projectId,
  stages,
  editable,
}: {
  projectId: number;
  stages: PipelineStage[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);

  // L'ordre est appliqué localement avant la réponse du serveur : sans cela,
  // chaque clic sur une flèche attendrait un aller-retour réseau, ce qui rend
  // le réordonnancement pénible dès trois déplacements.
  const [ordreOptimiste, setOrdreOptimiste] = useOptimistic(stages);

  function executer(action: () => Promise<{ message?: string; success?: string }>) {
    startTransition(async () => {
      const resultat = await action();

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  function deplacer(index: number, direction: -1 | 1) {
    const cible = index + direction;

    if (cible < 0 || cible >= ordreOptimiste.length) {
      return;
    }

    const nouvel = [...ordreOptimiste];
    [nouvel[index], nouvel[cible]] = [nouvel[cible], nouvel[index]];

    startTransition(async () => {
      setOrdreOptimiste(nouvel);

      const resultat = await reorderStages(
        projectId,
        nouvel.map((stage) => stage.id),
      );

      if (resultat.message) toast.error(resultat.message);
    });
  }

  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {ordreOptimiste.map((stage, index) => (
          <li
            key={stage.id}
            className="border-border bg-card flex items-center gap-3 rounded-lg border px-3 py-2"
          >
            <span className="text-muted-foreground w-6 shrink-0 text-center text-xs tabular-nums">
              {index + 1}
            </span>

            <StageChip stage={stage} className="min-w-0" />

            <div className="ml-auto flex items-center gap-1">
              {editable ? (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={pending || index === 0}
                    onClick={() => deplacer(index, -1)}
                    aria-label={`Monter ${stage.name}`}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={pending || index === ordreOptimiste.length - 1}
                    onClick={() => deplacer(index, 1)}
                    aria-label={`Descendre ${stage.name}`}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    disabled={pending || ordreOptimiste.length <= 1}
                    onClick={() =>
                      executer(() => deleteStage(projectId, stage.id))
                    }
                    aria-label={`Supprimer ${stage.name}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ol>

      {editable ? (
        ajoutOuvert ? (
          <form
            action={(formData) => {
              setAjoutOuvert(false);
              executer(() => addStage(projectId, formData));
            }}
            className="border-border space-y-3 rounded-lg border border-dashed p-3"
          >
            <div className="space-y-2">
              <Label htmlFor="stage-name">Nom de l&apos;étape</Label>
              <Input
                id="stage-name"
                name="name"
                placeholder="Étude médicale"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage-color">Couleur</Label>
              {/* Jeu restreint : un sélecteur libre produirait des pipelines
                  criards et des teintes illisibles sur l'un des deux thèmes. */}
              <select
                id="stage-color"
                name="color"
                defaultValue="slate"
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                {COULEURS_ETAPE.map((couleur) => (
                  <option key={couleur.value} value={couleur.value}>
                    {couleur.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={pending}>
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Ajouter
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setAjoutOuvert(false)}
              >
                Annuler
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAjoutOuvert(true)}
            disabled={pending}
          >
            <Plus className="size-4" />
            Ajouter une étape
          </Button>
        )
      ) : (
        <p className="text-muted-foreground text-xs">
          Seul un Admin Client modifie le pipeline : il change la signification
          des données déjà saisies par toute l&apos;équipe.
        </p>
      )}
    </div>
  );
}

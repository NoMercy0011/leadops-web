"use client";

import { useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";

import { changeStage } from "../actions";
import { StageChip } from "@/components/stage-chip";
import { formatDistance, formatNombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PipelineStage, Prospect } from "@/lib/types";

/**
 * Vue kanban des prospects d'un projet.
 *
 * **Le glisser-déposer n'est pas le seul moyen de déplacer une carte.** Chacune
 * est aussi un bouton atteignable au clavier : `dnd-kit` expose un capteur
 * clavier qui rend le déplacement possible avec Espace puis les flèches. Un
 * kanban qui n'obéirait qu'à la souris exclurait une partie des utilisateurs
 * d'une tâche centrale du produit — et le pipeline reste de toute façon
 * modifiable depuis la fiche prospect.
 *
 * Les colonnes sont les étapes du projet, dans leur ordre. Aucun libellé n'est
 * interprété : la nature terminale d'une étape vient de `is_won` / `is_lost`
 * renvoyés par l'API — invariant n°2.
 */
export function KanbanBoard({
  stages,
  prospects,
  editable,
}: {
  stages: PipelineStage[];
  prospects: Prospect[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [enCours, setEnCours] = useState<Prospect | null>(null);

  // Le déplacement est appliqué localement avant la réponse du serveur : sans
  // cela, la carte resterait sous le curseur pendant l'aller-retour réseau et
  // le geste paraîtrait sans effet.
  const [cartes, deplacerOptimiste] = useOptimistic(
    prospects,
    (actuelles: Prospect[], maj: { id: number; stage_id: number }) =>
      actuelles.map((carte) =>
        carte.id === maj.id ? { ...carte, stage_id: maj.stage_id } : carte,
      ),
  );

  const capteurs = useSensors(
    // Une tolérance de 6 px évite qu'un simple clic sur le lien de la carte
    // soit interprété comme un début de glissement.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  function auDebut(event: DragStartEvent) {
    setEnCours(cartes.find((c) => c.id === Number(event.active.id)) ?? null);
  }

  function aLaFin(event: DragEndEvent) {
    setEnCours(null);

    const cible = event.over?.id;
    const carteId = Number(event.active.id);

    if (cible === undefined) {
      return;
    }

    const stageId = Number(cible);
    const carte = cartes.find((c) => c.id === carteId);

    // Reposée dans sa propre colonne : rien à enregistrer, et écrire quand
    // même ajouterait une ligne d'historique mensongère.
    if (!carte || carte.stage_id === stageId) {
      return;
    }

    startTransition(async () => {
      deplacerOptimiste({ id: carteId, stage_id: stageId });

      const resultat = await changeStage(carteId, stageId);

      // Un refus de l'API arrive selon les cas en `message` (403, panne) ou en
      // `fieldErrors` (422 — étape d'un autre projet, invariant n°2). Sans les
      // deux, la carte reviendrait à sa place sans un mot d'explication : le
      // geste paraîtrait simplement n'avoir pas « pris ».
      const refus = resultat.message ?? Object.values(resultat.fieldErrors ?? {})[0];

      if (refus) toast.error(refus);
    });
  }

  return (
    <DndContext sensors={capteurs} onDragStart={auDebut} onDragEnd={aLaFin}>
      <div className="flex gap-3 overflow-x-auto pb-3">
        {stages.map((stage) => (
          <Colonne
            key={stage.id}
            stage={stage}
            cartes={cartes.filter((carte) => carte.stage_id === stage.id)}
            editable={editable}
            pending={pending}
          />
        ))}
      </div>

      {/* La carte suit le curseur hors du flux : sans calque, elle serait
          rognée par le débordement horizontal des colonnes. */}
      <DragOverlay>
        {enCours ? <Carte prospect={enCours} editable={false} superposee /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function Colonne({
  stage,
  cartes,
  editable,
  pending,
}: {
  stage: PipelineStage;
  cartes: Prospect[];
  editable: boolean;
  pending: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });

  return (
    <section
      ref={setNodeRef}
      aria-label={`Étape ${stage.name}, ${cartes.length} prospect${cartes.length > 1 ? "s" : ""}`}
      className={cn(
        "bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-xl p-2 transition-colors",
        // Le survol se signale sur la colonne entière : un liseré discret ne
        // se verrait pas sous la carte déplacée.
        isOver && "bg-accent ring-ring ring-2",
      )}
    >
      <header className="flex items-center justify-between gap-2 px-1 pt-1">
        <StageChip stage={stage} />
        <span className="text-muted-foreground text-xs tabular-nums">
          {formatNombre(cartes.length)}
        </span>
      </header>

      <div className="flex flex-col gap-2" data-pending={pending || undefined}>
        {cartes.map((prospect) => (
          <Carte key={prospect.id} prospect={prospect} editable={editable} />
        ))}

        {cartes.length === 0 ? (
          <p className="text-muted-foreground px-1 py-6 text-center text-xs">
            Aucun prospect
          </p>
        ) : null}
      </div>
    </section>
  );
}

function Carte({
  prospect,
  editable,
  superposee = false,
}: {
  prospect: Prospect;
  editable: boolean;
  superposee?: boolean;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: prospect.id,
    disabled: !editable,
  });

  return (
    <article
      ref={setNodeRef}
      className={cn(
        "border-border bg-card space-y-1.5 rounded-lg border p-2.5 text-sm",
        // La carte d'origine s'efface pendant le glissement : c'est le calque
        // qui suit le curseur, et en garder deux visibles brouille le geste.
        isDragging && !superposee && "opacity-30",
        superposee && "shadow-raised rotate-1",
      )}
    >
      <div className="flex items-start gap-1.5">
        {editable ? (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground -ml-1 shrink-0 cursor-grab touch-none rounded p-0.5"
            // Le libellé nomme le prospect : « Déplacer » seul ne dit pas
            // quoi, ce qui est inexploitable à la synthèse vocale.
            aria-label={`Déplacer ${prospect.full_name}`}
            {...listeners}
            {...attributes}
          >
            <GripVertical className="size-4" aria-hidden />
          </button>
        ) : null}

        <Link
          href={`/prospects/${prospect.id}`}
          className="min-w-0 flex-1 truncate font-medium hover:underline"
        >
          {prospect.full_name}
        </Link>
      </div>

      <p className="text-muted-foreground truncate pl-5 text-xs">
        {prospect.company_name ?? prospect.phone ?? prospect.email ?? "—"}
      </p>

      <p className="text-muted-foreground flex items-center justify-between gap-2 pl-5 text-xs">
        <span className="truncate">
          {prospect.assigned_user?.name ?? (
            <span className="italic">Non affecté</span>
          )}
        </span>
        {prospect.last_interaction_at ? (
          <span className="shrink-0">
            {formatDistance(prospect.last_interaction_at)}
          </span>
        ) : null}
      </p>
    </article>
  );
}

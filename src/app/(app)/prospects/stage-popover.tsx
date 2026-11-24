"use client";

import { useState, useTransition } from "react";
import { Check, ChevronDown, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { changeStage } from "./actions";
import { StageChip } from "@/components/stage-chip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { PipelineStage, Prospect } from "@/lib/types";

/**
 * Changement d'étape depuis la liste.
 *
 * **Pourquoi ici et pas seulement sur la fiche.** Faire avancer un prospect
 * est le geste le plus fréquent du métier, et il en enchaîne plusieurs : après
 * une matinée d'appels, on met à jour cinq ou six dossiers d'affilée. Passer
 * par la fiche impose deux navigations par prospect, soit une douzaine
 * d'allers-retours pour une opération qui tient en un clic.
 *
 * **Une liste plutôt qu'une liste déroulante native.** Le sélecteur natif
 * n'affiche que du texte : la pastille de couleur et les marqueurs d'étape
 * terminale — gagné, perdu — disparaîtraient au moment précis où ils comptent
 * le plus, celui où l'on clôt une affaire.
 *
 * **Seulement quand le pipeline est certain.** Le composant réclame les étapes
 * du projet, ce dont seule la liste d'un projet dispose. Dans la liste globale,
 * les prospects appartiennent à des projets aux pipelines différents — proposer
 * un choix commun n'aurait pas de sens, et l'API refuserait une étape venue
 * d'un autre projet. La pastille y reste donc simplement affichée.
 */
export function StagePopover({
  prospect,
  etapes,
}: {
  prospect: Prospect;
  etapes: PipelineStage[];
}) {
  const [ouvert, setOuvert] = useState(false);
  const [pending, demarrer] = useTransition();

  if (!prospect.stage || etapes.length === 0) {
    return prospect.stage ? <StageChip stage={prospect.stage} /> : null;
  }

  function choisir(etape: PipelineStage) {
    if (etape.id === prospect.stage_id) {
      setOuvert(false);
      return;
    }

    demarrer(async () => {
      const resultat = await changeStage(prospect.id, etape.id);

      setOuvert(false);

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  return (
    <Popover open={ouvert} onOpenChange={setOuvert}>
      <PopoverTrigger
        className={cn(
          "duration-(--duration-fast) ease-brand group flex items-center gap-1 rounded-md transition-opacity",
          "focus-visible:ring-ring focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none",
          pending && "opacity-60",
        )}
        disabled={pending}
        aria-label={`Étape de ${prospect.full_name} : ${prospect.stage.name}. Changer.`}
      >
        <StageChip stage={prospect.stage} />
        {pending ? (
          <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
        ) : (
          <ChevronDown
            className="text-muted-foreground group-hover:text-foreground size-3.5 transition-colors"
            aria-hidden
          />
        )}
      </PopoverTrigger>

      <PopoverContent align="start" className="shadow-overlay w-56 p-1">
        <ul>
          {etapes.map((etape) => {
            const courante = etape.id === prospect.stage_id;

            return (
              <li key={etape.id}>
                <button
                  type="button"
                  onClick={() => choisir(etape)}
                  aria-current={courante ? "true" : undefined}
                  className={cn(
                    "hover:bg-accent duration-(--duration-fast) ease-brand flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors",
                    "focus-visible:bg-accent focus-visible:outline-none",
                  )}
                >
                  <StageChip stage={etape} />
                  {/* L'étape courante est marquée d'une coche plutôt que d'être
                      grisée : elle reste lisible, et le repère de position ne
                      disparaît pas quand on parcourt la liste. */}
                  <Check
                    className={cn(
                      "ml-auto size-4 shrink-0",
                      courante ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

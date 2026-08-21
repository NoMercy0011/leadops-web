"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { syncMembers } from "../actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { User } from "@/lib/types";

/**
 * Affectation de l'équipe au projet.
 *
 * L'écran présente une liste à cocher et l'API applique un remplacement
 * complet : ce que l'utilisateur voit est exactement ce qui sera enregistré.
 * Un mode « ajout » obligerait à calculer les retraits côté front, avec le
 * risque d'oubli que cela comporte.
 */
export function TeamEditor({
  projectId,
  candidats,
  membresInitiaux,
  editable,
}: {
  projectId: number;
  candidats: User[];
  membresInitiaux: number[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [selection, setSelection] = useState<number[]>(membresInitiaux);

  const modifie =
    selection.length !== membresInitiaux.length ||
    selection.some((id) => !membresInitiaux.includes(id));

  function basculer(id: number, coche: boolean) {
    setSelection((actuelle) =>
      coche ? [...actuelle, id] : actuelle.filter((x) => x !== id),
    );
  }

  if (candidats.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun utilisateur à affecter. Créez d&apos;abord des comptes
        commerciaux.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="space-y-2">
        {candidats.map((candidat) => (
          <li key={candidat.id} className="flex items-center gap-3">
            <Checkbox
              id={`membre-${candidat.id}`}
              checked={selection.includes(candidat.id)}
              disabled={!editable || pending}
              onCheckedChange={(coche) =>
                basculer(candidat.id, coche === true)
              }
            />
            <Label
              htmlFor={`membre-${candidat.id}`}
              className="flex min-w-0 flex-1 cursor-pointer items-baseline justify-between gap-2 font-normal"
            >
              <span className="truncate">{candidat.name}</span>
              <span className="text-muted-foreground shrink-0 text-xs">
                {candidat.role_label}
              </span>
            </Label>
          </li>
        ))}
      </ul>

      {editable ? (
        <Button
          size="sm"
          disabled={pending || !modifie}
          onClick={() =>
            startTransition(async () => {
              const resultat = await syncMembers(projectId, selection);

              if (resultat.success) toast.success(resultat.success);
              if (resultat.message) toast.error(resultat.message);
            })
          }
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
          Enregistrer l&apos;équipe
        </Button>
      ) : null}
    </div>
  );
}

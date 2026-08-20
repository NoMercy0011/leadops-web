"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createProject, type ActionState } from "./actions";
import { ChampSelect, ChampTexte, ChampZone } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FieldGroup } from "@/components/ui/field";
import type { Variant } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Créer le projet
    </Button>
  );
}

export function CreateProjectDialog({ variantes }: { variantes: Variant[] }) {
  const [open, setOpen] = useState(false);

  // Le retour est traité dans le corps de l'action et non dans un `useEffect` :
  // React 19 refuse un `setState` synchrone dans un effet, et l'action est de
  // toute façon un contexte d'événement, pas de synchronisation.
  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await createProject(prev, formData);

      if (resultat.success) {
        toast.success(resultat.success);
        setOpen(false);
      }
      if (resultat.message) {
        toast.error(resultat.message);
      }

      return resultat;
    },
    INITIAL,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" />
          Nouveau projet
        </Button>
      </DialogTrigger>

      <DialogContent className="shadow-dialog sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Un pipeline par défaut est créé avec le projet. Il est ensuite
              entièrement modifiable, étape par étape.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <ChampTexte
              id="name"
              label="Nom du projet"
              placeholder="Assurance Santé"
              required
              autoFocus
              erreur={state.fieldErrors?.name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="product"
                label="Produit"
                placeholder="Assurance Santé Premium"
                optionnel
                erreur={state.fieldErrors?.product}
              />
              <ChampTexte
                id="target"
                label="Cible"
                placeholder="Particuliers"
                optionnel
                erreur={state.fieldErrors?.target}
              />
            </div>

            <ChampSelect
              id="variant_id"
              label="Variante"
              defaultValue=""
              optionnel
              // La variante est un axe de reporting (décision §10.4) : c'est
              // pour cela qu'elle se choisit dans une liste et ne se saisit
              // pas. « Particulier » et « particuliers » feraient deux lignes
              // distinctes dans les rapports, sans que rien ne signale l'écart.
              aide="Axe de comparaison dans les rapports. Se gère depuis Paramètres › Variantes."
              erreur={state.fieldErrors?.variant_id}
            >
              <option value="">Sans variante</option>
              {variantes.map((variante) => (
                <option key={variante.id} value={variante.id}>
                  {variante.name}
                </option>
              ))}
            </ChampSelect>

            <ChampZone
              id="description"
              label="Description"
              rows={3}
              optionnel
              erreur={state.fieldErrors?.description}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

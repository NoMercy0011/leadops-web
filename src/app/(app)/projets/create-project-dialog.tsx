"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createProject, type ActionState } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Variant } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
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

      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouveau projet</DialogTitle>
            <DialogDescription>
              Un pipeline par défaut est créé avec le projet. Il est ensuite
              entièrement modifiable, étape par étape.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du projet</Label>
              <Input
                id="name"
                name="name"
                placeholder="Assurance Santé"
                required
                aria-invalid={Boolean(state.fieldErrors?.name)}
              />
              {state.fieldErrors?.name ? (
                <p className="text-destructive text-sm">
                  {state.fieldErrors.name}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product">Produit</Label>
                <Input
                  id="product"
                  name="product"
                  placeholder="Assurance Santé Premium"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target">Cible</Label>
                <Input id="target" name="target" placeholder="Particuliers" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="variant_id">Variante</Label>
              {/* Un <select> natif : le composant Select de shadcn ne pose pas
                  de champ de formulaire natif, et sa valeur n'arriverait pas
                  dans le FormData de la Server Action. */}
              <select
                id="variant_id"
                name="variant_id"
                defaultValue=""
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                <option value="">Sans variante</option>
                {variantes.map((variante) => (
                  <option key={variante.id} value={variante.id}>
                    {variante.name}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.variant_id ? (
                <p className="text-destructive text-sm">
                  {state.fieldErrors.variant_id}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" rows={3} />
            </div>
          </div>

          <DialogFooter>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

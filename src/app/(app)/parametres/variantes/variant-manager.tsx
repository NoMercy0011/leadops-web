"use client";

import { useActionState, useRef, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createVariant,
  deleteVariant,
  type ActionState,
} from "@/app/(app)/projets/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Variant } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      Ajouter
    </Button>
  );
}

export function VariantManager({ variantes }: { variantes: Variant[] }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await createVariant(prev, formData);

      if (resultat.success) {
        toast.success(resultat.success);
        formRef.current?.reset();
      }
      if (resultat.message) {
        toast.error(resultat.message);
      }

      return resultat;
    },
    INITIAL,
  );

  return (
    <div className="max-w-xl space-y-6">
      <form ref={formRef} action={formAction} className="flex items-end gap-2">
        <div className="flex-1 space-y-2">
          <Label htmlFor="name">Nouvelle variante</Label>
          <Input
            id="name"
            name="name"
            placeholder="Particulier"
            required
            aria-invalid={Boolean(state.fieldErrors?.name)}
          />
        </div>
        <SubmitButton />
      </form>

      {state.fieldErrors?.name ? (
        <p className="text-destructive -mt-4 text-sm">
          {state.fieldErrors.name}
        </p>
      ) : null}

      {variantes.length > 0 ? (
        <Card>
          <CardContent className="divide-border divide-y p-0">
            {variantes.map((variante) => {
              const utilisee = (variante.projects_count ?? 0) > 0;

              return (
                <div
                  key={variante.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{variante.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {utilisee
                        ? `${variante.projects_count} projet${(variante.projects_count ?? 0) > 1 ? "s" : ""}`
                        : "Aucun projet"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8 shrink-0"
                    disabled={pending || utilisee}
                    // Le bouton est grisé quand la variante est utilisée, mais
                    // l'API refuse de toute façon : le front informe, il ne
                    // décide pas.
                    title={
                      utilisee
                        ? "Réaffectez d'abord les projets qui l'utilisent"
                        : `Supprimer ${variante.name}`
                    }
                    onClick={() =>
                      startTransition(async () => {
                        const resultat = await deleteVariant(variante.id);

                        if (resultat.success) toast.success(resultat.success);
                        if (resultat.message) toast.error(resultat.message);
                      })
                    }
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">Supprimer {variante.name}</span>
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

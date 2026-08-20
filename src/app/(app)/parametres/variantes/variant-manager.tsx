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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { formatNombre } from "@/lib/format";
import type { Variant } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
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

  const erreur = state.fieldErrors?.name;

  return (
    <div className="max-w-xl space-y-6">
      {/* `Field` est composé à la main plutôt que via `ChampTexte` : le bouton
          doit s'aligner sur la ligne du champ, et l'erreur se placer sous
          l'ensemble. Elle était auparavant sortie du formulaire et remontée par
          un `-mt-4`, ce qui la détachait du champ qu'elle décrit — y compris
          pour un lecteur d'écran, faute d'`aria-describedby`. */}
      <form ref={formRef} action={formAction}>
        <Field data-invalid={Boolean(erreur)}>
          <FieldLabel htmlFor="name">Nouvelle variante</FieldLabel>
          <div className="flex items-center gap-2">
            <Input
              id="name"
              name="name"
              placeholder="Particulier"
              required
              aria-invalid={Boolean(erreur)}
              aria-describedby={erreur ? "name-erreur" : undefined}
            />
            <SubmitButton />
          </div>
          <FieldError id="name-erreur">{erreur}</FieldError>
        </Field>
      </form>

      {variantes.length > 0 ? (
        <Card>
          <CardContent className="divide-border divide-y p-0">
            {variantes.map((variante) => {
              const projets = variante.projects_count ?? 0;
              const utilisee = projets > 0;

              return (
                <div
                  key={variante.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{variante.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {utilisee
                        ? `${formatNombre(projets)} projet${projets > 1 ? "s" : ""}`
                        : "Aucun projet"}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive duration-(--duration-fast) ease-brand size-8 shrink-0 transition-colors"
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

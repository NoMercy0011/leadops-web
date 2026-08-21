"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createProspect, type ActionState } from "./actions";
import { ChampSelect, ChampTexte } from "@/components/form-fields";
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
import type { Project, User } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Ajouter le prospect
    </Button>
  );
}

export function CreateProspectDialog({
  projets,
  utilisateurs,
}: {
  projets: Project[];
  utilisateurs: User[];
}) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await createProspect(prev, formData);

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
          <Plus className="size-4" aria-hidden />
          Nouveau prospect
        </Button>
      </DialogTrigger>

      <DialogContent className="shadow-dialog sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouveau prospect</DialogTitle>
            <DialogDescription>
              Il entre à la première étape du pipeline de son projet.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <ChampSelect
              id="project_id"
              label="Projet"
              required
              defaultValue={projets[0]?.id}
              // Le projet détermine le pipeline, le questionnaire et l'équipe :
              // ce n'est pas un simple classement, et il ne se change pas
              // ensuite sans réinterpréter tout le parcours du prospect.
              aide="Détermine le pipeline et le questionnaire appliqués."
              erreur={state.fieldErrors?.project_id}
            >
              {projets.map((projet) => (
                <option key={projet.id} value={projet.id}>
                  {projet.name}
                </option>
              ))}
            </ChampSelect>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="first_name"
                label="Prénom"
                placeholder="Jean"
                required
                autoFocus
                erreur={state.fieldErrors?.first_name}
              />
              <ChampTexte
                id="last_name"
                label="Nom"
                placeholder="Dupont"
                optionnel
                erreur={state.fieldErrors?.last_name}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="phone"
                label="Téléphone"
                type="tel"
                placeholder="034 12 345 67"
                optionnel
                // Le numéro est normalisé au format international à
                // l'enregistrement, ce qui permet de repérer les doublons quelle
                // que soit la façon dont il a été tapé.
                aide="Peut être saisi au format local."
                erreur={state.fieldErrors?.phone}
              />
              <ChampTexte
                id="email"
                label="Email"
                type="email"
                placeholder="jean@example.com"
                optionnel
                erreur={state.fieldErrors?.email}
              />
            </div>

            <ChampTexte
              id="company_name"
              label="Société"
              optionnel
              erreur={state.fieldErrors?.company_name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="source"
                label="Source"
                placeholder="Salon, site web…"
                optionnel
                erreur={state.fieldErrors?.source}
              />

              {utilisateurs.length > 0 ? (
                <ChampSelect
                  id="assigned_user_id"
                  label="Commercial"
                  defaultValue=""
                  optionnel
                  aide="Peut rester vide et être distribué plus tard."
                  erreur={state.fieldErrors?.assigned_user_id}
                >
                  <option value="">Non affecté</option>
                  {utilisateurs.map((membre) => (
                    <option key={membre.id} value={membre.id}>
                      {membre.name}
                    </option>
                  ))}
                </ChampSelect>
              ) : null}
            </div>
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

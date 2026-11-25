"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createProspect, type ActionState } from "./actions";
import { ChampSelect, ChampTexte } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
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

/**
 * Création d'un prospect, en panneau latéral.
 *
 * **Pourquoi un panneau plutôt qu'une boîte centrée.** Le formulaire compte
 * neuf champs. Dans une boîte centrée, le contenu qui dépasse fait défiler
 * *l'intérieur* d'un cadre qui flotte déjà au milieu de l'écran : deux
 * surfaces de défilement imbriquées, et des repères — l'en-tête, les boutons —
 * qui s'échappent par le haut ou par le bas. Un panneau occupe toute la
 * hauteur de la fenêtre, si bien que l'essentiel du formulaire tient sans
 * défiler ; ce qui déborde défile dans une seule zone, entre un en-tête et un
 * pied qui, eux, ne bougent pas.
 *
 * Le nom reste `CreateProspectDialog` : un panneau de shadcn est construit sur
 * la primitive Dialog de Radix et en garde tout le comportement — modalité,
 * piège de focus, fermeture par Échap. Seule la présentation change.
 */
export function CreateProspectDialog({
  projets,
  utilisateurs,
  taille = "default",
}: {
  projets: Pick<Project, "id" | "name">[];
  utilisateurs: Pick<User, "id" | "name">[];
  /**
   * Hauteur du déclencheur, comme sur `ImportDialog`.
   *
   * Sur `/prospects` le bouton est seul en tête d'écran et garde sa taille
   * pleine. Dans l'onglet Prospects d'un projet, il rejoint une rangée de
   * boutons `sm` — Kanban, Archivés, Exporter — où il dépassait d'un cran,
   * seul élément désaligné de la ligne.
   */
  taille?: "default" | "sm";
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
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size={taille === "sm" ? "sm" : "default"}>
          <Plus className="size-4" aria-hidden />
          Nouveau prospect
        </Button>
      </SheetTrigger>

      {/* Le panneau livré s'arrête à `sm:max-w-sm`, soit 384 px : les paires
          de champs sur deux colonnes y seraient à l'étroit. On reprend la
          largeur de la boîte remplacée. */}
      <SheetContent className="shadow-dialog w-full gap-0 p-0 sm:max-w-lg">
        {/* `min-h-0` sur le formulaire *et* sur la zone défilante : sans lui,
            un enfant en `flex-1` prend sa hauteur de contenu au lieu de celle
            du parent, et c'est la page entière qui défile. */}
        <form action={formAction} className="flex min-h-0 flex-1 flex-col">
          <SheetHeader className="border-b pr-12">
            <SheetTitle>Nouveau prospect</SheetTitle>
            <SheetDescription>
              Il entre à la première étape du pipeline de son projet.
            </SheetDescription>
          </SheetHeader>

          <FieldGroup className="min-h-0 flex-1 overflow-y-auto p-4">
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

          {/* `mt-auto` du composant est neutralisé : la zone défilante occupe
              déjà la place disponible, et le pied doit rester collé sous elle
              plutôt que d'être repoussé une seconde fois. */}
          <SheetFooter className="mt-0 flex-row justify-end border-t">
            <SheetClose asChild>
              <Button type="button" variant="ghost">
                Annuler
              </Button>
            </SheetClose>
            <SubmitButton />
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

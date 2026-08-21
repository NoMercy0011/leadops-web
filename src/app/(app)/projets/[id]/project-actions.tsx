"use client";

import { useActionState, useState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import { Archive, ArchiveRestore, LoaderCircle, Pause, Pencil, Play } from "lucide-react";
import { toast } from "sonner";

import {
  changeProjectStatus,
  updateProject,
  type ActionState,
} from "../actions";
import { ChampSelect, ChampTexte, ChampZone } from "@/components/form-fields";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import type { Project, ProjectStatus, Variant } from "@/lib/types";

const INITIAL: ActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Enregistrer
    </Button>
  );
}

/**
 * Modification d'un projet.
 *
 * `PATCH /projects/{id}` existait depuis le lot 3 sans qu'aucun écran ne
 * l'appelle : on ne pouvait ni renommer un projet, ni corriger sa cible, ni
 * changer sa variante. Le statut est délibérément absent de ce formulaire — il
 * a ses propres boutons, parce qu'il engage plus qu'un libellé.
 */
export function EditProjectDialog({
  projet,
  variantes,
}: {
  projet: Project;
  variantes: Variant[];
}) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await updateProject(projet.id, prev, formData);

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
        <Button variant="outline" size="sm">
          <Pencil className="size-4" aria-hidden />
          Modifier
        </Button>
      </DialogTrigger>

      <DialogContent className="shadow-dialog sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Modifier le projet</DialogTitle>
            <DialogDescription>
              Le pipeline, le questionnaire et l&apos;équipe se modifient depuis
              leurs propres sections.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <ChampTexte
              id="name"
              label="Nom du projet"
              required
              autoFocus
              defaultValue={projet.name}
              erreur={state.fieldErrors?.name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="product"
                label="Produit"
                optionnel
                defaultValue={projet.product ?? ""}
                erreur={state.fieldErrors?.product}
              />
              <ChampTexte
                id="target"
                label="Cible"
                optionnel
                defaultValue={projet.target ?? ""}
                erreur={state.fieldErrors?.target}
              />
            </div>

            <ChampSelect
              id="variant_id"
              label="Variante"
              defaultValue={projet.variant?.id ?? ""}
              optionnel
              // Changer la variante déplace le projet d'un axe de comparaison à
              // l'autre : les rapports passés s'en trouvent relus autrement.
              aide="Axe de comparaison dans les rapports. La changer réattribue tout l'historique du projet."
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
              defaultValue={projet.description ?? ""}
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

/**
 * Changement d'état d'un projet.
 *
 * **Il n'y a pas de bouton Supprimer, et c'est une décision.** Les clés
 * étrangères des prospects, des étapes et des rendez-vous sont en cascade :
 * supprimer un projet emporterait tout son historique d'un seul clic, sans
 * retour possible. L'archivage remplace ce geste — il retire le projet des
 * listes sans rien détruire, et se défait.
 *
 * Suspendre et terminer ne demandent pas confirmation : les deux se défont
 * d'un clic et ne masquent rien. Archiver en demande une, parce que le projet
 * quitte la vue et qu'il faut savoir où le retrouver.
 */
export function ProjectStatusActions({ projet }: { projet: Project }) {
  const [pending, startTransition] = useTransition();

  function basculer(statut: ProjectStatus) {
    startTransition(async () => {
      const resultat = await changeProjectStatus(projet.id, statut);

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  if (projet.status === "archived") {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        aria-busy={pending}
        onClick={() => basculer("active")}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArchiveRestore className="size-4" aria-hidden />
        )}
        Désarchiver
      </Button>
    );
  }

  return (
    <>
      {projet.status === "active" ? (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => basculer("suspended")}
        >
          <Pause className="size-4" aria-hidden />
          Suspendre
        </Button>
      ) : (
        <Button
          variant="outline"
          size="sm"
          disabled={pending}
          onClick={() => basculer("active")}
        >
          <Play className="size-4" aria-hidden />
          Réactiver
        </Button>
      )}

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground duration-(--duration-fast) ease-brand transition-colors"
            disabled={pending}
          >
            <Archive className="size-4" aria-hidden />
            Archiver
          </Button>
        </AlertDialogTrigger>

        <AlertDialogContent className="shadow-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              Archiver « {projet.name} » ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Le projet quitte la liste et n&apos;accepte plus de nouveaux
              prospects. Rien n&apos;est supprimé : ses prospects, leur
              historique et leurs rendez-vous restent consultables et
              exportables, et vous le retrouverez par le filtre
              «&nbsp;Archivés&nbsp;». L&apos;opération se défait.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={pending}
              onClick={(event) => {
                // Sans ceci, Radix referme la boîte et démonte le bouton avant
                // que l'action serveur ne parte.
                event.preventDefault();
                basculer("archived");
              }}
            >
              Archiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

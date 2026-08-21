"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteProspect, updateProspect, type ActionState } from "../actions";
import { ChampTexte } from "@/components/form-fields";
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
import type { Prospect } from "@/lib/types";

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
 * Modification de la fiche.
 *
 * L'API exposait `PATCH /prospects/{id}` depuis le lot 4, mais aucun écran ne
 * l'appelait : corriger un numéro de téléphone mal saisi à l'import était
 * impossible depuis l'interface. Le projet et l'étape n'y figurent pas — le
 * premier n'est pas modifiable (il porte le pipeline et le questionnaire), la
 * seconde a son propre sélecteur, qui écrit au journal.
 */
export function EditProspectDialog({ prospect }: { prospect: Prospect }) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await updateProspect(prospect.id, prev, formData);

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
            <DialogTitle>Modifier la fiche</DialogTitle>
            <DialogDescription>
              Corriger un numéro ou une adresse relance la détection de doublons
              du projet sur la nouvelle valeur.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="first_name"
                label="Prénom"
                required
                autoFocus
                defaultValue={prospect.first_name}
                erreur={state.fieldErrors?.first_name}
              />
              <ChampTexte
                id="last_name"
                label="Nom"
                optionnel
                defaultValue={prospect.last_name ?? ""}
                erreur={state.fieldErrors?.last_name}
              />
            </div>

            <ChampTexte
              id="company_name"
              label="Société"
              optionnel
              defaultValue={prospect.company_name ?? ""}
              erreur={state.fieldErrors?.company_name}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <ChampTexte
                id="phone"
                label="Téléphone"
                type="tel"
                optionnel
                defaultValue={prospect.phone ?? ""}
                erreur={state.fieldErrors?.phone}
              />
              <ChampTexte
                id="email"
                label="Email"
                type="email"
                optionnel
                defaultValue={prospect.email ?? ""}
                erreur={state.fieldErrors?.email}
              />
            </div>

            <ChampTexte
              id="address"
              label="Adresse"
              optionnel
              defaultValue={prospect.address ?? ""}
              erreur={state.fieldErrors?.address}
            />

            <ChampTexte
              id="source"
              label="Source"
              optionnel
              placeholder="Salon, recommandation, publicité…"
              defaultValue={prospect.source ?? ""}
              erreur={state.fieldErrors?.source}
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
 * Suppression définitive, réservée à l'Admin Client par la policy.
 *
 * Supprimer un prospect emporte son journal d'activités, dont dépendent les
 * KPIs de durée de cycle — et ces données ne se reconstituent pas. D'où la
 * confirmation, et un libellé qui nomme la conséquence plutôt que l'action.
 */
export function DeleteProspectButton({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function supprimer() {
    setPending(true);
    const resultat = await deleteProspect(prospect.id);

    if (resultat.success) {
      toast.success(resultat.success);
      // La fiche n'existe plus : y rester renverrait un 404 au premier
      // rafraîchissement.
      router.push("/prospects");
      return;
    }

    setPending(false);
    if (resultat.message) toast.error(resultat.message);
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive duration-(--duration-fast) ease-brand transition-colors"
        >
          <Trash2 className="size-4" aria-hidden />
          Supprimer
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="shadow-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Supprimer « {prospect.full_name} » ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            La fiche, ses réponses de qualification et tout son historique
            d&apos;interactions seront effacés. Les statistiques passées qui en
            découlent ne pourront pas être reconstituées. Cette action est
            irréversible.
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
              void supprimer();
            }}
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            Supprimer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

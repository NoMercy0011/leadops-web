"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Eraser,
  LoaderCircle,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveProspect,
  deleteProspect,
  updateProspect,
  type ActionState,
} from "../actions";
import { ChampTexte } from "@/components/form-fields";
import { Textarea } from "@/components/ui/textarea";
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
export function EditProspectDialog({
  prospect,
  compact = false,
}: {
  prospect: Prospect;
  /**
   * Déclencheur réduit à son icône, pour une cellule de tableau. Le libellé
   * passe alors dans `aria-label` et nomme le prospect : dans une liste de
   * trente lignes, « Modifier » répété trente fois ne dit pas quoi.
   */
  compact?: boolean;
}) {
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
        {compact ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
            aria-label={`Modifier ${prospect.full_name}`}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Pencil className="size-4" aria-hidden />
            Modifier
          </Button>
        )}
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
 * Range un prospect hors du pipeline actif, ou l'y ramène.
 *
 * **Distinct de « Perdu ».** Un contact injoignable depuis six mois n'a pas
 * été perdu, il n'a jamais commencé — le compter comme perdu ferait mentir le
 * taux de perte, qui est un résultat commercial et non un classement.
 *
 * Le motif est demandé mais facultatif : six mois plus tard, « injoignable »
 * et « doublon de la ligne 42 » n'appellent pas la même décision si le dossier
 * ressort. L'exiger transformerait un geste de rangement en formulaire, et il
 * serait rempli n'importe comment.
 */
export function ArchiveProspectButton({
  prospect,
  compact = false,
}: {
  prospect: Prospect;
  /** Réduit au pictogramme, pour une cellule de tableau. */
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const [motif, setMotif] = useState("");
  const [open, setOpen] = useState(false);

  async function basculer(archive: boolean) {
    setPending(true);
    const resultat = await archiveProspect(prospect.id, archive, motif);

    setPending(false);
    setOpen(false);
    setMotif("");

    if (resultat.success) toast.success(resultat.success);
    if (resultat.message) toast.error(resultat.message);
  }

  // Désarchiver ne demande pas confirmation : le geste est anodin et se
  // défait aussitôt. Archiver en demande une, parce que le dossier quitte les
  // listes et qu'il faut savoir où le retrouver.
  if (prospect.is_archived) {
    return (
      <Button
        variant={compact ? "ghost" : "outline"}
        size={compact ? "icon-sm" : "sm"}
        disabled={pending}
        aria-busy={pending}
        aria-label={compact ? `Désarchiver ${prospect.full_name}` : undefined}
        className={
          compact ? "text-muted-foreground hover:text-foreground" : undefined
        }
        onClick={() => void basculer(false)}
      >
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <ArchiveRestore className="size-4" aria-hidden />
        )}
        {compact ? null : "Désarchiver"}
      </Button>
    );
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon-sm" : "sm"}
          className="text-muted-foreground hover:text-foreground duration-(--duration-fast) ease-brand transition-colors"
          disabled={pending}
          aria-label={compact ? `Archiver ${prospect.full_name}` : undefined}
        >
          <Archive className="size-4" aria-hidden />
          {compact ? null : "Archiver"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="shadow-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Archiver « {prospect.full_name} » ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Le prospect quitte les listes et sort de tous les taux — conversion,
            qualification, perte. Rien n&apos;est supprimé : sa fiche et son
            historique restent consultables, et l&apos;opération se défait.
            Préférez «&nbsp;Perdu&nbsp;» si l&apos;affaire a réellement échoué.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-2 py-1">
          <label htmlFor="motif-archivage" className="text-sm font-medium">
            Motif{" "}
            <span className="text-muted-foreground font-normal">
              facultatif
            </span>
          </label>
          <Textarea
            id="motif-archivage"
            rows={2}
            value={motif}
            onChange={(event) => setMotif(event.target.value)}
            placeholder="Injoignable depuis six mois."
          />
          <p className="text-muted-foreground text-xs">
            Conservé au journal du prospect : il aidera à décider si le dossier
            ressort.
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={(event) => {
              // Sans ceci, Radix referme la boîte et démonte le bouton avant
              // que l'action serveur ne parte.
              event.preventDefault();
              void basculer(true);
            }}
          >
            Archiver
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Effacement définitif, réservé à l'Admin Client par la policy.
 *
 * **Ce n'est pas la façon de retirer un prospect du pipeline** — c'est
 * l'archivage qui s'en charge, sans rien détruire. Cette action existe pour
 * une seule raison : un prospect est une personne physique, et le droit à
 * l'effacement (RGPD, art. 17) peut obliger à supprimer réellement ses
 * données. L'archivage n'y répond pas, puisqu'il les conserve.
 *
 * D'où le libellé, qui nomme cette fonction-là plutôt que le geste : «
 * Supprimer » se lisait comme une variante plus expéditive d'« Archiver », et
 * invitait à l'erreur que l'archivage a précisément été introduit pour éviter.
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
          <Eraser className="size-4" aria-hidden />
          Effacer les données personnelles
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent className="shadow-dialog">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Effacer les données de « {prospect.full_name} » ?
          </AlertDialogTitle>
          <AlertDialogDescription>
            À n&apos;utiliser que pour répondre à une demande d&apos;effacement.
            Pour retirer ce prospect du pipeline, archivez-le : rien n&apos;est
            détruit et l&apos;opération se défait.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Aplat discret et jeton de texte assortis : `--destructive-subtle`
            va avec `--destructive-subtle-foreground`, jamais avec le jeton de
            l'aplat plein, invisible dessus en thème sombre. */}
        <div className="border-destructive/30 bg-destructive-subtle text-destructive-subtle-foreground space-y-1 rounded-md border px-3 py-2 text-sm">
          <p className="font-medium">Ce qui disparaît définitivement</p>
          <p className="leading-relaxed">
            La fiche, ses réponses de qualification, ses rendez-vous et tout son
            historique d&apos;interactions. Les durées de cycle et les taux déjà
            calculés sur ce dossier ne pourront pas être reconstitués.
          </p>
        </div>
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
            Effacer définitivement
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

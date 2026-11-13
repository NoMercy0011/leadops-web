"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Eraser,
  LoaderCircle,
  Pencil,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";

import {
  archiveProspect,
  eraseProspect,
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
import type { AutreFiche, Prospect } from "@/lib/types";

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
  lectureSeule = false,
}: {
  prospect: Prospect;
  /**
   * Déclencheur réduit à son icône, pour une cellule de tableau. Le libellé
   * passe alors dans `aria-label` et nomme le prospect : dans une liste de
   * trente lignes, « Modifier » répété trente fois ne dit pas quoi.
   */
  compact?: boolean;
  /** Archivé (lot 9) : le bouton reste visible et désactivé — décision P7. */
  lectureSeule?: boolean;
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
            disabled={lectureSeule}
          >
            <Pencil className="size-4" aria-hidden />
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled={lectureSeule}>
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
 * Effacement des données personnelles — écran S-10 de la planche du lot 9.
 *
 * **Ce n'est pas la façon de retirer un prospect du pipeline** — c'est
 * l'archivage qui s'en charge, sans rien détruire. Cette action répond au
 * droit à l'effacement (RGPD, art. 17) : elle **anonymise** la fiche. La
 * fiche reste, sans rien qui désigne la personne, et les statistiques du
 * projet restent justes. Réservée à l'Admin Client, irréversible.
 *
 * Les textes de cette boîte sont **provisoires**, à valider sur le plan
 * juridique en fin de projet (hypothèse H-1 de la note du lot 9).
 */
export function EraseProspectButton({ prospect }: { prospect: Prospect }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  // Le serveur ne renvoie cette liste qu'une fois : elle vit dans la boîte, et
  // disparaît quand on la ferme (question ouverte de la planche, tranchée).
  const [resultat, setResultat] = useState<ActionState | null>(null);

  // La personne ne se nomme qu'avant l'effacement : la boîte de résultat est
  // rendue après le rafraîchissement, quand `full_name` vaut déjà « Prospect
  // effacé ».
  const [nom] = useState(prospect.full_name);

  async function effacer() {
    setPending(true);
    setErreur(null);
    const reponse = await eraseProspect(prospect.id);
    setPending(false);

    if (reponse.success) {
      setResultat(reponse);
      router.refresh();
      return;
    }

    // Déjà effacée, depuis un autre onglet : on le dit dans la boîte, et la
    // fiche se recharge en « Prospect effacé ».
    if (reponse.code === "erasure.already_erased") {
      router.refresh();
    }

    setErreur(reponse.message ?? "Le service est momentanément indisponible.");
  }

  function fermer(ouverte: boolean) {
    setOpen(ouverte);
    if (!ouverte) {
      setResultat(null);
      setErreur(null);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={fermer}>
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
        {resultat ? (
          <ResultatEffacement autresFiches={resultat.autresFiches ?? []} />
        ) : (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Effacer les données personnelles de « {nom} » ?
              </AlertDialogTitle>
              <AlertDialogDescription>
                À utiliser pour répondre à une demande d&apos;effacement de cette
                personne. Pour retirer un prospect du pipeline, archivez-le
                plutôt : rien n&apos;est détruit et l&apos;opération se défait.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {/* Aplat discret et jeton de texte assortis : `--destructive-subtle`
                va avec `--destructive-subtle-foreground`, jamais avec le jeton
                de l'aplat plein, invisible dessus en thème sombre. */}
            <div className="border-destructive/30 bg-destructive-subtle text-destructive-subtle-foreground space-y-1 rounded-md border px-3 py-2 text-sm">
              <p className="font-medium">Ce qui est effacé, définitivement</p>
              <p className="leading-relaxed">
                Les nom, prénom, société, téléphone, email, adresse et notes de
                la fiche ; l&apos;objet de la prochaine relance ; les réponses
                libres et les dates du questionnaire ; les notes et les lieux de
                ses rendez-vous ; le contenu des notes de son historique.
              </p>
            </div>

            <div className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="font-medium">
                  Ce qui est gardé, sans rien qui la désigne
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  Le projet, l&apos;étape, le commercial, les dates et les étapes
                  franchies (qualification, conversion, perte), les réponses à
                  choix et les nombres. Les statistiques du projet restent
                  justes.
                </p>
              </div>
              <div className="space-y-1">
                <p className="font-medium">Ses autres fiches</p>
                <p className="text-muted-foreground leading-relaxed">
                  Si cette personne figure dans d&apos;autres projets de
                  l&apos;entreprise, ces fiches ne sont pas effacées. Elles vous
                  seront listées à la fin, pour que vous les traitiez une à une.
                </p>
              </div>
            </div>

            {erreur ? (
              <p role="alert" className="text-destructive-subtle-foreground text-sm">
                {erreur}
              </p>
            ) : null}

            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>Annuler</AlertDialogCancel>
              {/* Contour rouge (décision P9) : seul geste irréversible du
                  produit, il ne ressemble à aucun autre bouton de
                  confirmation. */}
              <AlertDialogAction
                disabled={pending}
                className="border-destructive text-destructive-subtle-foreground hover:bg-destructive-subtle border bg-transparent"
                onClick={(event) => {
                  // Sans ceci, Radix referme la boîte et démonte le bouton
                  // avant que l'action serveur ne parte.
                  event.preventDefault();
                  void effacer();
                }}
              >
                {pending ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Eraser className="size-4" aria-hidden />
                )}
                Effacer définitivement
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Boîte de résultat de l'effacement (S-10, « Résultat »). Texte provisoire (H-1). */
function ResultatEffacement({ autresFiches }: { autresFiches: AutreFiche[] }) {
  return (
    <>
      <AlertDialogHeader>
        <AlertDialogTitle>Données personnelles effacées</AlertDialogTitle>
        <AlertDialogDescription>
          La fiche s&apos;affiche désormais « Prospect effacé ». L&apos;effacement
          est tracé au journal, avec votre nom et la date, sans donnée
          personnelle.
        </AlertDialogDescription>
      </AlertDialogHeader>

      {autresFiches.length > 0 ? (
        <div className="border-warning/30 bg-warning-subtle text-warning-subtle-foreground space-y-2 rounded-md border px-3 py-2 text-sm">
          <p className="flex items-center gap-2 font-medium">
            <TriangleAlert className="size-4 shrink-0" aria-hidden />
            {autresFiches.length === 1
              ? "Cette personne a 1 autre fiche, qui n'a pas été effacée"
              : `Cette personne a ${autresFiches.length} autres fiches, qui n'ont pas été effacées`}
          </p>
          <ul className="space-y-1">
            {autresFiches.map((fiche) => (
              <li key={fiche.id}>
                {fiche.project} —{" "}
                <Link href={`/prospects/${fiche.id}`} className="underline">
                  ouvrir la fiche
                </Link>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed">
            Ouvrez chacune pour l&apos;effacer si la demande la concerne aussi.
            Cette liste ne s&apos;affichera plus une fois la boîte fermée.
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          Aucune autre fiche de cette personne dans l&apos;entreprise.
        </p>
      )}

      <AlertDialogFooter>
        <AlertDialogCancel>Fermer</AlertDialogCancel>
      </AlertDialogFooter>
    </>
  );
}

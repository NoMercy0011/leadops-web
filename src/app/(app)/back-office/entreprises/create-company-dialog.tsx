"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createCompany, type ActionState } from "./actions";
import {
  ChampSelect,
  ChampTexte,
} from "@/components/form-fields";
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
import { fuseauxHoraires, paysDisponibles } from "@/lib/geo";
import { formatQuota } from "@/lib/format";
import type { Plan } from "@/lib/types";

const INITIAL: ActionState = {};

const FUSEAUX = fuseauxHoraires();
const PAYS = paysDisponibles();

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Créer l&apos;entreprise
    </Button>
  );
}

export function CreateCompanyDialog({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = useState(false);

  // Le retour de l'action est traité ici plutôt que dans un `useEffect`.
  // React 19 refuse un `setState` synchrone dans un effet — il provoque des
  // rendus en cascade — et le corps de l'action est de toute façon le bon
  // endroit : c'est un contexte d'événement, pas de synchronisation.
  const [state, formAction] = useActionState(
    async (prev: ActionState, formData: FormData) => {
      const resultat = await createCompany(prev, formData);

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
          Nouvelle entreprise
        </Button>
      </DialogTrigger>

      <DialogContent className="shadow-dialog sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise cliente</DialogTitle>
            <DialogDescription>
              L&apos;abonnement est créé dans la foulée : sans plan, une
              entreprise ne peut rien créer.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="py-4">
            <ChampTexte
              id="name"
              label="Nom"
              placeholder="ABC Commercial"
              required
              autoFocus
              erreur={state.fieldErrors?.name}
            />

            <ChampTexte
              id="slug"
              label="Identifiant"
              placeholder="abc-commercial"
              required
              aide="Minuscules, chiffres et tirets. Il apparaît dans les URL et ne se change pas ensuite."
              erreur={state.fieldErrors?.slug}
            />

            <ChampSelect
              id="timezone"
              label="Fuseau horaire"
              defaultValue="Indian/Antananarivo"
              required
              // Ce n'est pas un réglage de confort : toutes les dates sont
              // stockées en UTC et converties à l'affichage dans ce fuseau.
              // Une erreur ici décale tout le calendrier du client.
              aide="Toutes les dates affichées à ce client seront converties dans ce fuseau."
              erreur={state.fieldErrors?.timezone}
            >
              {FUSEAUX.map((groupe) => (
                <optgroup key={groupe.label} label={groupe.label}>
                  {groupe.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </ChampSelect>

            <ChampSelect
              id="default_country_code"
              label="Pays par défaut"
              defaultValue="MG"
              required
              aide="Sert à normaliser les numéros de téléphone saisis au format local, donc à détecter les doublons."
              erreur={state.fieldErrors?.default_country_code}
            >
              {PAYS.map((pays) => (
                <option key={pays.value} value={pays.value}>
                  {pays.label}
                </option>
              ))}
            </ChampSelect>

            <ChampSelect
              id="plan_id"
              label="Plan"
              required
              defaultValue={plans[0]?.id}
              erreur={state.fieldErrors?.plan_id}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {formatQuota(plan.max_users)} utilisateur
                  {plan.max_users === 1 ? "" : "s"}
                </option>
              ))}
            </ChampSelect>
          </FieldGroup>

          <DialogFooter>
            {/* Une sortie explicite : sans elle, seuls la croix et la touche
                Échap ferment la boîte, ce qui n'est évident ni au toucher ni
                pour qui navigue au clavier sans connaître le raccourci. */}
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

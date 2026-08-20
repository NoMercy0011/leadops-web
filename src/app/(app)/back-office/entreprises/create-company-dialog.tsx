"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Plus } from "lucide-react";
import { toast } from "sonner";

import { createCompany, type ActionState } from "./actions";
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
import type { Plan } from "@/lib/types";

const INITIAL: ActionState = {};

function Champ({
  id,
  label,
  erreur,
  ...props
}: React.ComponentProps<typeof Input> & { label: string; erreur?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} aria-invalid={Boolean(erreur)} {...props} />
      {erreur ? <p className="text-destructive text-sm">{erreur}</p> : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
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

      <DialogContent>
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Nouvelle entreprise cliente</DialogTitle>
            <DialogDescription>
              L&apos;abonnement est créé dans la foulée : sans plan, une
              entreprise ne peut rien créer.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Champ
              id="name"
              label="Nom"
              placeholder="ABC Commercial"
              required
              erreur={state.fieldErrors?.name}
            />
            <Champ
              id="slug"
              label="Identifiant"
              placeholder="abc-commercial"
              required
              erreur={state.fieldErrors?.slug}
            />
            <Champ
              id="timezone"
              label="Fuseau horaire"
              defaultValue="Indian/Antananarivo"
              required
              erreur={state.fieldErrors?.timezone}
            />
            <Champ
              id="default_country_code"
              label="Code pays"
              defaultValue="MG"
              maxLength={2}
              required
              erreur={state.fieldErrors?.default_country_code}
            />

            <div className="space-y-2">
              <Label htmlFor="plan_id">Plan</Label>
              {/* Un <select> natif plutôt que le composant Select de shadcn :
                  celui-ci ne pose pas de champ de formulaire natif, et sa
                  valeur n'arriverait pas dans le FormData de la Server Action. */}
              <select
                id="plan_id"
                name="plan_id"
                required
                defaultValue={plans[0]?.id}
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>
                    {plan.name}
                    {plan.max_users === null
                      ? " — illimité"
                      : ` — ${plan.max_users} utilisateurs`}
                  </option>
                ))}
              </select>
              {state.fieldErrors?.plan_id ? (
                <p className="text-destructive text-sm">
                  {state.fieldErrors.plan_id}
                </p>
              ) : null}
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

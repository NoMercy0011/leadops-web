"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  activateCompany,
  changePlan,
  suspendCompany,
} from "../actions";
import { NativeSelect } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
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
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import type { Company, Plan } from "@/lib/types";

export function CompanyActions({
  company,
  plans,
}: {
  company: Company;
  plans: Plan[];
}) {
  const [pending, startTransition] = useTransition();
  const [planId, setPlanId] = useState(company.subscription?.plan?.id ?? 0);

  const suspendue = company.status === "suspended";

  function executer(action: () => Promise<{ message?: string; success?: string }>) {
    startTransition(async () => {
      const resultat = await action();

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  return (
    <div className="space-y-6">
      {/* Ce select est piloté par l'état React et non par un FormData : le
          changement de plan part par une action appelée au clic, pas par une
          soumission de formulaire. D'où `NativeSelect` seul plutôt que
          `ChampSelect`, qui poserait un `name` inutile. */}
      <Field>
        <FieldLabel htmlFor="plan">Plan d&apos;abonnement</FieldLabel>
        <div className="flex items-center gap-2">
          <NativeSelect
            id="plan"
            value={planId}
            disabled={pending}
            onChange={(event) => setPlanId(Number(event.target.value))}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </NativeSelect>

          <Button
            variant="secondary"
            className="shrink-0"
            disabled={pending || planId === company.subscription?.plan?.id}
            aria-busy={pending}
            onClick={() => executer(() => changePlan(company.id, planId))}
          >
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            Appliquer
          </Button>
        </div>
        <FieldDescription>
          Une rétrogradation sous la consommation actuelle est refusée par
          l&apos;API : réduisez d&apos;abord les ressources concernées.
        </FieldDescription>
      </Field>

      <div className="space-y-2">
        <p className="text-sm font-medium">Accès de l&apos;entreprise</p>

        {suspendue ? (
          <Button
            disabled={pending}
            aria-busy={pending}
            onClick={() => executer(() => activateCompany(company.id))}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Réactiver l&apos;entreprise
          </Button>
        ) : (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" disabled={pending}>
                Suspendre l&apos;entreprise
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="shadow-dialog">
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Suspendre « {company.name} » ?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Les sessions ouvertes seront immédiatement fermées et les
                  utilisateurs ne pourront plus se connecter. L&apos;opération
                  est réversible.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => executer(() => suspendCompany(company.id))}
                >
                  Suspendre
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
}

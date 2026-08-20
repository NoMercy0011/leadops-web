"use client";

import { useState, useTransition } from "react";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import {
  activateCompany,
  changePlan,
  suspendCompany,
} from "../actions";
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
      <div className="space-y-2">
        <label htmlFor="plan" className="text-sm font-medium">
          Plan d&apos;abonnement
        </label>
        <div className="flex gap-2">
          <select
            id="plan"
            value={planId}
            disabled={pending}
            onChange={(event) => setPlanId(Number(event.target.value))}
            className="border-input bg-background focus-visible:ring-ring h-9 flex-1 rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name}
              </option>
            ))}
          </select>

          <Button
            variant="secondary"
            disabled={pending || planId === company.subscription?.plan?.id}
            onClick={() => executer(() => changePlan(company.id, planId))}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Appliquer
          </Button>
        </div>
        <p className="text-muted-foreground text-xs">
          Une rétrogradation sous la consommation actuelle est refusée par
          l&apos;API : réduisez d&apos;abord les ressources concernées.
        </p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Accès de l&apos;entreprise</p>

        {suspendue ? (
          <Button
            disabled={pending}
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
            <AlertDialogContent>
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

"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { revenirAuxDureesPrevues } from "@/app/(app)/entretien-actions";
import { Button } from "@/components/ui/button";

/** Efface les durées personnelles de l'utilisateur sur ce projet (S-16). */
export function RevenirAuxDureesPrevues({ projectId }: { projectId: number }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const r = await revenirAuxDureesPrevues(projectId);
          if (r.message) toast.error(r.message);
          else toast.success("Les durées prévues s'appliquent de nouveau.");
        })
      }
    >
      Revenir aux durées prévues
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { LoaderCircle, Play } from "lucide-react";
import { toast } from "sonner";

import { demarrerEntretien } from "@/app/(app)/entretien-actions";
import { Button } from "@/components/ui/button";

/**
 * « Démarrer l'entretien » — lot 13, planche n°13 (S-19).
 *
 * Désactivé, avec sa raison, sur une fiche en lecture seule (décision P7 du
 * lot 9) ; l'API refuse de toute façon. Un refus (entretien déjà ouvert par
 * un autre, questionnaire vide, abonnement suspendu) s'affiche tel quel.
 */
export function DemarrerEntretien({
  prospectId,
  raisonInactif,
  reprendre,
}: {
  prospectId: number;
  raisonInactif?: string;
  reprendre?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      disabled={pending || raisonInactif !== undefined}
      title={raisonInactif}
      onClick={() =>
        startTransition(async () => {
          // En cas de succès, l'action redirige vers l'écran d'entretien.
          const etat = await demarrerEntretien(prospectId);
          if (etat.message) toast.error(etat.message);
        })
      }
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Play className="size-4" aria-hidden />}
      {reprendre ? "Reprendre l'entretien" : "Démarrer l'entretien"}
    </Button>
  );
}

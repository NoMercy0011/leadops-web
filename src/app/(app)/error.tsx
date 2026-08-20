"use client";

import { useEffect } from "react";
import { RotateCw, ServerCrash } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Écran d'erreur de l'espace authentifié.
 *
 * Sans ce fichier, une API injoignable produit l'écran d'erreur générique de
 * Next : un mur blanc en anglais, sans issue. Ici l'utilisateur lit ce qui se
 * passe, dans sa langue, et dispose d'un bouton pour retenter.
 *
 * C'est `retry` et non `reset`. Next 16.3 a stabilisé le premier, qui refait
 * les requêtes du segment ; `reset` se borne à vider l'état de la frontière
 * d'erreur sans rien récupérer, ce qui ne répare rien quand la cause est une
 * API injoignable — l'écran d'erreur reviendrait aussitôt.
 *
 * Le message reste volontairement vague sur la cause. Le détail technique
 * n'aide pas un commercial et renseignerait un attaquant sur l'infrastructure ;
 * il part dans la console et, plus tard, dans les logs structurés du lot 8.
 */
export default function Error({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <EmptyState
      icon={ServerCrash}
      titre="Cet écran n'a pas pu se charger"
      description={
        <>
          Le service est momentanément indisponible ou la connexion a été
          interrompue. Réessayez dans un instant ; vos données ne sont pas
          affectées.
          {error.digest ? (
            <>
              <br />
              <span className="text-muted-foreground/80 font-mono text-xs">
                Référence : {error.digest}
              </span>
            </>
          ) : null}
        </>
      }
      action={
        <Button onClick={() => retry()}>
          <RotateCw className="size-4" />
          Réessayer
        </Button>
      }
    />
  );
}

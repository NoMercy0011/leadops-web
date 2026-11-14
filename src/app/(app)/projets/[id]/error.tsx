"use client";

import { useEffect } from "react";
import { RotateCw, ServerCrash } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";

/**
 * Erreur d'un onglet de la fiche projet (lot 9, faille F16).
 *
 * Placée sous `projets/[id]`, elle ne remplace que le contenu de l'onglet :
 * l'en-tête du projet et ses onglets restent, et l'on peut passer à un autre
 * onglet. Sans elle, l'erreur remontait jusqu'à `(app)/error.tsx`, qui
 * effaçait toute la fiche.
 *
 * `retry` et non `reset`, comme l'écran d'erreur de l'espace authentifié :
 * Next 16.3 refait alors les requêtes du segment.
 */
export default function ErreurOngletProjet({
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
      titre="Cet onglet n'a pas pu se charger"
      description={
        <>
          Le service est momentanément indisponible ou la connexion a été
          interrompue. Les autres onglets du projet restent accessibles.
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
        <Button variant="outline" onClick={retry}>
          <RotateCw className="size-4" aria-hidden />
          Réessayer
        </Button>
      }
    />
  );
}

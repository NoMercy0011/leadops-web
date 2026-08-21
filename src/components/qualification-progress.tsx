import { CircleCheck, TriangleAlert } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import { formatNombre } from "@/lib/format";
import type { EtatQualification } from "@/lib/qualification";
import { cn } from "@/lib/utils";

/**
 * En-tête de la section de qualification.
 *
 * **Ce qui compte, et dans quel ordre.** Un questionnaire de dix questions
 * rendu tel quel ne dit rien de son état : il faut le parcourir jusqu'en bas
 * pour découvrir qu'il manque une réponse obligatoire. Trois informations en
 * sortent, de poids très inégal :
 *
 * 1. **Ce qui bloque** — le nombre d'obligatoires sans réponse. Seul chiffre
 *    qui appelle une action, donc seul à passer en `text-3xl` et en couleur.
 * 2. **Où l'on en est** — la progression, en barre plus qu'en nombre : c'est
 *    une proportion, et une barre se lit sans être lue.
 * 3. **Le détail** — « 7 sur 9 », en petit, pour qui veut le compte exact.
 *
 * Quand tout est répondu, la dominante disparaît au profit d'une simple
 * confirmation : garder un grand « 0 » attirerait l'œil sur un non-événement.
 */
export function QualificationProgress({
  etat,
  className,
}: {
  etat: EtatQualification;
  className?: string;
}) {
  // Rien à mesurer : le questionnaire du projet est vide. L'écran d'appel à
  // l'action est rendu par le formulaire lui-même.
  if (etat.progression === null) {
    return null;
  }

  const bloque = etat.obligatoiresManquantes > 0;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg px-4 py-3",
        bloque ? "bg-warning-subtle" : "bg-muted/60",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {bloque ? (
          <TriangleAlert
            className="text-warning-subtle-foreground size-5 shrink-0"
            aria-hidden
          />
        ) : (
          <CircleCheck
            className="text-success-subtle-foreground size-5 shrink-0"
            aria-hidden
          />
        )}

        {bloque ? (
          <p className="text-warning-subtle-foreground flex items-baseline gap-2">
            <span className="font-heading text-3xl leading-none font-semibold tabular-nums">
              {formatNombre(etat.obligatoiresManquantes)}
            </span>
            <span className="text-sm font-medium">
              réponse{etat.obligatoiresManquantes > 1 ? "s" : ""} obligatoire
              {etat.obligatoiresManquantes > 1 ? "s" : ""} manquante
              {etat.obligatoiresManquantes > 1 ? "s" : ""}
            </span>
          </p>
        ) : (
          <p className="text-success-subtle-foreground text-sm font-medium">
            Qualification complète
          </p>
        )}
      </div>

      <div className="min-w-40 flex-1 space-y-1.5">
        <div className="text-muted-foreground flex items-baseline justify-between gap-3 text-xs">
          <span>Progression</span>
          <span className="tabular-nums">
            {formatNombre(etat.repondues)} sur {formatNombre(etat.total)}
          </span>
        </div>

        <Progress
          value={etat.progression}
          // La barre porte la proportion ; le pourcentage chiffré serait
          // redondant avec elle et avec le compte exact déjà affiché.
          aria-label={`Qualification à ${etat.progression} %`}
        />
      </div>
    </div>
  );
}

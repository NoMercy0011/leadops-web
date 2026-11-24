import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import type { CompanyStatus, SubscriptionStatus } from "@/lib/types";

/**
 * Pastille d'état, en aplat.
 *
 * Elle prend une *tonalité*, jamais un état métier. La nuance est structurante
 * pour LeadOps : les étapes de pipeline sont des lignes en base configurées par
 * chaque client (invariant n°2), et leur couleur arrive de l'API. Un composant
 * qui ferait `if (statut === "Converti")` serait donc faux dès le premier
 * client qui renomme ses étapes — et le plan interdit explicitement de tester
 * un libellé.
 *
 * Les seuls états qui se mappent en dur ici sont ceux qui sont réellement des
 * enums côté API — statut d'entreprise et statut d'abonnement — et ce mappage
 * est isolé dans les deux fonctions du bas.
 *
 * Les aplats utilisent la teinte d'origine de la palette et la déclinaison
 * foncée pour le texte : c'est exactement le cas d'usage prévu par la charte,
 * où le contraste se joue avec le texte posé dessus et non avec le fond.
 */
const statusBadgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
  {
    variants: {
      tone: {
        neutral: "bg-muted text-muted-foreground",
        info: "bg-info-subtle text-info-subtle-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        danger: "bg-destructive-subtle text-destructive-subtle-foreground",
      },
    },
    defaultVariants: {
      tone: "neutral",
    },
  },
);

export type Tone = NonNullable<VariantProps<typeof statusBadgeVariants>["tone"]>;

export function StatusBadge({
  tone,
  point = true,
  pulse = false,
  className,
  children,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof statusBadgeVariants> & {
    /** Pastille de couleur devant le libellé. */
    point?: boolean;
    /**
     * Fait battre la pastille — un état *en cours*, pas un état quelconque.
     *
     * Réservé aux emplacements où l'état conditionne la lecture de tout
     * l'écran : l'aplat vert clair est très pâle en thème clair (#e9f2e9), et
     * un projet actif s'y efface au point qu'on ne sait plus s'il l'est.
     *
     * En option explicite, et non sur toute la tonalité `success` : les
     * étapes gagnantes du tableau des prospects la partagent, et une douzaine
     * de pastilles clignotantes ne signalerait plus rien du tout.
     */
    pulse?: boolean;
  }) {
  return (
    <span
      className={cn(
        statusBadgeVariants({ tone }),
        // Un filet dans la teinte du texte, à un quart d'opacité.
        //
        // L'aplat de la pastille est volontairement très pâle — #e9f2e9 pour
        // la sauge — et il ne se détache pas de la carte blanche : 1,1:1, soit
        // aucune forme perceptible. Le libellé se lisait, la pastille non. Le
        // filet lui rend un contour sans toucher à la palette, qui sert
        // partout ailleurs.
        pulse && "ring-1 ring-current/25",
        className,
      )}
      {...props}
    >
      {point ? (
        // La couleur seule ne peut pas porter l'information — daltonisme, et
        // impression en noir et blanc. Le libellé reste donc toujours présent,
        // la pastille n'étant qu'un repère de balayage visuel.
        <span aria-hidden className="relative flex size-1.5 shrink-0">
          {pulse ? (
            // L'onde part de la pastille et se dissipe. `motion-reduce` la
            // coupe : une animation qui se répète sans fin est précisément ce
            // que ce réglage système demande d'éviter.
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-current opacity-75 motion-reduce:hidden" />
          ) : null}
          <span
            className={cn(
              "relative inline-flex size-full rounded-full bg-current",
              pulse ? "opacity-100" : "opacity-70",
            )}
          />
        </span>
      ) : null}
      {children}
    </span>
  );
}

/**
 * Tonalité d'un statut d'abonnement.
 *
 * À alimenter avec `effective_status` et non `status` : l'API distingue la
 * valeur stockée de la valeur effective, qui tient compte d'une échéance
 * dépassée que la tâche planifiée n'a pas encore traitée.
 */
export function toneAbonnement(statut: SubscriptionStatus): Tone {
  const tons: Record<SubscriptionStatus, Tone> = {
    active: "success",
    // Suspendu se rattrape (réactivation), expiré est un fait acquis : la
    // première invite à agir, la seconde constate. D'où deux tons distincts.
    suspended: "warning",
    expired: "danger",
  };

  return tons[statut];
}

export function toneEntreprise(statut: CompanyStatus): Tone {
  const tons: Record<CompanyStatus, Tone> = {
    active: "success",
    suspended: "danger",
  };

  return tons[statut];
}

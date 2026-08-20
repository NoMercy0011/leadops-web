import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Message d'information contextuel, posé dans le flux de la page.
 *
 * Il existe parce que le même bloc coloré était réécrit à la main à chaque
 * besoin — l'erreur de connexion, le bandeau d'abonnement bloqué — avec des
 * classes légèrement différentes à chaque fois. Trois occurrences suffisent à
 * faire diverger les couleurs, les icônes et le rôle ARIA.
 *
 * À distinguer du toast (`sonner`), qui signale le *résultat* d'une action que
 * l'utilisateur vient de déclencher et disparaît. Le Notice décrit un *état*
 * qui persiste tant que la cause persiste : il ne se ferme pas tout seul.
 */
const noticeVariants = cva(
  "flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm",
  {
    variants: {
      variant: {
        info: "bg-info-subtle text-info-subtle-foreground",
        success: "bg-success-subtle text-success-subtle-foreground",
        warning: "bg-warning-subtle text-warning-subtle-foreground",
        destructive: "bg-destructive-subtle text-destructive-subtle-foreground",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

const ICONES: Record<NonNullable<NoticeVariant>, LucideIcon> = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  destructive: CircleAlert,
};

type NoticeVariant = VariantProps<typeof noticeVariants>["variant"];

export function Notice({
  className,
  variant = "info",
  titre,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof noticeVariants> & { titre?: string }) {
  const Icone = ICONES[variant ?? "info"];

  return (
    <div
      // `alert` interrompt le lecteur d'écran, ce qui se justifie pour une
      // erreur mais pas pour une information de contexte. `status` annonce
      // sans couper — la distinction porte sur l'urgence, pas la couleur.
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(noticeVariants({ variant }), className)}
      {...props}
    >
      <Icone className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="space-y-1">
        {titre ? <p className="leading-snug font-medium">{titre}</p> : null}
        <div className="leading-relaxed [&_a]:underline [&_a]:underline-offset-2">
          {children}
        </div>
      </div>
    </div>
  );
}

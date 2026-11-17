import Link from "next/link";
import { CircleCheck, Copy, PhoneOff, ClipboardX } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { formatNombre } from "@/lib/format";
import type { DataQuality } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Défauts de données du projet.
 *
 * **Un constat, pas une alarme.** Aucun de ces trois défauts n'empêche de
 * travailler : ils faussent des chiffres. Les afficher en rouge les mettrait au
 * même rang qu'une relance en retard, qui elle demande une action aujourd'hui.
 * D'où l'ocre, et une ligne par défaut plutôt que des tuiles.
 *
 * Chaque ligne nomme des prospects et y renvoie. Un compte sans exemples —
 * « 6 qualifications incomplètes » — laisse l'utilisateur devant un chiffre
 * qu'il ne sait pas par où attaquer.
 */
function Ligne({
  icon: Icone,
  total,
  titre,
  explication,
  exemples,
}: {
  icon: LucideIcon;
  total: number;
  titre: string;
  explication: string;
  exemples: { id: number; name: string }[];
}) {
  return (
    <div className="flex items-start gap-3 py-3">
      <span
        className={cn(
          "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md",
          total > 0
            ? "bg-warning-subtle text-warning-subtle-foreground"
            : "bg-muted text-muted-foreground",
        )}
      >
        <Icone className="size-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-sm">
          <span
            className={cn(
              "font-heading font-semibold tabular-nums",
              total > 0 && "text-warning-subtle-foreground",
            )}
          >
            {formatNombre(total)}
          </span>{" "}
          <span className="font-medium">{titre}</span>
        </p>
        <p className="text-muted-foreground text-xs leading-relaxed">
          {explication}
        </p>

        {exemples.length > 0 ? (
          <p className="text-muted-foreground pt-1 text-xs">
            {exemples.map((prospect, index) => (
              <span key={prospect.id}>
                {index > 0 ? ", " : ""}
                <Link
                  href={`/prospects/${prospect.id}`}
                  className="hover:text-foreground underline-offset-2 hover:underline"
                >
                  {prospect.name || "Prospect effacé"}
                </Link>
              </span>
            ))}
            {total > exemples.length ? `, et ${total - exemples.length} autre${total - exemples.length > 1 ? "s" : ""}` : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function DataQualityPanel({ qualite }: { qualite: DataQuality }) {
  const total =
    qualite.doublons.prospects +
    qualite.sans_coordonnee.total +
    qualite.qualification_incomplete.total;

  if (total === 0) {
    return (
      <p className="text-muted-foreground flex items-center gap-2 text-sm">
        <CircleCheck
          className="text-success-subtle-foreground size-4 shrink-0"
          aria-hidden
        />
        Aucun doublon, aucun prospect injoignable, aucune qualification
        incomplète.
      </p>
    );
  }

  return (
    <div className="divide-border divide-y">
      {qualite.doublons.groupes > 0 ? (
        <Ligne
          icon={Copy}
          total={qualite.doublons.prospects}
          titre={`prospects en doublon (${formatNombre(qualite.doublons.groupes)} groupe${qualite.doublons.groupes > 1 ? "s" : ""})`}
          // Le rapprochement passe par les colonnes normalisées : deux
          // écritures d'un même numéro sont un seul contact.
          explication="Même téléphone ou même adresse dans ce projet. Un contact présent dans un autre projet n'est pas un doublon."
          exemples={qualite.doublons.exemples.flatMap((g) => g.prospects)}
        />
      ) : null}

      {qualite.sans_coordonnee.total > 0 ? (
        <Ligne
          icon={PhoneOff}
          total={qualite.sans_coordonnee.total}
          titre="prospects injoignables"
          explication="Ni téléphone ni email. Ils restent au dénominateur du taux de contact et le tirent vers le bas."
          exemples={qualite.sans_coordonnee.exemples}
        />
      ) : null}

      {qualite.qualification_incomplete.total > 0 ? (
        <Ligne
          icon={ClipboardX}
          total={qualite.qualification_incomplete.total}
          titre="qualifications incomplètes"
          explication={`Au moins une des ${formatNombre(qualite.qualification_incomplete.questions_obligatoires)} questions obligatoires est sans réponse.`}
          exemples={qualite.qualification_incomplete.exemples}
        />
      ) : null}
    </div>
  );
}

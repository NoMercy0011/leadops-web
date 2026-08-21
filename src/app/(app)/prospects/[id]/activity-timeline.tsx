import {
  ArrowRight,
  FileDown,
  MessageSquare,
  PencilLine,
  Sparkles,
  UserMinus,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import { formatDateHeure, formatDistance } from "@/lib/format";
import type { ActivityType, ProspectActivity } from "@/lib/types";

/**
 * Chronologie du prospect.
 *
 * Le journal est en lecture seule : un historique réécrivable ne vaut rien
 * comme trace, et les durées de cycle du lot 7 s'appuient dessus.
 *
 * Chaque type a sa mise en forme, mais aucune ne dépend d'un libellé d'étape :
 * les noms affichés viennent du `payload` enregistré au moment de l'événement,
 * ce qui garde l'historique lisible même après renommage ou suppression d'une
 * étape.
 */
const ICONES: Record<ActivityType, LucideIcon> = {
  created: Sparkles,
  imported: FileDown,
  stage_changed: ArrowRight,
  assigned: UserPlus,
  unassigned: UserMinus,
  note_added: MessageSquare,
  next_action_planned: PencilLine,
  fields_updated: PencilLine,
};

function decrire(activite: ProspectActivity): React.ReactNode {
  const p = activite.payload ?? {};

  switch (activite.type) {
    case "stage_changed":
      return (
        <>
          <span className="text-muted-foreground">{String(p.from ?? "—")}</span>
          <ArrowRight className="mx-1 inline size-3" aria-hidden />
          <span className="font-medium">{String(p.to ?? "—")}</span>
        </>
      );

    case "assigned":
      return (
        <>
          Affecté à <span className="font-medium">{String(p.to ?? "—")}</span>
          {p.from ? (
            <span className="text-muted-foreground">
              {" "}
              (auparavant {String(p.from)})
            </span>
          ) : null}
        </>
      );

    case "unassigned":
      return (
        <>
          Retiré à{" "}
          <span className="font-medium">{String(p.from ?? "—")}</span>
        </>
      );

    case "note_added":
      return <span className="whitespace-pre-line">{String(p.note ?? "")}</span>;

    case "next_action_planned":
      return p.at ? (
        <>
          Relance prévue {formatDistance(String(p.at))}
          {p.note ? ` — ${String(p.note)}` : ""}
        </>
      ) : (
        "Relance annulée"
      );

    case "fields_updated":
      return (
        <span className="text-muted-foreground">
          Champs modifiés : {(p.fields as string[] | undefined)?.join(", ")}
        </span>
      );

    case "imported":
      return "Importé depuis un fichier";

    default:
      return activite.type_label;
  }
}

export function ActivityTimeline({
  activites,
  fuseau,
}: {
  activites: ProspectActivity[];
  fuseau?: string;
}) {
  if (activites.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune activité pour l&apos;instant.
      </p>
    );
  }

  return (
    <ol className="space-y-0">
      {activites.map((activite, index) => {
        const Icone = ICONES[activite.type] ?? Sparkles;
        const dernier = index === activites.length - 1;

        return (
          <li key={activite.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-7 shrink-0 items-center justify-center rounded-full ${
                  activite.is_interaction
                    ? "bg-accent text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icone className="size-3.5" aria-hidden />
              </span>
              {/* Le trait relie les événements ; il s'arrête au dernier pour
                  ne pas suggérer une suite qui n'existe pas. */}
              {!dernier ? <span className="bg-border w-px flex-1" /> : null}
            </div>

            <div className="min-w-0 flex-1 pb-5">
              <p className="text-sm">{decrire(activite)}</p>
              <p className="text-muted-foreground mt-0.5 text-xs">
                <time
                  dateTime={activite.occurred_at}
                  title={formatDateHeure(activite.occurred_at, {
                    timeZone: fuseau,
                  })}
                >
                  {formatDistance(activite.occurred_at)}
                </time>
                {" · "}
                {/* Pas d'auteur : import automatisé, ou compte supprimé
                    depuis. La ligne d'historique survit à son auteur. */}
                {activite.user?.name ?? "Système"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

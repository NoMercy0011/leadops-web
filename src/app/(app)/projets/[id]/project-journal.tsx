import { TriangleAlert } from "lucide-react";

import { formatDateHeure, formatDistance } from "@/lib/format";
import type { ProjectActivity } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Journal de configuration du projet.
 *
 * **Ce qu'il sert à retrouver.** Un rapport comparé d'un trimestre à l'autre
 * peut devenir faux sans qu'aucune donnée ne change : il suffit qu'une étape
 * ait été renommée ou qu'une question ait quitté le formulaire. Ces événements
 * n'appartiennent à aucun prospect, donc le journal du prospect ne pouvait pas
 * les porter — d'où cette table à part.
 *
 * Les lignes marquées d'un triangle sont celles qui **réinterprètent le
 * passé**. C'est l'API qui les désigne, pas ce composant : la règle est une
 * décision métier, elle appartient à l'enum côté serveur.
 *
 * Chaque libellé est reconstitué depuis le payload plutôt que rendu générique.
 * « Étape modifiée » seul n'apprend rien ; « Qualifié → Étude médicale » est
 * l'information qu'on vient chercher.
 */
function decrire(activite: ProjectActivity): string | null {
  const p = activite.payload ?? {};
  const texte = (cle: string) =>
    typeof p[cle] === "string" ? (p[cle] as string) : null;

  switch (activite.type) {
    case "stage_updated":
    case "question_updated":
    case "status_changed": {
      const de = texte("de");
      const vers = texte("vers");
      return de && vers ? `${de} → ${vers}` : null;
    }

    case "stage_added":
    case "stage_removed":
      return texte("stage");

    case "question_added":
    case "question_removed":
      return texte("question");

    case "project_created":
      return texte("name");

    case "stages_reordered":
      return Array.isArray(p.ordre) ? (p.ordre as string[]).join(" · ") : null;

    case "members_changed": {
      const entrants = Array.isArray(p.entrants) ? (p.entrants as string[]) : [];
      const sortants = Array.isArray(p.sortants) ? (p.sortants as string[]) : [];

      return [
        entrants.length > 0 ? `+ ${entrants.join(", ")}` : null,
        sortants.length > 0 ? `− ${sortants.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" · ");
    }

    case "project_updated": {
      const champs = p.champs as Record<string, { de?: unknown; vers?: unknown }>;
      return champs ? Object.keys(champs).join(", ") : null;
    }

    default:
      return null;
  }
}

export function ProjectJournal({
  activites,
  fuseau,
}: {
  activites: ProjectActivity[];
  fuseau?: string;
}) {
  if (activites.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune modification de configuration depuis la création du projet.
      </p>
    );
  }

  return (
    <ol className="divide-border divide-y">
      {activites.map((activite) => {
        const detail = decrire(activite);

        return (
          <li key={activite.id} className="flex items-start gap-3 py-2.5">
            {activite.reinterprete_le_passe ? (
              <TriangleAlert
                className="text-warning-subtle-foreground mt-0.5 size-3.5 shrink-0"
                aria-label="Change le sens des données déjà saisies"
              />
            ) : (
              <span className="bg-border mt-2 size-1.5 shrink-0 rounded-full" aria-hidden />
            )}

            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span
                  className={cn(
                    "font-medium",
                    activite.reinterprete_le_passe &&
                      "text-warning-subtle-foreground",
                  )}
                >
                  {activite.type_label}
                </span>
                {detail ? (
                  <span className="text-muted-foreground"> — {detail}</span>
                ) : null}
              </p>

              <p className="text-muted-foreground text-xs">
                {/* Le relatif se lit d'un coup d'œil ; la date exacte reste en
                    infobulle, sans quoi deux lignes « il y a 3 jours » ne se
                    départageraient pas. */}
                <time
                  dateTime={activite.occurred_at}
                  title={formatDateHeure(activite.occurred_at, {
                    timeZone: fuseau,
                  })}
                >
                  {formatDistance(activite.occurred_at)}
                </time>
                {activite.user ? ` · ${activite.user.name}` : " · sans auteur"}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

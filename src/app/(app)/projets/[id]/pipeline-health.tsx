import { AlarmClock, Flag, Trophy } from "lucide-react";

import { formatNombre } from "@/lib/format";
import type { PipelineHealth } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Santé du pipeline.
 *
 * **La répartition dit où sont les prospects ; la durée dit où ils
 * s'arrêtent.** Trente prospects qui viennent d'entrer en « Qualifié » et
 * trente qui y stationnent depuis trois semaines donnent exactement la même
 * barre — et seule la seconde situation appelle une action. C'est pour cela que
 * la durée moyenne et le compte d'immobiles figurent à côté de la barre, et non
 * dans un écran de rapport séparé.
 *
 * **Une seule teinte pour toutes les barres**, comme sur la répartition du
 * tableau de bord. Ce n'est pas une série catégorielle : c'est une seule
 * mesure — le nombre de prospects — répartie sur des étapes ordonnées.
 * L'identité est portée par le libellé, le rang par la position ; la couleur
 * n'a rien à encoder. La palette d'étapes, validée pour un aplat isolé,
 * échouerait ici : sauge et teal ressortent à ΔE 6,1, très en deçà du seuil
 * de 15 qui rend deux barres voisines distinguables.
 *
 * L'échelle est relative au maximum et non au total : sur un pipeline de sept
 * étapes, rapporter au total écraserait toutes les barres à quelques pour cent
 * de large et les rendrait incomparables.
 */
export function PipelineHealthPanel({ sante }: { sante: PipelineHealth }) {
  const maximum = Math.max(1, ...sante.stages.map((e) => e.total));
  const immobilesTotal = sante.stages.reduce((s, e) => s + e.immobiles, 0);

  // L'étape la plus lente parmi celles qui ont assez de passages pour que la
  // moyenne veuille dire quelque chose. Sur un seul franchissement, c'est une
  // anecdote, pas une tendance.
  const laPlusLente = sante.stages
    .filter((e) => e.duree_moyenne_jours !== null && e.passages >= 2)
    .sort((a, b) => (b.duree_moyenne_jours ?? 0) - (a.duree_moyenne_jours ?? 0))[0];

  return (
    <div className="space-y-4">
      <table className="w-full border-separate border-spacing-y-1.5 text-sm">
        <caption className="sr-only">
          Répartition, durée moyenne et prospects immobiles par étape
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Étape</th>
            <th scope="col">Prospects</th>
            <th scope="col">Durée moyenne</th>
          </tr>
        </thead>
        <tbody>
          {sante.stages.map((etape) => (
            <tr key={etape.stage_id}>
              <th
                scope="row"
                className="w-36 max-w-36 pr-3 text-left font-normal"
              >
                <span className="flex items-center gap-1.5">
                  {/* Gagné et perdu sont des états : ils se signalent par une
                      icône, jamais par la couleur seule. */}
                  {etape.is_won ? (
                    <Trophy
                      className="text-success-subtle-foreground size-3.5 shrink-0"
                      aria-label="Étape gagnante"
                    />
                  ) : etape.is_lost ? (
                    <Flag
                      className="text-destructive-subtle-foreground size-3.5 shrink-0"
                      aria-label="Étape perdue"
                    />
                  ) : null}
                  <span className="min-w-0 truncate">{etape.name}</span>
                </span>
              </th>

              <td>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-3 flex-1 overflow-hidden rounded-sm">
                    <div
                      className="bg-primary h-full rounded-sm"
                      style={{
                        width: `${Math.max((etape.total / maximum) * 100, etape.total > 0 ? 2 : 0)}%`,
                      }}
                    />
                  </div>
                  <span className="w-8 shrink-0 text-right tabular-nums">
                    {formatNombre(etape.total)}
                  </span>
                </div>
              </td>

              <td className="w-32 pl-3 text-right">
                <span className="flex items-center justify-end gap-2">
                  {etape.immobiles > 0 ? (
                    <span
                      className="text-warning-subtle-foreground inline-flex items-center gap-1 text-xs font-medium"
                      title={`${etape.immobiles} prospect${etape.immobiles > 1 ? "s" : ""} sans changement d'étape depuis plus de ${sante.seuil_immobilite_jours} jours`}
                    >
                      <AlarmClock className="size-3.5 shrink-0" aria-hidden />
                      {formatNombre(etape.immobiles)}
                    </span>
                  ) : null}

                  <span
                    className={cn(
                      "font-mono text-xs tabular-nums",
                      // La moyenne d'un seul passage n'est pas une moyenne :
                      // elle s'affiche, en retrait, pour ne pas se lire comme
                      // une tendance établie.
                      etape.passages >= 2
                        ? "text-muted-foreground"
                        : "text-muted-foreground/60",
                    )}
                    title={
                      etape.duree_moyenne_jours === null
                        ? "Aucun prospect n'a encore quitté cette étape"
                        : `Moyenne sur ${etape.passages} passage${etape.passages > 1 ? "s" : ""}`
                    }
                  >
                    {etape.duree_moyenne_jours === null
                      ? "—"
                      : `${formatNombre(etape.duree_moyenne_jours)} j`}
                  </span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Une phrase plutôt qu'un second graphique : la conclusion tient en une
          ligne, et la dessiner ne l'aurait pas rendue plus claire. */}
      {immobilesTotal > 0 || laPlusLente ? (
        <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
          {immobilesTotal > 0 ? (
            <span className="text-warning-subtle-foreground font-medium">
              {formatNombre(immobilesTotal)} prospect
              {immobilesTotal > 1 ? "s" : ""} sans mouvement depuis plus de{" "}
              {sante.seuil_immobilite_jours} jours.{" "}
            </span>
          ) : null}
          {laPlusLente ? (
            <>
              L&apos;étape la plus longue à franchir est «&nbsp;
              {laPlusLente.name}&nbsp;», en{" "}
              {formatNombre(laPlusLente.duree_moyenne_jours ?? 0)} jours en
              moyenne.
            </>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}

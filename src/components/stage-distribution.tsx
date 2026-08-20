import { Flag, Trophy } from "lucide-react";

import { formatNombre } from "@/lib/format";
import type { StageSlice } from "@/lib/reporting";

/**
 * Répartition des prospects par étape de pipeline.
 *
 * **Une seule teinte pour toutes les barres, et c'est délibéré.**
 *
 * Le réflexe serait de reprendre la couleur de chaque étape, comme sur les
 * pastilles du kanban. La palette d'étapes a été validée pour cet usage — un
 * aplat isolé, accompagné de son libellé — mais elle échoue comme palette de
 * graphique : passée au validateur, la paire sauge / teal ressort à ΔE 6,1 en
 * vision normale, très en deçà du seuil de 15. Deux barres voisines seraient
 * indiscernables, y compris pour qui voit toutes les couleurs.
 *
 * Le vrai diagnostic est ailleurs : ce n'est pas une série catégorielle. C'est
 * **une seule mesure** — le nombre de prospects — répartie sur des catégories
 * ordonnées. L'identité est portée par le libellé inscrit sur chaque barre, pas
 * par la couleur, et le rang par la position. La couleur n'a donc rien à
 * encoder du tout.
 *
 * Les deux étapes terminales sont signalées par une icône et non par une
 * teinte : gagné et perdu sont des états, et un état ne se distingue jamais par
 * la couleur seule.
 *
 * Rendu en HTML plutôt qu'en SVG : chaque valeur étant déjà écrite en clair, un
 * graphique interactif n'apporterait rien qu'une infobulle — c'est donc du
 * balisage sans JavaScript, rendu côté serveur.
 */
export function StageDistribution({ etapes }: { etapes: StageSlice[] }) {
  const total = etapes.reduce((somme, etape) => somme + etape.total, 0);

  if (total === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun prospect à répartir pour l&apos;instant.
      </p>
    );
  }

  // L'échelle est relative au maximum et non au total : sur un pipeline de
  // sept étapes, rapporter au total écraserait toutes les barres à quelques
  // pour cent de large et les rendrait incomparables entre elles.
  const maximum = Math.max(...etapes.map((etape) => etape.total));

  // Le nom du projet n'est affiché que s'il lève une ambiguïté : sur un seul
  // projet, le répéter à chaque ligne serait du bruit.
  const multiProjet = new Set(etapes.map((etape) => etape.project)).size > 1;

  return (
    <table className="w-full border-separate border-spacing-y-1.5 text-sm">
      <caption className="sr-only">
        Répartition des prospects par étape de pipeline
      </caption>
      <thead className="sr-only">
        <tr>
          <th scope="col">Étape</th>
          <th scope="col">Prospects</th>
        </tr>
      </thead>
      <tbody>
        {etapes.map((etape) => {
          const part = total === 0 ? 0 : (etape.total / total) * 100;
          const largeur = maximum === 0 ? 0 : (etape.total / maximum) * 100;

          return (
            <tr key={etape.stage_id}>
              <th
                scope="row"
                className="w-44 max-w-44 pr-3 text-left font-normal"
              >
                <span className="flex items-center gap-1.5">
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
                  <span className="min-w-0">
                    <span className="block truncate">{etape.stage}</span>
                    {/* Le projet lève l'ambiguïté : deux projets ont chacun
                        leur « Nouveau », et les afficher sans distinction
                        laisse croire à un doublon. */}
                    {multiProjet ? (
                      <span className="text-muted-foreground block truncate text-xs">
                        {etape.project}
                      </span>
                    ) : null}
                  </span>
                </span>
              </th>

              <td>
                <div className="flex items-center gap-2">
                  <div
                    className="bg-muted h-5 flex-1 overflow-hidden rounded-sm"
                    // La part du total complète la lecture : la barre compare
                    // les étapes entre elles, le pourcentage les situe dans
                    // l'ensemble.
                    title={`${etape.project} · ${etape.stage} — ${formatNombre(etape.total)} prospects, ${part.toFixed(1)} % du total`}
                  >
                    <div
                      className="bg-primary h-full rounded-sm"
                      style={{ width: `${Math.max(largeur, 2)}%` }}
                    />
                  </div>

                  <span className="w-12 shrink-0 text-right tabular-nums">
                    {formatNombre(etape.total)}
                  </span>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

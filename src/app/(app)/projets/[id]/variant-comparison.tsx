import Link from "next/link";

import { formatNombre } from "@/lib/format";
import type { VariantComparison } from "@/lib/projects";
import { cn } from "@/lib/utils";

/**
 * Ce projet face aux autres de sa variante.
 *
 * **Ce que la comparaison sert à trancher.** Un taux de conversion isolé ne dit
 * pas grand-chose — 17 %, est-ce bon ? Rapporté aux autres offres du même axe,
 * il devient une décision : renforcer celle-ci, ou basculer l'effort sur
 * l'autre. C'est précisément ce que la variante existe pour permettre, et ce
 * qui a justifié d'en faire une table de référence plutôt qu'un champ libre.
 *
 * La barre compare les taux entre eux, pas au total : chaque offre a son propre
 * volume, et rapporter au cumul dirait surtout laquelle est la plus grosse.
 *
 * Le projet courant est désigné par l'API et non déduit du libellé — deux
 * projets peuvent porter des noms très proches.
 */
export function VariantComparisonPanel({
  comparaison,
}: {
  comparaison: VariantComparison;
}) {
  if (comparaison.variant === null) {
    return (
      <p className="text-muted-foreground text-sm">
        Ce projet n&apos;a pas de variante. La variante est l&apos;axe qui permet
        de comparer deux offres entre elles ; elle s&apos;attribue depuis
        «&nbsp;Modifier&nbsp;».
      </p>
    );
  }

  if (comparaison.projets.length < 2) {
    return (
      <p className="text-muted-foreground text-sm">
        Seule offre de la variante «&nbsp;{comparaison.variant}&nbsp;». La
        comparaison s&apos;affichera dès qu&apos;un second projet partagera cet
        axe.
      </p>
    );
  }

  const meilleur = Math.max(
    1,
    ...comparaison.projets.map((p) => p.conversion_rate ?? 0),
  );

  return (
    <div className="space-y-3">
      <table className="w-full border-separate border-spacing-y-1.5 text-sm">
        <caption className="sr-only">
          Taux de conversion des projets de la variante {comparaison.variant}
        </caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Projet</th>
            <th scope="col">Taux de conversion</th>
          </tr>
        </thead>
        <tbody>
          {comparaison.projets.map((projet) => (
            <tr key={projet.project_id}>
              <th scope="row" className="w-36 max-w-36 pr-3 text-left font-normal">
                {projet.courant ? (
                  <span className="block truncate font-medium">
                    {projet.project}
                  </span>
                ) : (
                  <Link
                    href={`/projets/${projet.project_id}`}
                    className="hover:text-foreground block truncate underline-offset-2 hover:underline"
                  >
                    {projet.project}
                  </Link>
                )}
                <span className="text-muted-foreground block text-xs">
                  {formatNombre(projet.total)} prospect
                  {projet.total > 1 ? "s" : ""}
                </span>
              </th>

              <td>
                <div className="flex items-center gap-2">
                  <div className="bg-muted h-5 flex-1 overflow-hidden rounded-sm">
                    <div
                      className={cn(
                        "h-full rounded-sm",
                        // Le projet courant garde la couleur d'action ; les
                        // autres sont en retrait. Les mettre au même niveau
                        // obligerait à relire les libellés pour se situer.
                        projet.courant ? "bg-primary" : "bg-muted-foreground/40",
                      )}
                      style={{
                        width: `${Math.max(((projet.conversion_rate ?? 0) / meilleur) * 100, projet.conversion_rate ? 2 : 0)}%`,
                      }}
                    />
                  </div>
                  <span
                    className={cn(
                      "w-12 shrink-0 text-right tabular-nums",
                      projet.courant ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {projet.conversion_rate === null
                      ? "—"
                      : `${formatNombre(projet.conversion_rate)} %`}
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-muted-foreground border-t pt-3 text-xs leading-relaxed">
        Taux de conversion depuis l&apos;origine de chaque projet, et non sur
        une période : comparer deux offres sur trente jours favoriserait la plus
        récente, dont les dossiers n&apos;ont pas eu le temps de se conclure.
      </p>
    </div>
  );
}

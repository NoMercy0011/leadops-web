import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatNombre } from "@/lib/format";
import type { PerformanceRow } from "@/lib/reporting";

/**
 * Performance par projet ou par commercial.
 *
 * Un tableau et non un graphique : six mesures par ligne, dont deux taux. Un
 * graphique devrait en sacrifier quatre, ou en superposer six sur un même axe,
 * ce qui les rendrait toutes illisibles. Le tableau les donne exactement.
 */
export function PerformanceTable({
  lignes,
  colonne,
  avecVariante = false,
}: {
  lignes: PerformanceRow[];
  colonne: "project" | "user";
  avecVariante?: boolean;
}) {
  if (lignes.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune donnée sur cette période.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{colonne === "project" ? "Projet" : "Commercial"}</TableHead>
            {avecVariante ? <TableHead>Variante</TableHead> : null}
            <TableHead className="text-right">Prospects</TableHead>
            <TableHead className="text-right">Qualifiés</TableHead>
            <TableHead className="text-right">Convertis</TableHead>
            <TableHead className="text-right">Perdus</TableHead>
            <TableHead className="text-right">Qualification</TableHead>
            <TableHead className="text-right">Conversion</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lignes.map((ligne) => (
            <TableRow key={`${ligne.project_id ?? "p"}-${ligne.user_id ?? "u"}-${ligne[colonne]}`}>
              <TableCell className="font-medium">{ligne[colonne]}</TableCell>
              {avecVariante ? (
                <TableCell className="text-muted-foreground">
                  {ligne.variant ?? "—"}
                </TableCell>
              ) : null}
              <TableCell className="text-right tabular-nums">
                {formatNombre(ligne.total)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNombre(ligne.qualified)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNombre(ligne.converted)}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {formatNombre(ligne.lost)}
              </TableCell>
              {/* Un taux nul se lit « — » et non « 0 % » : sans prospect, il
                  n'y a rien à mesurer, et zéro laisserait croire à un échec. */}
              <TableCell className="text-right tabular-nums">
                {ligne.qualification_rate === null
                  ? "—"
                  : `${ligne.qualification_rate} %`}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {ligne.conversion_rate === null
                  ? "—"
                  : `${ligne.conversion_rate} %`}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

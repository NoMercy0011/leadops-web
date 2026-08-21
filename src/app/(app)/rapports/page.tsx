import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, Download, TrendingUp, UserCheck, Users } from "lucide-react";

import { ReportFilters } from "./report-filters";
import { PageHeader } from "@/components/page-header";
import { PerformanceTable } from "@/components/performance-table";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { listCompanyUsers, listProjects, listVariants } from "@/lib/projects";
import { getReport } from "@/lib/reporting";

export const metadata: Metadata = {
  title: "Rapports",
};

export default async function RapportsPage({
  searchParams,
}: PageProps<"/rapports">) {
  const user = await requireUser();

  // Les rapports agrègent l'activité d'une équipe : ils relèvent de
  // l'encadrement. Un commercial dispose de sa propre liste de prospects.
  if (user.role !== "admin_client" && user.role !== "manager") {
    notFound();
  }

  const params = await searchParams;
  const lire = (cle: string) =>
    typeof params[cle] === "string" ? params[cle] : undefined;

  const filtres = {
    project_id: Number(lire("project_id")) || undefined,
    variant_id: Number(lire("variant_id")) || undefined,
    user_id: Number(lire("user_id")) || undefined,
    from: lire("from"),
    to: lire("to"),
  };

  const [rapport, projets, variantes, utilisateurs] = await Promise.all([
    getReport(filtres),
    listProjects(),
    listVariants(),
    listCompanyUsers(),
  ]);

  const fuseau = rapport.period.timezone;

  // Les paramètres d'export reprennent exactement les filtres appliqués :
  // exporter autre chose que ce qui est à l'écran serait déroutant.
  const exportQuery = new URLSearchParams();
  for (const [cle, valeur] of Object.entries(filtres)) {
    if (valeur !== undefined) exportQuery.set(cle, String(valeur));
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Rapports"
        description={
          <>
            Du {formatDate(rapport.period.from, { timeZone: fuseau })} au{" "}
            {formatDate(rapport.period.to, { timeZone: fuseau })}. Les taux
            portent sur les prospects créés dans cette période.
          </>
        }
        actions={
          <Button asChild variant="outline">
            <a href={`/api/rapports/export?${exportQuery}`}>
              <Download className="size-4" aria-hidden />
              Exporter
            </a>
          </Button>
        }
      />

      <ReportFilters
        projets={projets.data}
        variantes={variantes}
        utilisateurs={utilisateurs.data}
        from={rapport.period.from.slice(0, 10)}
        to={rapport.period.to.slice(0, 10)}
      />

      {/* Sept tuiles de même poids mêlaient les comptes et les taux, sans
          qu'aucune hiérarchie ne distingue le résultat de ses composantes. Un
          rapport se lit dans l'autre sens : on regarde d'abord ce qu'il donne,
          ensuite comment on y est arrivé. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          className="lg:col-span-2"
          taille="lg"
          label="Taux de conversion"
          valeur={rapport.rates.conversion}
          suffixe="%"
          detail={`${rapport.totals.converted} converti${rapport.totals.converted > 1 ? "s" : ""} sur ${rapport.totals.prospects} prospect${rapport.totals.prospects > 1 ? "s" : ""} créé${rapport.totals.prospects > 1 ? "s" : ""} dans la période.`}
          icon={TrendingUp}
          accent="success"
        />

        {/* Le taux de qualification explique le précédent : un mauvais taux de
            conversion sur des prospects mal qualifiés ne se corrige pas au
            même endroit qu'un mauvais taux sur des prospects bien qualifiés. */}
        <StatTile
          label="Taux de qualification"
          valeur={rapport.rates.qualification}
          suffixe="%"
          detail={`${rapport.totals.qualified} qualifié${rapport.totals.qualified > 1 ? "s" : ""}`}
          icon={TrendingUp}
        />

        <StatTile
          label="Taux de perte"
          valeur={rapport.rates.loss}
          suffixe="%"
          detail={`${rapport.totals.lost} perdu${rapport.totals.lost > 1 ? "s" : ""}`}
        />
      </div>

      {/* Le volume brut de la période : ce sont les dénominateurs des taux
          ci-dessus, pas des résultats en eux-mêmes. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile
          taille="sm"
          label="Prospects créés"
          valeur={rapport.totals.prospects}
          icon={Users}
        />
        <StatTile
          taille="sm"
          label="Contactés"
          valeur={rapport.totals.contacted}
          detail="Au moins une interaction"
          icon={UserCheck}
        />
        <StatTile
          taille="sm"
          label="Qualifiés"
          valeur={rapport.totals.qualified}
          detail="Jalon acquis, même si perdu ensuite"
        />
        <StatTile
          taille="sm"
          label="Rendez-vous"
          valeur={rapport.totals.appointments}
          icon={CalendarDays}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance par projet</CardTitle>
          <CardDescription>
            La variante est l&apos;axe de comparaison entre offres.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <PerformanceTable
            lignes={rapport.by_project}
            colonne="project"
            avecVariante
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance par commercial</CardTitle>
          <CardDescription>
            Les prospects non affectés forment une ligne à part : les écarter
            ferait mentir le total.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0">
          <PerformanceTable lignes={rapport.by_user} colonne="user" />
        </CardContent>
      </Card>
    </div>
  );
}

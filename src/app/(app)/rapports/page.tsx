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

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile label="Prospects" valeur={rapport.totals.prospects} icon={Users} />
        <StatTile
          label="Contactés"
          valeur={rapport.totals.contacted}
          detail="Au moins une interaction"
          icon={UserCheck}
        />
        <StatTile
          label="Rendez-vous"
          valeur={rapport.totals.appointments}
          icon={CalendarDays}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Qualifiés"
          valeur={rapport.totals.qualified}
          detail="Jalon acquis, même si perdu ensuite"
        />
        <StatTile
          label="Taux de qualification"
          valeur={rapport.rates.qualification}
          suffixe="%"
          icon={TrendingUp}
        />
        <StatTile
          label="Convertis"
          valeur={rapport.totals.converted}
          accent="success"
        />
        <StatTile
          label="Taux de conversion"
          valeur={rapport.rates.conversion}
          suffixe="%"
          icon={TrendingUp}
          accent="success"
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

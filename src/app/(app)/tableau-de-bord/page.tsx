import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarClock,
  FolderKanban,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { PerformanceTable } from "@/components/performance-table";
import { StageDistribution } from "@/components/stage-distribution";
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
import { prenom } from "@/lib/format";
import { getDashboard } from "@/lib/reporting";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function TableauDeBordPage() {
  const user = await requireUser();
  const tableau = await getDashboard();

  const enCours =
    tableau.prospects.total - tableau.prospects.converted - tableau.prospects.lost;

  return (
    <div className="space-y-6">
      <PageHeader
        titre={`Bonjour ${prenom(user.name)}`}
        description={
          <>
            Vue d&apos;ensemble de votre activité
            {user.company ? ` chez ${user.company.name}` : ""}.
          </>
        }
        actions={
          <Button asChild variant="outline">
            <Link href="/rapports">Rapports détaillés</Link>
          </Button>
        }
      />

      {/* Les indicateurs du §2 sont des nombres, pas des courbes : une tuile
          les donne exactement, là où un graphique les approximerait. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Projets actifs"
          valeur={tableau.active_projects}
          icon={FolderKanban}
        />
        <StatTile
          label="Prospects"
          valeur={tableau.prospects.total}
          detail={`${enCours} en cours`}
          icon={Users}
        />
        <StatTile
          label="Taux de conversion"
          valeur={tableau.conversion_rate}
          suffixe="%"
          detail={`${tableau.prospects.converted} converti${tableau.prospects.converted > 1 ? "s" : ""}`}
          icon={TrendingUp}
          accent="success"
        />
        <StatTile
          label="Perdus"
          valeur={tableau.prospects.lost}
          icon={TriangleAlert}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Rendez-vous du jour"
          valeur={tableau.appointments.today}
          detail={`Fuseau ${tableau.timezone}`}
          icon={CalendarCheck}
        />
        <StatTile
          label="À venir"
          valeur={tableau.appointments.upcoming}
          icon={CalendarClock}
        />
        <StatTile
          label="À clôturer"
          valeur={tableau.appointments.overdue}
          detail="Passés et encore planifiés"
          icon={TriangleAlert}
          // Le seul indicateur qui appelle une action immédiate : c'est ce qui
          // justifie de le mettre en évidence, et rien d'autre sur cet écran.
          accent="warning"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Répartition par étape</CardTitle>
            <CardDescription>
              Tous projets confondus. Les étapes étant propres à chaque projet,
              une même position peut recouvrir des libellés différents.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StageDistribution etapes={tableau.by_stage} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance par projet</CardTitle>
            <CardDescription>
              Depuis l&apos;origine. Le détail par période est dans les
              rapports.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <PerformanceTable
              lignes={tableau.by_project}
              colonne="project"
              avecVariante
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

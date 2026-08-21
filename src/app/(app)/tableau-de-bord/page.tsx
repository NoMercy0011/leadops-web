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

  // Les rapports relèvent de l'encadrement : la page renvoie « introuvable »
  // à un commercial. Lui proposer le bouton conduisait donc à une impasse —
  // la navigation latérale masque déjà l'entrée, le tableau de bord ne le
  // faisait pas.
  const encadrement = user.role === "admin_client" || user.role === "manager";

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
          encadrement ? (
            <Button asChild variant="outline">
              <Link href="/rapports">Rapports détaillés</Link>
            </Button>
          ) : undefined
        }
      />

      {/* Les indicateurs du §2 sont des nombres, pas des courbes : une tuile
          les donne exactement, là où un graphique les approximerait.

          Ils étaient rendus sur deux rangées de tuiles identiques — sept
          nombres de même poids, qu'il fallait lire un à un pour trouver celui
          qu'on venait chercher. Ils sont maintenant répartis sur trois
          paliers, du plus décisif au simple contexte. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* La dominante, et une seule. C'est la question qu'on se pose en
            ouvrant cet écran : est-ce que ça convertit ? Tout le reste sert à
            l'expliquer. `null` s'affiche « — » : sans prospect, il n'y a pas
            0 % de conversion, il n'y a rien à mesurer. */}
        <StatTile
          className="lg:col-span-2"
          taille="lg"
          label="Taux de conversion"
          valeur={tableau.conversion_rate}
          suffixe="%"
          detail={`${tableau.prospects.converted} converti${tableau.prospects.converted > 1 ? "s" : ""} sur ${tableau.prospects.total} prospect${tableau.prospects.total > 1 ? "s" : ""} depuis l'origine.`}
          icon={TrendingUp}
          accent="success"
        />

        {/* Le stock de travail. Il était relégué en ligne de détail sous le
            total, alors que c'est lui qu'on travaille : les convertis et les
            perdus sont sortis du pipeline. */}
        <StatTile
          label="Prospects en cours"
          valeur={enCours}
          detail={`${tableau.prospects.total} au total`}
          icon={Users}
        />

        <StatTile
          label="À clôturer"
          valeur={tableau.appointments.overdue}
          detail="Rendez-vous passés, encore planifiés"
          icon={TriangleAlert}
          // Le seul indicateur qui appelle une action immédiate : c'est ce qui
          // justifie de le mettre en évidence, et rien d'autre sur cet écran.
          accent="warning"
        />
      </div>

      {/* Le contexte. Exact et utile, mais ce n'est pas ce qu'on vient
          chercher : d'où le palier le plus discret. */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatTile
          taille="sm"
          label="Rendez-vous du jour"
          valeur={tableau.appointments.today}
          detail={`Fuseau ${tableau.timezone}`}
          icon={CalendarCheck}
        />
        <StatTile
          taille="sm"
          label="Rendez-vous à venir"
          valeur={tableau.appointments.upcoming}
          icon={CalendarClock}
        />
        <StatTile
          taille="sm"
          label="Projets actifs"
          valeur={tableau.active_projects}
          icon={FolderKanban}
        />
        <StatTile
          taille="sm"
          label="Prospects perdus"
          valeur={tableau.prospects.lost}
          icon={TriangleAlert}
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

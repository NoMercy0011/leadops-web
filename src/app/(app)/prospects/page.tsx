import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { Archive, Columns3, Users } from "lucide-react";

import { CreateProspectDialog } from "./create-prospect-dialog";
import { ImportDialog } from "./import-dialog";
import { ProspectFilters } from "./prospect-filters";
import { ProspectSummaryStrip } from "./prospect-summary";
import { ProspectTable } from "./prospect-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { lienExportProspects } from "@/lib/export-prospects";
import { getOptionsFiltres } from "@/lib/options";
import { PaginationListe } from "@/components/pagination-liste";
import { requireUser } from "@/lib/dal";
import { listProspects } from "@/lib/prospects";
import { getProject, listCompanyUsers, listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Prospects",
};

export default async function ProspectsPage({
  searchParams,
}: PageProps<"/prospects">) {
  const user = await requireUser();
  const filtres = await searchParams;

  const projectId = Number(filtres.project_id) || undefined;
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const [prospects, projets, utilisateurs, options, projetActif] = await Promise.all([
    listProspects({
      project_id: projectId,
      page: Math.max(1, Number.parseInt(String(filtres.page ?? "1"), 10) || 1),
      stage_id: Number(filtres.stage_id) || undefined,
      assigned_user_id:
        typeof filtres.assigned_user_id === "string"
          ? filtres.assigned_user_id
          : undefined,
      search: typeof filtres.search === "string" ? filtres.search : undefined,
      // L'API écarte les archivés par défaut ; les demander explicitement est
      // le seul moyen de les revoir.
      archived: filtres.archived === "1" ? "1" : undefined,
    }),
    listProjects(),
    // La liste des commerciaux ne sert qu'aux actions d'encadrement.
    encadrement ? listCompanyUsers() : Promise.resolve({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
    // Les filtres et la réaffectation lisent tout le périmètre, sans la borne
    // de 25 des listes paginées (lot 10, R2) ; les boîtes de création et
    // d'import gardent les projets complets.
    getOptionsFiltres(),
    // Les étapes du filtre viennent du projet lui-même, et non de la liste
    // paginée, où un 26e projet n'apparaît pas (revue du lot 10).
    projectId ? getProject(projectId).catch(() => undefined) : Promise.resolve(undefined),
  ]);

  const aucunProjet = projets.data.length === 0;
  const archives = filtres.archived === "1";

  // Les filtres courants, pour que les tuiles cliquables du résumé restreignent
  // la sélection au lieu de la remplacer.
  // Sans `page` (revue du lot 10) : changer de filtre repart de la première
  // page, faute de quoi la page 5 d'un nouveau filtre d'une seule page
  // s'affichait vide.
  const filtresActifs = new URLSearchParams(
    Object.entries(filtres).flatMap(([cle, valeur]) =>
      cle !== "page" && typeof valeur === "string" && valeur !== "" ? [[cle, valeur]] : [],
    ),
  );

  // Une page au-delà de la dernière (`?page=999`) revient à la dernière
  // (revue du lot 10) : l'écran tombait sur l'état vide, sans pagination.
  if (prospects.data.length === 0 && prospects.meta.total > 0) {
    const suivants = new URLSearchParams(filtresActifs);
    suivants.set("page", String(prospects.meta.last_page));
    redirect(`${"/prospects"}?${suivants.toString()}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Prospects"
        description={
          encadrement
            ? "Les prospects de votre périmètre, y compris ceux qui ne sont affectés à personne."
            : "Vos prospects, et ceux qui restent à distribuer."
        }
        actions={
          aucunProjet ? undefined : (
            <>
              <Button asChild variant="outline">
                <Link
                  href={`/prospects/kanban${projectId ? `?project_id=${projectId}` : ""}`}
                >
                  <Columns3 className="size-4" aria-hidden />
                  Kanban
                </Link>
              </Button>
              {encadrement ? <ImportDialog projets={projets.data} /> : null}
              <Button asChild variant={archives ? "secondary" : "outline"}>
                <Link href={archives ? "/prospects" : "/prospects?archived=1"}>
                  <Archive className="size-4" aria-hidden />
                  {/* Mêmes libellés que l'onglet du projet (décision P4). */}
                  {archives ? "Voir les actifs" : "Voir les archivés"}
                </Link>
              </Button>
              <Button asChild variant="outline">
                {/* Tous les filtres affichés (revue du lot 9, F17). */}
                <a href={lienExportProspects(filtres)}>Exporter</a>
              </Button>
              <CreateProspectDialog
                projets={projets.data}
                utilisateurs={utilisateurs.data}
              />
            </>
          )
        }
      />

      {aucunProjet ? (
        <EmptyState
          icon={Users}
          titre="Aucun projet, donc aucun prospect"
          description="Un prospect appartient toujours à un projet, qui définit son pipeline et son questionnaire. Commencez par créer un projet."
        />
      ) : (
        <>
          {/* Les chiffres avant la liste : ils disent où porter l'attention,
              la liste dit sur qui. L'ordre inverse obligerait à parcourir le
              tableau pour découvrir qu'il y a des relances en retard. */}
          <ProspectSummaryStrip
            resume={prospects.summary}
            filtres={filtresActifs}
          />

          <ProspectFilters
            projets={options.projects}
            utilisateurs={encadrement ? options.users : []}
            etapes={projetActif?.stages ?? []}
            facettes={prospects.facets}
            parametres={filtresActifs}
          />

          {prospects.data.length === 0 ? (
            <EmptyState
              icon={Users}
              titre="Aucun prospect ne correspond"
              description="Ajustez les filtres, ou ajoutez un premier prospect à ce projet."
            />
          ) : (
            <>
<ProspectTable
              prospects={prospects.data}
              utilisateurs={options.users}
              peutReaffecter={encadrement}
              fuseau={user.company?.timezone}
              total={prospects.meta.total}
            />
            <PaginationListe
              base={"/prospects"}
              filtres={filtres}
              page={prospects.meta.current_page}
              derniere={prospects.meta.last_page}
              total={prospects.meta.total}
            />
</>
          )}
        </>
      )}
    </div>
  );
}

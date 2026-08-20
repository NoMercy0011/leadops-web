import type { Metadata } from "next";
import { Users } from "lucide-react";

import { CreateProspectDialog } from "./create-prospect-dialog";
import { ImportDialog } from "./import-dialog";
import { ProspectFilters } from "./prospect-filters";
import { ProspectTable } from "./prospect-table";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { listProspects } from "@/lib/prospects";
import { listCompanyUsers, listProjects } from "@/lib/projects";

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

  const [prospects, projets, utilisateurs] = await Promise.all([
    listProspects({
      project_id: projectId,
      stage_id: Number(filtres.stage_id) || undefined,
      assigned_user_id:
        typeof filtres.assigned_user_id === "string"
          ? filtres.assigned_user_id
          : undefined,
      search: typeof filtres.search === "string" ? filtres.search : undefined,
    }),
    listProjects(),
    // La liste des commerciaux ne sert qu'aux actions d'encadrement.
    encadrement ? listCompanyUsers() : Promise.resolve({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  ]);

  const projetActif = projectId
    ? projets.data.find((p) => p.id === projectId)
    : undefined;

  const aucunProjet = projets.data.length === 0;

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
              {encadrement ? <ImportDialog projets={projets.data} /> : null}
              <Button asChild variant="outline">
                <a
                  href={`/api/prospects/export${projectId ? `?project_id=${projectId}` : ""}`}
                >
                  Exporter
                </a>
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
          <ProspectFilters
            projets={projets.data}
            utilisateurs={utilisateurs.data}
            etapes={projetActif?.stages ?? []}
          />

          {prospects.data.length === 0 ? (
            <EmptyState
              icon={Users}
              titre="Aucun prospect ne correspond"
              description="Ajustez les filtres, ou ajoutez un premier prospect à ce projet."
            />
          ) : (
            <ProspectTable
              prospects={prospects.data}
              utilisateurs={utilisateurs.data}
              peutReaffecter={encadrement}
              fuseau={user.company?.timezone}
              total={prospects.meta.total}
            />
          )}
        </>
      )}
    </div>
  );
}

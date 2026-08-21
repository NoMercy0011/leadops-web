import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { List, Users } from "lucide-react";

import { KanbanBoard } from "./kanban-board";
import { ProjectPicker } from "./project-picker";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { listProspects } from "@/lib/prospects";
import { getProject, listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Kanban",
};

export default async function KanbanPage({
  searchParams,
}: PageProps<"/prospects/kanban">) {
  const user = await requireUser();
  const params = await searchParams;

  const projets = await listProjects();

  if (projets.data.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader titre="Kanban" />
        <EmptyState
          icon={Users}
          titre="Aucun projet"
          description="Le kanban affiche le pipeline d'un projet : il faut donc en créer un d'abord."
        />
      </div>
    );
  }

  // Le kanban porte sur **un** projet : les étapes lui appartiennent, et
  // juxtaposer les colonnes de plusieurs pipelines produirait un tableau
  // dont les colonnes ne signifieraient plus rien.
  const projectId =
    Number(typeof params.project_id === "string" ? params.project_id : "") ||
    projets.data[0].id;

  let projet;
  let prospects;

  try {
    [projet, prospects] = await Promise.all([
      getProject(projectId),
      listProspects({ project_id: projectId, per_page: 200 }),
    ]);
  } catch (error) {
    // Un `project_id` périmé dans un signet est un cas ordinaire, pas une
    // panne : le laisser remonter le journaliserait comme erreur serveur.
    // 403 et 404 mènent au même écran, comme partout ailleurs — les
    // distinguer confirmerait l'existence d'un projet à qui n'y a pas accès.
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Kanban"
        description="Faites glisser une carte pour changer son étape. Le déplacement est aussi accessible au clavier."
        actions={
          <>
            <ProjectPicker projets={projets.data} actif={projectId} />
            <Button asChild variant="outline">
              <Link href={`/prospects?project_id=${projectId}`}>
                <List className="size-4" aria-hidden />
                Vue liste
              </Link>
            </Button>
          </>
        }
      />

      {prospects.data.length === 0 ? (
        <EmptyState
          icon={Users}
          titre="Aucun prospect sur ce projet"
          description="Ajoutez un prospect depuis la vue liste, ou importez un fichier."
        />
      ) : (
        <>
          <KanbanBoard
            stages={projet.stages ?? []}
            prospects={prospects.data}
            // Un commercial déplace ses propres prospects : c'est son travail
            // quotidien. L'API refusera de toute façon ceux qui sortent de son
            // périmètre.
            editable={user.role !== "super_admin"}
          />

          {prospects.meta.total > prospects.data.length ? (
            <p className="text-muted-foreground text-xs">
              {prospects.data.length} cartes affichées sur {prospects.meta.total}.
              Le kanban se prête mal aux grands volumes — affinez avec la vue
              liste et ses filtres.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

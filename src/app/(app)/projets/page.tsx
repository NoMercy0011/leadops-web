import type { Metadata } from "next";
import Link from "next/link";
import { FolderKanban } from "lucide-react";

import { CreateProjectDialog } from "./create-project-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StageChip } from "@/components/stage-chip";
import { StatusBadge, type Tone } from "@/components/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { listProjects, listVariants } from "@/lib/projects";
import { requireUser } from "@/lib/dal";
import type { ProjectStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projets",
};

/**
 * Le statut d'un projet est un enum côté API — contrairement aux étapes de
 * pipeline. Le mapper ici est donc légitime.
 */
const TONS: Record<ProjectStatus, Tone> = {
  active: "success",
  suspended: "warning",
  completed: "neutral",
};

export default async function ProjetsPage() {
  const user = await requireUser();

  const [projets, variantes] = await Promise.all([
    listProjects(),
    listVariants(),
  ]);

  const peutCreer = user.role === "admin_client";

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Projets"
        description={
          user.role === "admin_client"
            ? "Chaque projet porte sa cible, sa variante, son questionnaire et son propre pipeline."
            : "Les projets sur lesquels vous êtes affecté."
        }
        actions={
          peutCreer ? <CreateProjectDialog variantes={variantes} /> : undefined
        }
      />

      {projets.data.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          titre={peutCreer ? "Aucun projet pour l'instant" : "Aucun projet affecté"}
          description={
            peutCreer
              ? "Créez un premier projet : son pipeline est posé d'office et reste entièrement modifiable."
              : "Votre administrateur ne vous a pas encore affecté à un projet."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projets.data.map((projet) => (
            <Card key={projet.id} className="transition-colors hover:border-ring">
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/projets/${projet.id}`}
                      className="font-heading block truncate text-base font-semibold hover:underline"
                    >
                      {projet.name}
                    </Link>
                    {projet.product ? (
                      <p className="text-muted-foreground truncate text-sm">
                        {projet.product}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge tone={TONS[projet.status]}>
                    {projet.status_label}
                  </StatusBadge>
                </div>

                <dl className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="sr-only">Variante</dt>
                    <dd>{projet.variant?.name ?? "Sans variante"}</dd>
                  </div>
                  <div className="text-right">
                    <dt className="sr-only">Commerciaux</dt>
                    <dd>
                      {projet.members_count ?? 0} commercial
                      {(projet.members_count ?? 0) > 1 ? "aux" : ""}
                    </dd>
                  </div>
                </dl>

                {projet.stages && projet.stages.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 border-t pt-3">
                    {/* Les quatre premières étapes suffisent à donner la forme
                        du pipeline sans encombrer la carte. */}
                    {projet.stages.slice(0, 4).map((stage) => (
                      <StageChip key={stage.id} stage={stage} />
                    ))}
                    {projet.stages.length > 4 ? (
                      <span className="text-muted-foreground self-center text-xs">
                        +{projet.stages.length - 4}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {variantes.length === 0 && peutCreer ? (
        <p className="text-muted-foreground text-sm">
          Aucune variante définie.{" "}
          <Link href="/parametres/variantes" className="text-info underline">
            En créer une
          </Link>{" "}
          — c&apos;est l&apos;axe qui permettra de comparer vos offres dans les
          rapports.
        </p>
      ) : null}
    </div>
  );
}

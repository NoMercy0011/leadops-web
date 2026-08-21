import type { Metadata } from "next";
import Link from "next/link";
import { Archive, FolderKanban } from "lucide-react";

import { CreateProjectDialog } from "./create-project-dialog";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StageChip } from "@/components/stage-chip";
import { StatusBadge, type Tone } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
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
  archived: "neutral",
};

export default async function ProjetsPage({
  searchParams,
}: PageProps<"/projets">) {
  const user = await requireUser();
  const params = await searchParams;

  // L'API écarte les projets archivés par défaut ; les demander explicitement
  // est le seul moyen de les revoir. C'est ce que fait cette bascule — sans
  // elle, archiver reviendrait à perdre le projet de vue pour de bon.
  const archives = params.status === "archived";

  const [projets, variantes] = await Promise.all([
    listProjects(archives ? { status: "archived" } : {}),
    listVariants(),
  ]);

  const peutCreer = user.role === "admin_client";

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Projets"
        description={
          peutCreer
            ? "Chaque projet porte sa cible, sa variante, son questionnaire et son propre pipeline."
            : // Sans cette phrase, un manager cherche un bouton de création qui
              // n'apparaîtra jamais et croit à un défaut d'affichage.
              "Les projets sur lesquels vous êtes affecté. Leur création revient à l'Admin Client : elle engage le pipeline et le questionnaire de toute l'équipe."
        }
        actions={
          <>
            <Button asChild variant={archives ? "secondary" : "outline"}>
              <Link href={archives ? "/projets" : "/projets?status=archived"}>
                <Archive className="size-4" aria-hidden />
                {archives ? "Projets actifs" : "Archivés"}
              </Link>
            </Button>
            {peutCreer ? <CreateProjectDialog variantes={variantes} /> : null}
          </>
        }
      />

      {projets.data.length === 0 ? (
        <EmptyState
          icon={archives ? Archive : FolderKanban}
          titre={
            archives
              ? "Aucun projet archivé"
              : peutCreer
                ? "Aucun projet pour l'instant"
                : "Aucun projet affecté"
          }
          description={
            archives
              ? "Les projets que vous archiverez apparaîtront ici. Rien n'y est supprimé."
              : peutCreer
                ? "Créez un premier projet : son pipeline est posé d'office et reste entièrement modifiable."
                : "Votre administrateur ne vous a pas encore affecté à un projet."
          }
          // L'écran vide invitait à créer un projet sans porter le bouton : il
          // fallait remonter à l'en-tête pour le trouver. Un écran vide dont
          // tout le propos est l'absence doit porter l'action qui la comble.
          action={
            peutCreer && !archives ? (
              <CreateProjectDialog variantes={variantes} />
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projets.data.map((projet) => (
            // La carte entière est cliquable, pas seulement le titre : une
            // surface qui réagit au survol mais n'ouvre rien sous le curseur
            // est une promesse non tenue. Le lien reste unique — il s'étend
            // par un pseudo-élément — pour ne pas répéter la même destination
            // trois fois dans l'ordre de tabulation.
            <Card
              key={projet.id}
              className="hover:border-ring hover:shadow-raised duration-(--duration-base) ease-brand relative transition-[color,background-color,border-color,box-shadow]"
            >
              <CardContent className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <Link
                      href={`/projets/${projet.id}`}
                      className="font-heading block truncate text-base font-semibold after:absolute after:inset-0 after:rounded-xl hover:underline focus-visible:outline-none after:focus-visible:ring-3 after:focus-visible:ring-ring/50"
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

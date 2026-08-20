import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PipelineEditor } from "./pipeline-editor";
import { QuestionnaireBuilder } from "./questionnaire-builder";
import { TeamEditor } from "./team-editor";
import { LienRetour } from "@/components/lien-retour";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type Tone } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { getProject, listCompanyUsers } from "@/lib/projects";
import { listQuestions } from "@/lib/questionnaire";
import type { ProjectStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projet",
};

const TONS: Record<ProjectStatus, Tone> = {
  active: "success",
  suspended: "warning",
  completed: "neutral",
};

export default async function FicheProjetPage({
  params,
}: PageProps<"/projets/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    notFound();
  }

  const editable = user.role === "admin_client";

  let projet;

  try {
    projet = await getProject(projectId);
  } catch (error) {
    // 403 et 404 mènent au même écran : les distinguer confirmerait
    // l'existence d'un projet à qui n'y a pas accès.
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }

  // La liste des candidats n'a de sens que pour qui peut modifier l'équipe.
  const [candidats, questions] = await Promise.all([
    editable ? listCompanyUsers().then((page) => page.data) : Promise.resolve([]),
    listQuestions(projectId),
  ]);

  return (
    <div className="space-y-6">
      <LienRetour href="/projets" label="Tous les projets" />

      <PageHeader
        titre={projet.name}
        description={
          <>
            {projet.product ?? "Produit non renseigné"}
            {projet.target ? ` · Cible : ${projet.target}` : null}
            {projet.variant ? ` · Variante : ${projet.variant.name}` : null}
          </>
        }
        actions={
          <StatusBadge tone={TONS[projet.status]}>
            {projet.status_label}
          </StatusBadge>
        }
      />

      {!projet.accepts_new_prospects ? (
        <Notice variant="warning" titre="Projet fermé aux nouveaux prospects">
          Les données existantes restent consultables et exportables.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Pipeline</CardTitle>
            <CardDescription>
              Les étapes sont propres à ce projet. Modifier ce pipeline
              n&apos;affecte aucun autre.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineEditor
              projectId={projet.id}
              stages={projet.stages ?? []}
              editable={editable}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Questionnaire</CardTitle>
              <CardDescription>
                Questions de qualification posées sur chaque prospect de ce
                projet. Elles se configurent ici, sans déploiement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionnaireBuilder
                projectId={projet.id}
                questions={questions}
                editable={editable}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Équipe</CardTitle>
              <CardDescription>
                Les commerciaux affectés voient ce projet et ses prospects.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {editable ? (
                <TeamEditor
                  projectId={projet.id}
                  candidats={candidats}
                  membresInitiaux={(projet.members ?? []).map((m) => m.id)}
                  editable
                />
              ) : (
                <ul className="space-y-2 text-sm">
                  {(projet.members ?? []).map((membre) => (
                    <li key={membre.id} className="flex justify-between gap-2">
                      <span className="truncate">{membre.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {membre.role_label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Créé le</span>
                <span>
                  {formatDate(projet.created_at, {
                    timeZone: user.company?.timezone,
                  })}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Étapes</span>
                <span>{projet.stages?.length ?? 0}</span>
              </div>
              {projet.description ? (
                <p className="text-muted-foreground border-t pt-3 leading-relaxed">
                  {projet.description}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

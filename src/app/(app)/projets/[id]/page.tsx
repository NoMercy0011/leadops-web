import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PipelineEditor } from "./pipeline-editor";
import { ImportDialog } from "@/app/(app)/prospects/import-dialog";
import { DataQualityPanel } from "./data-quality";
import { PipelineHealthPanel } from "./pipeline-health";
import { ProjectJournal } from "./project-journal";
import { VariantComparisonPanel } from "./variant-comparison";
import { EditProjectDialog, ProjectStatusActions } from "./project-actions";
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
import {
  getDataQuality,
  getPipelineHealth,
  getProject,
  getVariantComparison,
  listCompanyUsers,
  listProjectActivities,
  listVariants,
} from "@/lib/projects";
import { listQuestions } from "@/lib/questionnaire";
import type { ProjectStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projet",
};

const TONS: Record<ProjectStatus, Tone> = {
  active: "success",
  suspended: "warning",
  completed: "neutral",
  archived: "neutral",
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

  // Candidats et variantes ne servent qu'à qui peut modifier : les charger
  // pour un commercial serait deux requêtes pour rien.
  // La santé du pipeline est réservée à l'encadrement côté API : la demander
  // pour un commercial produirait un 403 à chaque visite de la fiche.
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const [candidats, variantes, questions, sante, qualite, journal, comparaison] =
    await Promise.all([
      editable
        ? listCompanyUsers().then((page) => page.data)
        : Promise.resolve([]),
      editable ? listVariants() : Promise.resolve([]),
      listQuestions(projectId),
      encadrement ? getPipelineHealth(projectId) : Promise.resolve(null),
      encadrement ? getDataQuality(projectId) : Promise.resolve(null),
      encadrement ? listProjectActivities(projectId) : Promise.resolve([]),
      encadrement ? getVariantComparison(projectId) : Promise.resolve(null),
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
          <>
            <StatusBadge tone={TONS[projet.status]}>
              {projet.status_label}
            </StatusBadge>

            {/* L'import n'est proposé que si le projet accepte des prospects :
                l'API le refuse désormais sur un projet suspendu, terminé ou
                archivé, et offrir le bouton mènerait à un échec annoncé. */}
            {encadrement && projet.accepts_new_prospects ? (
              <ImportDialog projet={projet} taille="sm" />
            ) : null}

            {/* Modifier et changer d'état sont réservés à l'Admin Client par
                la policy. Le front masque, l'API tranche. */}
            {editable ? (
              <>
                <EditProjectDialog projet={projet} variantes={variantes} />
                <ProjectStatusActions projet={projet} />
              </>
            ) : null}
          </>
        }
      />

      {projet.status === "archived" ? (
        <Notice variant="info" titre="Projet archivé">
          Il ne figure plus dans la liste des projets et n&apos;accepte plus de
          nouveaux prospects. Ses données restent intactes — rien n&apos;a été
          supprimé, et l&apos;archivage se défait.
        </Notice>
      ) : !projet.accepts_new_prospects ? (
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
          {/* Les chiffres avant l'éditeur : on regarde d'abord où ça bloque,
              on ne remanie les étapes qu'ensuite. */}
          {sante ? (
            <CardContent className="border-b pb-6">
              <PipelineHealthPanel sante={sante} />
            </CardContent>
          ) : null}

          <CardContent className={sante ? "pt-6" : undefined}>
            <PipelineEditor
              projectId={projet.id}
              stages={projet.stages ?? []}
              editable={editable}
            />
          </CardContent>
        </Card>

        <div className="space-y-6">
          {comparaison ? (
            <Card>
              <CardHeader>
                <CardTitle>Face aux autres offres</CardTitle>
                <CardDescription>
                  Un taux de conversion isolé ne dit rien ; rapporté aux autres
                  projets du même axe, il devient une décision.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VariantComparisonPanel comparaison={comparaison} />
              </CardContent>
            </Card>
          ) : null}

          {/* La qualité des données ouvre le rail : c'est un constat sur le
              fichier, à lire avant d'en travailler le détail. */}
          {qualite ? (
            <Card>
              <CardHeader>
                <CardTitle>Qualité des données</CardTitle>
                <CardDescription>
                  Ces défauts n&apos;empêchent pas de travailler : ils faussent
                  des chiffres.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataQualityPanel qualite={qualite} />
              </CardContent>
            </Card>
          ) : null}

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

          {encadrement ? (
            <Card>
              <CardHeader>
                <CardTitle>Journal du projet</CardTitle>
                <CardDescription>
                  Modifications du pipeline, du questionnaire et de
                  l&apos;équipe. Les lignes signalées changent le sens des
                  données déjà saisies.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProjectJournal
                  activites={journal}
                  fuseau={user.company?.timezone}
                />
              </CardContent>
            </Card>
          ) : null}

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

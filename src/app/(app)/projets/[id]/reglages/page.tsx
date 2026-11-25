import Link from "next/link";
import { PipelineEditor } from "../pipeline-editor";
import { ProjectJournal } from "../project-journal";
import { QuestionnaireBuilder } from "../questionnaire-builder";
import { TeamEditor } from "../team-editor";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { listUtilisateursOptions } from "@/lib/options";
import { getProject, listProjectActivities } from "@/lib/projects";
import { listQuestions } from "@/lib/questionnaire";

const AUCUN_UTILISATEUR = { data: [] };

/**
 * Configuration du projet.
 *
 * Tout ce qui change la *forme* des données plutôt que les données elles-mêmes
 * — les étapes du pipeline, les questions de qualification, l'équipe — et le
 * journal qui en garde trace. Ces trois réglages ont en commun de modifier
 * rétroactivement la lecture des chiffres déjà collectés : renommer une étape
 * ou rendre une question obligatoire change le sens de ce qui a été saisi
 * avant. C'est pourquoi ils vivent ensemble, et à côté de leur journal.
 */
export default async function ReglagesDuProjetPage({
  params,
  searchParams,
}: PageProps<"/projets/[id]/reglages">) {
  const user = await requireUser();
  const [{ id }, recherche] = await Promise.all([params, searchParams]);
  const projectId = Number(id);
  // Page du journal (lot 9, contrat §5). Toute valeur douteuse retombe sur la
  // première page plutôt que de produire une erreur.
  const pageJournal = Math.max(1, Number.parseInt(String(recherche.journal ?? "1"), 10) || 1);

  const editable = user.role === "admin_client";
  const encadrement = editable || user.role === "manager";

  const [projet, questions, candidats, journal] = await Promise.all([
    getProject(projectId),
    listQuestions(projectId),
    // Les candidats ne servent qu'à qui peut modifier l'équipe.
    editable ? listUtilisateursOptions() : Promise.resolve(AUCUN_UTILISATEUR),
    encadrement ? listProjectActivities(projectId, pageJournal) : Promise.resolve(null),
  ]);

  // Un projet archivé est en lecture seule (règle R3, décision P7) : les
  // éditeurs s'affichent sans commande, l'API refuserait toute écriture.
  const modifiable = editable && projet.status !== "archived";

  return (
    <div className="space-y-6">
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
              editable={modifiable}
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
            {modifiable ? (
              <TeamEditor
                projectId={projet.id}
                candidats={candidats.data}
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Questionnaire</CardTitle>
          <CardDescription>
            Questions de qualification posées sur chaque prospect de ce projet.
            Elles se configurent ici, sans déploiement.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <QuestionnaireBuilder
            projectId={projet.id}
            questions={questions}
            editable={modifiable}
          />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {encadrement ? (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Journal du projet</CardTitle>
              <CardDescription>
                Modifications du pipeline, du questionnaire et de
                l&apos;équipe. Les lignes signalées changent le sens des données
                déjà saisies.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectJournal
                activites={journal?.data ?? []}
                fuseau={user.company?.timezone}
              />
              {journal && journal.meta.last_page > 1 ? (
                <nav
                  aria-label="Pages du journal"
                  className="text-muted-foreground mt-4 flex items-center justify-between gap-4 text-sm"
                >
                  {journal.meta.current_page > 1 ? (
                    <Link
                      href={`/projets/${projectId}/reglages?journal=${journal.meta.current_page - 1}`}
                      className="hover:text-foreground underline"
                    >
                      Plus récents
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span>
                    Page {journal.meta.current_page} sur {journal.meta.last_page} ·{" "}
                    {journal.meta.total} événements
                  </span>
                  {journal.meta.current_page < journal.meta.last_page ? (
                    <Link
                      href={`/projets/${projectId}/reglages?journal=${journal.meta.current_page + 1}`}
                      className="hover:text-foreground underline"
                    >
                      Plus anciens
                    </Link>
                  ) : (
                    <span />
                  )}
                </nav>
              ) : null}
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
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Questions</span>
              <span>{questions.length}</span>
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
  );
}

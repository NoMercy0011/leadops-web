import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

import { ActivityTimeline } from "./activity-timeline";
import {
  AssignSelector,
  NextActionForm,
  NoteForm,
  StageSelector,
} from "./prospect-actions";
import { LienRetour } from "@/components/lien-retour";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { formatDate, formatDistance } from "@/lib/format";
import { getProject, listCompanyUsers } from "@/lib/projects";
import { getProspect, listActivities } from "@/lib/prospects";
import { getQuestionnaire } from "@/lib/questionnaire";
import { QuestionnaireForm } from "./questionnaire-form";

export const metadata: Metadata = {
  title: "Prospect",
};

export default async function FicheProspectPage({
  params,
}: PageProps<"/prospects/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const prospectId = Number(id);

  if (!Number.isInteger(prospectId)) {
    notFound();
  }

  let prospect;

  try {
    prospect = await getProspect(prospectId);
  } catch (error) {
    // 403 et 404 mènent au même écran : les distinguer confirmerait
    // l'existence d'un prospect à qui n'y a pas accès.
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }

  const encadrement = user.role === "admin_client" || user.role === "manager";

  const [activites, projet, utilisateurs, questionnaire] = await Promise.all([
    listActivities(prospectId),
    // Le projet fournit le pipeline : la liste des étapes proposées doit être
    // celle de *son* projet, aucune autre.
    getProject(prospect.project_id),
    encadrement
      ? listCompanyUsers()
      : Promise.resolve({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
    getQuestionnaire(prospectId),
  ]);

  const fuseau = user.company?.timezone;
  const relanceEnRetard =
    prospect.next_action_at !== null &&
    new Date(prospect.next_action_at) < new Date();

  return (
    <div className="space-y-6">
      <LienRetour href="/prospects" label="Tous les prospects" />

      <PageHeader
        titre={prospect.full_name}
        description={
          <>
            {projet.name}
            {prospect.company_name ? ` · ${prospect.company_name}` : null}
            {prospect.source ? ` · Source : ${prospect.source}` : null}
          </>
        }
        actions={
          prospect.converted_at ? (
            <StatusBadge tone="success">
              Converti {formatDistance(prospect.converted_at)}
            </StatusBadge>
          ) : prospect.lost_at ? (
            <StatusBadge tone="danger">
              Perdu {formatDistance(prospect.lost_at)}
            </StatusBadge>
          ) : null
        }
      />

      {relanceEnRetard ? (
        <Notice variant="warning" titre="Relance en retard">
          Prévue {formatDistance(prospect.next_action_at)}
          {prospect.next_action_note ? ` — ${prospect.next_action_note}` : ""}.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Qualification</CardTitle>
              <CardDescription>
                Questions propres au projet « {projet.name} ». Elles se
                configurent depuis la fiche du projet, sans déploiement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <QuestionnaireForm
                prospectId={prospect.id}
                questions={questionnaire.questions}
                answers={questionnaire.answers}
                editable
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historique</CardTitle>
              <CardDescription>
                Chaque changement d&apos;étape, note et affectation y figure,
                horodaté. Le journal ne se modifie pas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <NoteForm prospectId={prospect.id} />
              <Separator />
              <ActivityTimeline activites={activites} fuseau={fuseau} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Suivi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StageSelector prospect={prospect} etapes={projet.stages ?? []} />
              <AssignSelector
                prospect={prospect}
                utilisateurs={utilisateurs.data}
                editable={encadrement}
              />
              <Separator />
              <NextActionForm prospect={prospect} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {prospect.phone ? (
                <p className="flex items-center gap-2">
                  <Phone className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <a href={`tel:${prospect.phone}`} className="hover:underline">
                    {prospect.phone}
                  </a>
                </p>
              ) : null}

              {prospect.email ? (
                <p className="flex items-center gap-2">
                  <Mail className="text-muted-foreground size-4 shrink-0" aria-hidden />
                  <a
                    href={`mailto:${prospect.email}`}
                    className="truncate hover:underline"
                  >
                    {prospect.email}
                  </a>
                </p>
              ) : null}

              {prospect.address ? (
                <p className="flex items-start gap-2">
                  <MapPin className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                  <span>{prospect.address}</span>
                </p>
              ) : null}

              {!prospect.phone && !prospect.email && !prospect.address ? (
                <p className="text-muted-foreground italic">
                  Aucune coordonnée renseignée.
                </p>
              ) : null}

              <Separator />

              <div className="text-muted-foreground flex justify-between gap-4 text-xs">
                <span>Créé le</span>
                <span>{formatDate(prospect.created_at, { timeZone: fuseau })}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

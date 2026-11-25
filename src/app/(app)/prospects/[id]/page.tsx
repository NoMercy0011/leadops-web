import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";

import { ActivityTimeline } from "./activity-timeline";
import {
  ArchiveProspectButton,
  EditProspectDialog,
  EraseProspectButton,
} from "./edit-prospect-dialog";
import {
  AssignSelector,
  NextActionForm,
  NoteForm,
  StageSelector,
} from "./prospect-actions";
import { LibelleFilAriane } from "@/components/fil-ariane";
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
import { formatDate, formatDistance, formatHeure } from "@/lib/format";
import { getCurrentInterview } from "@/lib/interviews";
import { listUtilisateursOptions } from "@/lib/options";
import { getProject } from "@/lib/projects";
import { getProspect, listActivities } from "@/lib/prospects";
import { getQuestionnaire } from "@/lib/questionnaire";
import { listAppointments } from "@/lib/appointments";
import { AppointmentsPanel } from "./appointments-panel";
import { QuestionnaireForm } from "./questionnaire-form";
import { DemarrerEntretien } from "./demarrer-entretien";

export const metadata: Metadata = {
  title: "Prospect",
};

export default async function FicheProspectPage({
  params,
  searchParams,
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

  const [activites, projet, utilisateurs, questionnaire, rendezVous, entretien, recherche] = await Promise.all([
    listActivities(prospectId),
    // Le projet fournit le pipeline : la liste des étapes proposées doit être
    // celle de *son* projet, aucune autre.
    getProject(prospect.project_id),
    encadrement
      ? listUtilisateursOptions()
      : Promise.resolve({ data: [] }),
    getQuestionnaire(prospectId),
    // Sans bornes de dates : la fiche montre tout l'historique du prospect,
    // passé comme à venir, là où le calendrier borne à une période.
    listAppointments({ prospect_id: prospectId }),
    // Lot 13 : un entretien ouvert sur ce prospect, quel qu'en soit l'auteur.
    prospect.is_erased ? Promise.resolve(null) : getCurrentInterview(prospectId),
    searchParams,
  ]);
  const monEntretien = entretien !== null && entretien.user?.id === user.id;

  const fuseau = user.company?.timezone;
  const relanceEnRetard =
    !prospect.is_erased &&
    prospect.next_action_at !== null &&
    new Date(prospect.next_action_at) < new Date();

  // Lot 9, règles R3 et R4 : un prospect archivé, effacé, ou d'un projet
  // archivé refuse toute écriture. L'API tranche ; l'écran l'annonce et
  // désactive ses commandes plutôt que de les masquer (décision P7), sauf sur
  // une fiche effacée, qui n'a plus aucune action (écran S-11).
  const efface = prospect.is_erased;
  const projetArchive = projet.status === "archived";
  const lectureSeule = efface || prospect.is_archived || projetArchive;

  return (
    <div className="space-y-6">
      {/* Donne son nom réel au segment d'identifiant du fil d'Ariane :
          « #12 » n'apprend rien à personne. */}
      <LibelleFilAriane segment={`prospects/${prospect.id}`} nom={prospect.full_name} />

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
          <>
          {efface ? (
            <StatusBadge tone="neutral">
              Effacé le {formatDate(prospect.erased_at, { timeZone: fuseau })}
            </StatusBadge>
          ) : (
          <>
            {prospect.converted_at ? (
              <StatusBadge tone="success">
                Converti {formatDistance(prospect.converted_at)}
              </StatusBadge>
            ) : prospect.lost_at ? (
              <StatusBadge tone="danger">
                Perdu {formatDistance(prospect.lost_at)}
              </StatusBadge>
            ) : null}

            {/* Lot 13 : entretien guidé. Un entretien ouvert par un autre
                utilisateur ne se démarre pas une seconde fois (décision n°5). */}
            {entretien !== null && !monEntretien ? null : (
              <DemarrerEntretien
                prospectId={prospect.id}
                reprendre={monEntretien}
                raisonInactif={
                  lectureSeule
                    ? "Fiche en lecture seule : l'entretien ne peut pas être enregistré."
                    : questionnaire.questions.length === 0
                      ? "Ce projet n'a pas encore de questionnaire."
                      : undefined
                }
              />
            )}
            <EditProspectDialog prospect={prospect} lectureSeule={lectureSeule} />

            {/* Archiver relève de l'encadrement : sortir un dossier des
                statistiques ne doit pas revenir à celui qu'elles mesurent.
                Désarchiver reste possible : c'est le geste qui lève la
                lecture seule. */}
            {/* Un prospect d'un projet archivé ne s'archive ni ne se
                désarchive : seul le projet se réactive (décision R2). */}
            {encadrement ? (
              <ArchiveProspectButton prospect={prospect} lectureSeule={projetArchive} />
            ) : null}
          </>
          )}

          {/* L'effacement vit hors de la branche conditionnelle, à une place
              fixe de l'arbre (revue du lot 9) : la fiche se recharge en
              « Prospect effacé » dès l'effacement, et le bouton, démonté avec
              la branche, emportait la boîte de résultat et la liste des
              autres fiches, que l'API ne renvoie qu'une fois. Le composant se
              masque lui-même sur une fiche effacée, sauf boîte ouverte.
              La policy réserve l'effacement à l'Admin Client ; il reste
              proposé sur un prospect archivé (contrat §8). */}
          {user.role === "admin_client" ? (
            <EraseProspectButton prospect={prospect} />
          ) : null}
          </>
        }
      />

      {efface ? (
        <Notice variant="info" titre="Données personnelles effacées">
          Cette fiche ne contient plus aucune donnée personnelle. Elle reste
          comptée dans les statistiques du projet et ne se modifie plus.
        </Notice>
      ) : prospect.is_archived ? (
        <Notice variant="info" titre="Prospect archivé — lecture seule">
          Il ne figure plus dans les listes et sort de tous les taux —
          conversion, qualification, perte. Ses données restent intactes ; pour
          le modifier, désarchivez-le.
        </Notice>
      ) : projetArchive ? (
        <Notice variant="info" titre="Projet archivé — lecture seule">
          Le projet « {projet.name} » est archivé : ce prospect ne se modifie
          plus tant que le projet n&apos;est pas réactivé.
        </Notice>
      ) : null}

      {recherche.entretien === "termine" ? (
        <Notice variant="success" titre="Entretien enregistré">
          Les réponses sont sur la fiche ; le journal garde la durée de l&apos;entretien.
        </Notice>
      ) : entretien !== null && !lectureSeule ? (
        <Notice
          variant="info"
          titre={
            monEntretien
              ? `Entretien commencé à ${formatHeure(entretien.started_at, { timeZone: fuseau })}, non terminé`
              : `Un entretien est en cours sur ce prospect (${entretien.user?.name ?? "un autre utilisateur"}, depuis ${formatHeure(entretien.started_at, { timeZone: fuseau })})`
          }
        >
          {monEntretien
            ? `${entretien.answered_count} réponse${entretien.answered_count > 1 ? "s" : ""} déjà enregistrée${entretien.answered_count > 1 ? "s" : ""}. « Reprendre l'entretien » repart de la dernière question.`
            : "Il ne peut pas être démarré une seconde fois."}
        </Notice>
      ) : null}

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
                editable={!lectureSeule}
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
              {efface ? null : (
                <>
                  <NoteForm prospectId={prospect.id} lectureSeule={lectureSeule} />
                  <Separator />
                </>
              )}
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
              <StageSelector
                prospect={prospect}
                etapes={projet.stages ?? []}
                lectureSeule={lectureSeule}
              />
              <AssignSelector
                prospect={prospect}
                utilisateurs={utilisateurs.data}
                editable={encadrement && !lectureSeule}
              />
              <Separator />
              {efface ? (
                <p className="text-sm">
                  <span className="text-muted-foreground">Prochaine action</span> —
                </p>
              ) : (
                <NextActionForm prospect={prospect} lectureSeule={lectureSeule} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rendez-vous</CardTitle>
              <CardDescription>
                Ils héritent du projet et du commercial de ce prospect.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppointmentsPanel
                prospectId={prospect.id}
                rendezVous={rendezVous}
                fuseau={fuseau}
                lectureSeule={lectureSeule}
                donneesEffacees={efface}
              />
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

              {efface ? (
                <p className="text-muted-foreground italic">
                  Effacées le{" "}
                  {formatDate(prospect.erased_at, { timeZone: fuseau })}.
                </p>
              ) : !prospect.phone && !prospect.email && !prospect.address ? (
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

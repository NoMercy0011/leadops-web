import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { Conduite } from "@/components/entretien/conduite";
import { LibelleFilAriane } from "@/components/fil-ariane";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { formatHeure } from "@/lib/format";
import { getCurrentInterview, getInterviewPlan } from "@/lib/interviews";
import { getProspect } from "@/lib/prospects";
import { getQuestionnaire } from "@/lib/questionnaire";

export const metadata: Metadata = {
  title: "Entretien",
};

/**
 * Entretien guidé avec un prospect — lot 13, planche n°13 (S-17).
 *
 * Adresse propre (décision n°2) : la recharger reprend l'entretien là où il
 * en était, minuteur compris. Sans entretien ouvert par l'utilisateur, on
 * revient à la fiche : le démarrage passe par le bouton « Démarrer ».
 */
export default async function EntretienPage({ params }: PageProps<"/prospects/[id]/entretien">) {
  const user = await requireUser();
  const { id } = await params;
  const prospectId = Number(id);
  if (!Number.isInteger(prospectId)) notFound();

  let prospect;
  try {
    prospect = await getProspect(prospectId);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const entretien = await getCurrentInterview(prospectId);
  if (!entretien || entretien.user?.id !== user.id) {
    redirect(`/prospects/${prospectId}`);
  }

  const [plan, questionnaire] = await Promise.all([
    getInterviewPlan(prospect.project_id),
    getQuestionnaire(prospectId),
  ]);

  const reponses = Object.fromEntries(questionnaire.answers.map((r) => [r.question_id, r.value]));

  return (
    <>
    <LibelleFilAriane segment={`prospects/${prospectId}`} nom={prospect.full_name} />
    <Conduite
      mode="entretien"
      questions={plan.questions}
      reponsesInitiales={reponses}
      entretien={entretien}
      prospectId={prospectId}
      projectId={prospect.project_id}
      titre={`Entretien · ${prospect.full_name}`}
      sousTitre={`${plan.project.name} · démarré à ${formatHeure(entretien.started_at, { timeZone: user.company?.timezone })}`}
      retour={`/prospects/${prospectId}`}
    />
    </>
  );
}

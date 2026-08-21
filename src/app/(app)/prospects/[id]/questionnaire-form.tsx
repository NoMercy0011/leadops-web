"use client";

import { useMemo, useState, useTransition } from "react";
import { ClipboardList, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { saveAnswers, type QuestionnaireState } from "../questionnaire-actions";
import { EmptyState } from "@/components/empty-state";
import { QualificationProgress } from "@/components/qualification-progress";
import { QuestionField } from "@/components/question-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import {
  estRenseignee,
  etatQualification,
  valeursInitiales,
} from "@/lib/qualification";
import type { ProspectAnswer, Question } from "@/lib/types";

type Valeur = string | number | boolean | string[] | null;

/**
 * Formulaire de qualification.
 *
 * Il est intégralement construit depuis les définitions renvoyées par l'API :
 * aucune question n'est écrite en dur, et le composant ne connaît ni les
 * libellés ni le nombre de champs. C'est ce qui permet à un client de modifier
 * son questionnaire sans déploiement — invariant n°3.
 */
export function QuestionnaireForm({
  prospectId,
  questions,
  answers,
  editable,
}: {
  prospectId: number;
  questions: Question[];
  answers: ProspectAnswer[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [reponse, setReponse] = useState<QuestionnaireState>({});

  const [valeurs, setValeurs] = useState<Record<number, Valeur>>(() =>
    valeursInitiales(questions, answers),
  );

  // Recalculé à chaque frappe : la barre avance sous les doigts plutôt qu'au
  // seul enregistrement, ce qui est tout l'intérêt de la calculer côté client.
  const etat = useMemo(
    () => etatQualification(questions, valeurs),
    [questions, valeurs],
  );

  if (questions.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        titre="Aucune question de qualification"
        description="Le questionnaire de ce projet se définit depuis sa fiche, sans déploiement. Un Admin Client peut y ajouter des questions à tout moment."
      />
    );
  }

  function enregistrer() {
    startTransition(async () => {
      const resultat = await saveAnswers(prospectId, valeurs);

      setReponse(resultat);

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
      if (resultat.fieldErrors) {
        toast.error("Certaines réponses doivent être corrigées.");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* L'état avant les champs : il dit s'il reste quelque chose à faire,
          information qu'on n'obtiendrait sinon qu'en parcourant tout le
          formulaire jusqu'en bas. */}
      <QualificationProgress etat={etat} />

      <FieldGroup>
        {questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            valeur={valeurs[question.id] ?? null}
            erreur={reponse.fieldErrors?.[question.id]}
            // Une obligatoire encore vide se signale avant l'envoi, pas
            // seulement après le refus du serveur : signaler à la validation
            // seule oblige à un aller-retour pour découvrir ce qui manque.
            manquante={
              question.required && !estRenseignee(valeurs[question.id])
            }
            disabled={!editable || pending}
            onChange={(valeur) =>
              setValeurs((actuelles) => ({
                ...actuelles,
                [question.id]: valeur,
              }))
            }
          />
        ))}
      </FieldGroup>

      {editable ? (
        <Button onClick={enregistrer} disabled={pending} aria-busy={pending}>
          {pending ? (
            <LoaderCircle className="size-4 animate-spin" aria-hidden />
          ) : null}
          Enregistrer la qualification
        </Button>
      ) : null}
    </div>
  );
}

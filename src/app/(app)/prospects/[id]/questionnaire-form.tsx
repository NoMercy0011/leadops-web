"use client";

import { useState, useTransition } from "react";
import { ClipboardList, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { saveAnswers, type QuestionnaireState } from "../questionnaire-actions";
import { EmptyState } from "@/components/empty-state";
import { QuestionField } from "@/components/question-field";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
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
  const [etat, setEtat] = useState<QuestionnaireState>({});

  const [valeurs, setValeurs] = useState<Record<number, Valeur>>(() =>
    Object.fromEntries(
      questions.map((question) => {
        const reponse = answers.find((a) => a.question_id === question.id);

        // Un choix multiple sans réponse doit démarrer sur un tableau vide et
        // non sur `null` : les cases à cocher itèrent dessus.
        const defaut: Valeur = question.multi_value ? [] : null;

        return [question.id, reponse?.value ?? defaut];
      }),
    ),
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

      setEtat(resultat);

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
      if (resultat.fieldErrors) {
        toast.error("Certaines réponses doivent être corrigées.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <FieldGroup>
        {questions.map((question) => (
          <QuestionField
            key={question.id}
            question={question}
            valeur={valeurs[question.id] ?? null}
            erreur={etat.fieldErrors?.[question.id]}
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

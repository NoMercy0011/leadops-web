"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  addQuestion,
  deleteQuestion,
  reorderQuestions,
} from "../questionnaire-actions";
import { ChampSelect, ChampTexte } from "@/components/form-fields";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import type { Question, QuestionType } from "@/lib/types";

/**
 * Constructeur de questionnaire.
 *
 * Les types à options — liste déroulante, choix unique, choix multiple —
 * révèlent un champ de saisie des choix. Le reste du formulaire est identique
 * pour les onze types : c'est le propre d'un schéma dynamique.
 */
const TYPES: { value: QuestionType; label: string; options: boolean }[] = [
  { value: "text", label: "Texte", options: false },
  { value: "long_text", label: "Texte long", options: false },
  { value: "number", label: "Nombre", options: false },
  { value: "email", label: "Email", options: false },
  { value: "phone", label: "Téléphone", options: false },
  { value: "date", label: "Date", options: false },
  { value: "dropdown", label: "Liste déroulante", options: true },
  { value: "single_choice", label: "Choix unique", options: true },
  { value: "multiple_choice", label: "Choix multiple", options: true },
  { value: "yes_no", label: "Oui / Non", options: false },
  { value: "checkbox", label: "Case à cocher", options: false },
];

export function QuestionnaireBuilder({
  projectId,
  questions,
  editable,
}: {
  projectId: number;
  questions: Question[];
  editable: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [ajoutOuvert, setAjoutOuvert] = useState(false);
  const [typeChoisi, setTypeChoisi] = useState<QuestionType>("text");

  const besoinOptions = TYPES.find((t) => t.value === typeChoisi)?.options ?? false;

  function executer(action: () => Promise<{ message?: string; success?: string }>) {
    startTransition(async () => {
      const resultat = await action();

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });
  }

  function deplacer(index: number, direction: -1 | 1) {
    const cible = index + direction;

    if (cible < 0 || cible >= questions.length) {
      return;
    }

    const nouvel = [...questions];
    [nouvel[index], nouvel[cible]] = [nouvel[cible], nouvel[index]];

    executer(() => reorderQuestions(projectId, nouvel.map((q) => q.id)));
  }

  return (
    <div className="space-y-4">
      {questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune question. Le questionnaire de ce projet est vide : les fiches
          prospects n&apos;afficheront pas de section de qualification.
        </p>
      ) : (
        <ol className="space-y-2">
          {questions.map((question, index) => (
            <li
              key={question.id}
              className="border-border bg-card flex items-start gap-3 rounded-lg border px-3 py-2.5"
            >
              <span className="text-muted-foreground w-6 shrink-0 pt-0.5 text-center text-xs tabular-nums">
                {index + 1}
              </span>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium">{question.label}</p>
                <div className="flex flex-wrap items-center gap-1.5">
                  <StatusBadge tone="neutral" point={false}>
                    {question.type_label}
                  </StatusBadge>
                  {question.required ? (
                    <StatusBadge tone="info" point={false}>
                      Obligatoire
                    </StatusBadge>
                  ) : null}
                  {question.has_answers ? (
                    // Le type ne peut plus changer : le signaler évite à
                    // l'utilisateur de buter sur un refus après coup.
                    <StatusBadge tone="warning" point={false}>
                      Déjà répondue
                    </StatusBadge>
                  ) : null}
                  {question.options && question.options.length > 0 ? (
                    <span className="text-muted-foreground text-xs">
                      {question.options.length} choix
                    </span>
                  ) : null}
                </div>
              </div>

              {editable ? (
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={pending || index === 0}
                    onClick={() => deplacer(index, -1)}
                    aria-label={`Monter ${question.label}`}
                  >
                    <ChevronUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8"
                    disabled={pending || index === questions.length - 1}
                    onClick={() => deplacer(index, 1)}
                    aria-label={`Descendre ${question.label}`}
                  >
                    <ChevronDown className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    disabled={pending}
                    // La suppression est douce côté API : les réponses déjà
                    // collectées restent lisibles sur les fiches prospects.
                    title="Retirer du formulaire — les réponses déjà collectées sont conservées"
                    onClick={() => executer(() => deleteQuestion(projectId, question.id))}
                    aria-label={`Retirer ${question.label}`}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ol>
      )}

      {!editable ? (
        <p className="text-muted-foreground text-xs">
          Seul un Admin Client définit le questionnaire : il conditionne la
          qualification de toute l&apos;équipe.
        </p>
      ) : ajoutOuvert ? (
        <form
          action={(formData) => {
            setAjoutOuvert(false);
            executer(() => addQuestion(projectId, formData));
          }}
          className="border-border space-y-4 rounded-lg border border-dashed p-3"
        >
          <FieldGroup>
            <ChampTexte
              id="label"
              label="Libellé de la question"
              placeholder="Situation familiale"
              required
              autoFocus
            />

            <ChampSelect
              id="type"
              label="Type de réponse"
              value={typeChoisi}
              onChange={(e) => setTypeChoisi(e.target.value as QuestionType)}
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </ChampSelect>

            {besoinOptions ? (
              <ChampTexte
                id="options"
                label="Choix proposés"
                placeholder="Célibataire, Marié, Divorcé"
                required
                // Une saisie séparée par virgules plutôt qu'une liste
                // dynamique : c'est plus rapide à remplir, et le découpage se
                // fait dans la Server Action.
                aide="Séparés par des virgules. Deux choix au minimum."
              />
            ) : null}

            <div className="flex items-center gap-2">
              <Checkbox id="required" name="required" value="1" />
              <Label htmlFor="required" className="cursor-pointer font-normal">
                Réponse obligatoire
              </Label>
            </div>
          </FieldGroup>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={pending}>
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
              ) : null}
              Ajouter
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setAjoutOuvert(false)}
            >
              Annuler
            </Button>
          </div>
        </form>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAjoutOuvert(true)}
          disabled={pending}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter une question
        </Button>
      )}
    </div>
  );
}

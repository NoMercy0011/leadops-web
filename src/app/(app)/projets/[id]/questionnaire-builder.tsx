"use client";

import { useState, useTransition } from "react";
import {
  ChevronDown,
  ChevronUp,
  LoaderCircle,
  Lock,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import {
  addQuestion,
  deleteQuestion,
  reorderQuestions,
  updateQuestion,
} from "../questionnaire-actions";
import { ChampSelect, ChampTexte } from "@/components/form-fields";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FieldGroup } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import { formatNombre } from "@/lib/format";
import { resumeQuestionnaire } from "@/lib/qualification";
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

function aDesOptions(type: QuestionType): boolean {
  return TYPES.find((t) => t.value === type)?.options ?? false;
}

type Resultat = { message?: string; success?: string };

/**
 * Formulaire d'une question, partagé par l'ajout et la modification.
 *
 * Les deux formulaires ont exactement les mêmes champs, à une exception près :
 * le type ne se choisit qu'à la création. L'API le refuse dès qu'une réponse
 * existe — un « oui » devenu un nombre n'a plus de sens — et proposer un
 * sélecteur qui échouerait une fois sur deux serait pire que ne pas le
 * proposer. Le constructeur le dit à l'écran plutôt que de le laisser
 * découvrir.
 */
function QuestionForm({
  question,
  pending,
  onSubmit,
  onCancel,
}: {
  /** Absente à la création. */
  question?: Question;
  pending: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const creation = question === undefined;
  const [type, setType] = useState<QuestionType>(question?.type ?? "text");
  const besoinOptions = aDesOptions(type);

  return (
    <form
      action={onSubmit}
      className="border-border bg-muted/30 space-y-4 rounded-lg border border-dashed p-3"
    >
      <FieldGroup>
        <ChampTexte
          id="label"
          label="Libellé de la question"
          placeholder="Situation familiale"
          required
          autoFocus
          defaultValue={question?.label}
        />

        {creation ? (
          <ChampSelect
            id="type"
            label="Type de réponse"
            value={type}
            onChange={(e) => setType(e.target.value as QuestionType)}
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </ChampSelect>
        ) : (
          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <Lock className="size-3.5 shrink-0" aria-hidden />
            Type : <span className="font-medium">{question.type_label}</span> —
            il ne se change pas, créez une nouvelle question si besoin.
          </p>
        )}

        <ChampTexte
          id="help"
          label="Aide affichée sous le champ"
          placeholder="Telle qu'indiquée sur la pièce d'identité"
          optionnel
          defaultValue={question?.help ?? ""}
        />

        {besoinOptions ? (
          <ChampTexte
            id="options"
            label="Choix proposés"
            placeholder="Célibataire, Marié, Divorcé"
            required
            defaultValue={(question?.options ?? [])
              .map((o) => o.label)
              .join(", ")}
            // Une saisie séparée par virgules plutôt qu'une liste dynamique :
            // c'est plus rapide à remplir, et le découpage se fait dans la
            // Server Action.
            aide={
              creation
                ? "Séparés par des virgules. Deux choix au minimum."
                : "Séparés par des virgules. La liste saisie remplace l'ancienne."
            }
          />
        ) : null}

        <div className="flex items-center gap-2">
          <Checkbox
            id="required"
            name="required"
            value="1"
            defaultChecked={question?.required}
          />
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
          {creation ? "Ajouter" : "Enregistrer"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </form>
  );
}

/**
 * Bandeau chiffré du questionnaire.
 *
 * Compact et en ligne, là où la liste des prospects emploie des cartes : ce
 * bloc vit **à l'intérieur** d'une carte, sur la fiche projet. Une rangée de
 * tuiles y pèserait plus lourd que la liste qu'elle résume, et la hiérarchie
 * s'inverserait.
 *
 * La dominante est le nombre de questions : c'est la longueur du formulaire
 * que devra remplir chaque commercial, et la seule grandeur sur laquelle
 * l'Admin Client arbitre réellement. Les questions verrouillées viennent
 * ensuite, parce qu'elles bornent ce qu'il peut encore changer.
 */
function ResumeQuestionnaire({ questions }: { questions: Question[] }) {
  const resume = resumeQuestionnaire(questions);

  return (
    <div className="border-border flex flex-wrap items-center gap-x-6 gap-y-2 border-b pb-4">
      <p className="flex items-baseline gap-2">
        <span className="font-heading text-2xl leading-none font-semibold tabular-nums">
          {formatNombre(resume.total)}
        </span>
        <span className="text-muted-foreground text-sm">
          question{resume.total > 1 ? "s" : ""}
        </span>
      </p>

      <p className="text-muted-foreground text-sm">
        <span className="text-foreground font-medium tabular-nums">
          {formatNombre(resume.obligatoires)}
        </span>{" "}
        obligatoire{resume.obligatoires > 1 ? "s" : ""}
      </p>

      {resume.avecReponses > 0 ? (
        <p className="text-warning-subtle-foreground flex items-center gap-1.5 text-sm">
          <Lock className="size-3.5 shrink-0" aria-hidden />
          <span className="font-medium tabular-nums">
            {formatNombre(resume.avecReponses)}
          </span>
          <span>
            déjà répondue{resume.avecReponses > 1 ? "s" : ""} — type verrouillé
          </span>
        </p>
      ) : null}
    </div>
  );
}

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
  /** Identifiant de la question en cours de modification, le cas échéant. */
  const [enEdition, setEnEdition] = useState<number | null>(null);

  function executer(action: () => Promise<Resultat>) {
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

    executer(() =>
      reorderQuestions(
        projectId,
        nouvel.map((q) => q.id),
      ),
    );
  }

  return (
    <div className="space-y-4">
      {questions.length > 0 ? <ResumeQuestionnaire questions={questions} /> : null}

      {questions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          Aucune question. Le questionnaire de ce projet est vide : les fiches
          prospects n&apos;afficheront pas de section de qualification.
        </p>
      ) : (
        <ol className="space-y-2">
          {questions.map((question, index) =>
            enEdition === question.id ? (
              <li key={question.id}>
                <QuestionForm
                  question={question}
                  pending={pending}
                  onCancel={() => setEnEdition(null)}
                  onSubmit={(formData) => {
                    setEnEdition(null);
                    executer(() =>
                      updateQuestion(projectId, question.id, formData),
                    );
                  }}
                />
              </li>
            ) : (
              <li
                key={question.id}
                className="border-border bg-card flex items-start gap-3 rounded-lg border px-3 py-2.5"
              >
                <span className="text-muted-foreground w-6 shrink-0 pt-1 text-center text-xs tabular-nums">
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1 space-y-1">
                  {/* Le libellé est le contenu de la question ; le type et les
                      états n'en sont que la mécanique. Il se lit donc un cran
                      au-dessus, là où les deux se valaient auparavant. */}
                  <p className="truncate text-[0.9375rem] font-medium">
                    {question.label}
                  </p>

                  {question.help ? (
                    <p className="text-muted-foreground truncate text-xs">
                      {question.help}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                    <StatusBadge tone="neutral" point={false}>
                      {question.type_label}
                    </StatusBadge>
                    {question.required ? (
                      <StatusBadge tone="info" point={false}>
                        Obligatoire
                      </StatusBadge>
                    ) : null}
                    {question.has_answers ? (
                      // L'état le plus lourd de conséquences : le type est
                      // verrouillé et la suppression ne sera que douce. Il
                      // garde donc l'icône, que les autres n'ont pas.
                      <StatusBadge tone="warning" point={false}>
                        <Lock className="size-3" aria-hidden />
                        Déjà répondue
                      </StatusBadge>
                    ) : null}
                    {question.options && question.options.length > 0 ? (
                      <span className="text-muted-foreground text-xs">
                        {formatNombre(question.options.length)} choix
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
                      className="size-8"
                      disabled={pending}
                      onClick={() => {
                        setAjoutOuvert(false);
                        setEnEdition(question.id);
                      }}
                      aria-label={`Modifier ${question.label}`}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive duration-(--duration-fast) ease-brand size-8 transition-colors"
                      disabled={pending}
                      // La suppression est douce côté API : les réponses déjà
                      // collectées restent lisibles sur les fiches prospects.
                      title="Retirer du formulaire — les réponses déjà collectées sont conservées"
                      onClick={() =>
                        executer(() => deleteQuestion(projectId, question.id))
                      }
                      aria-label={`Retirer ${question.label}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ),
          )}
        </ol>
      )}

      {!editable ? (
        <p className="text-muted-foreground text-xs">
          Seul un Admin Client définit le questionnaire : il conditionne la
          qualification de toute l&apos;équipe.
        </p>
      ) : ajoutOuvert ? (
        <QuestionForm
          pending={pending}
          onCancel={() => setAjoutOuvert(false)}
          onSubmit={(formData) => {
            setAjoutOuvert(false);
            executer(() => addQuestion(projectId, formData));
          }}
        />
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setEnEdition(null);
            setAjoutOuvert(true);
          }}
          disabled={pending}
        >
          <Plus className="size-4" aria-hidden />
          Ajouter une question
        </Button>
      )}
    </div>
  );
}

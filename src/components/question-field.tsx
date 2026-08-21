"use client";

import { ChampSelect, ChampTexte, ChampZone } from "@/components/form-fields";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Question, QuestionType } from "@/lib/types";

/**
 * Moteur de rendu du questionnaire — invariant n°3.
 *
 * Ce composant est le pendant front de `ValidationRuleBuilder` : il traduit un
 * *type* de question en champ de saisie, et c'est le seul endroit du code qui
 * connaît cette correspondance. Il n'existe aucun composant par projet ni par
 * question, et rien ici ne dépend d'un libellé — un client qui renomme « Âge »
 * en « Tranche d'âge » ne change pas une ligne de rendu.
 *
 * Le registre en bas de fichier est l'unique point d'extension : ajouter un
 * douzième type consisterait à ajouter une entrée ici et une dans
 * `ValidationRuleBuilder`, rien d'autre.
 */

type Valeur = string | number | boolean | string[] | null;

interface Props {
  question: Question;
  valeur: Valeur;
  erreur?: string;
  /**
   * Question obligatoire encore sans réponse.
   *
   * Distinct de `erreur` : celle-ci vient du serveur après un refus, celui-ci
   * se voit avant même d'essayer. Le rendu reste discret — un repère, pas une
   * erreur — car ne pas avoir encore rempli un champ n'est pas une faute.
   */
  manquante?: boolean;
  onChange: (valeur: Valeur) => void;
  disabled?: boolean;
}

/** Champs qui se ramènent à un `<input>` typé. */
const TYPES_INPUT: Partial<Record<QuestionType, string>> = {
  text: "text",
  number: "number",
  email: "email",
  phone: "tel",
  date: "date",
};

export function QuestionField({
  question,
  valeur,
  erreur,
  manquante,
  onChange,
  disabled,
}: Props) {
  const id = `question-${question.id}`;

  /**
   * Le repère « à renseigner » se substitue à la mention « facultatif » du
   * champ partagé : les deux ne peuvent pas coexister, une question étant soit
   * obligatoire soit facultative. Il passe par l'aide plutôt que par un style
   * propre, pour rester lisible par une synthèse vocale via aria-describedby.
   */
  const aide =
    manquante && !erreur ? (
      <span className="text-warning-subtle-foreground font-medium">
        À renseigner{question.help ? ` — ${question.help}` : ""}
      </span>
    ) : (
      (question.help ?? undefined)
    );

  const commun = {
    id,
    label: question.label,
    erreur,
    aide,
    optionnel: !question.required,
    disabled,
  };

  const typeInput = TYPES_INPUT[question.type];

  if (typeInput) {
    return (
      <ChampTexte
        {...commun}
        type={typeInput}
        value={valeur === null ? "" : String(valeur)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.type === "long_text") {
    return (
      <ChampZone
        {...commun}
        rows={4}
        value={valeur === null ? "" : String(valeur)}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.type === "dropdown") {
    return (
      <ChampSelect
        {...commun}
        value={valeur === null ? "" : String(valeur)}
        onChange={(e) => onChange(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Non renseigné</option>
        {(question.options ?? []).map((option) => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </ChampSelect>
    );
  }

  if (question.type === "single_choice") {
    return (
      <Field data-invalid={Boolean(erreur)}>
        <FieldLabel htmlFor={id}>
          {question.label}
          {!question.required ? (
            <span className="text-muted-foreground font-normal">facultatif</span>
          ) : null}
        </FieldLabel>

        <RadioGroup
          id={id}
          value={valeur === null ? "" : String(valeur)}
          disabled={disabled}
          onValueChange={(v) => onChange(v)}
          className="gap-2"
        >
          {(question.options ?? []).map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <RadioGroupItem
                value={option.value}
                id={`${id}-${option.value}`}
              />
              <label
                htmlFor={`${id}-${option.value}`}
                className="cursor-pointer text-sm"
              >
                {option.label}
              </label>
            </div>
          ))}
        </RadioGroup>

        {aide ? <FieldDescription>{aide}</FieldDescription> : null}
        <FieldError>{erreur}</FieldError>
      </Field>
    );
  }

  if (question.type === "multiple_choice") {
    // La valeur est un tableau : un `String(valeur)` la transformerait en
    // « alpha,beta » et ferait échouer le rapprochement avec les options.
    const selection = Array.isArray(valeur) ? valeur : [];

    return (
      <Field data-invalid={Boolean(erreur)}>
        <FieldLabel>
          {question.label}
          {!question.required ? (
            <span className="text-muted-foreground font-normal">facultatif</span>
          ) : null}
        </FieldLabel>

        <div className="space-y-2">
          {(question.options ?? []).map((option) => (
            <div key={option.id} className="flex items-center gap-2">
              <Checkbox
                id={`${id}-${option.value}`}
                checked={selection.includes(option.value)}
                disabled={disabled}
                onCheckedChange={(coche) =>
                  onChange(
                    coche === true
                      ? [...selection, option.value]
                      : selection.filter((v) => v !== option.value),
                  )
                }
              />
              <label
                htmlFor={`${id}-${option.value}`}
                className="cursor-pointer text-sm"
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>

        {aide ? <FieldDescription>{aide}</FieldDescription> : null}
        <FieldError>{erreur}</FieldError>
      </Field>
    );
  }

  if (question.type === "yes_no") {
    return (
      <Field data-invalid={Boolean(erreur)}>
        <FieldLabel htmlFor={id}>
          {question.label}
          {!question.required ? (
            <span className="text-muted-foreground font-normal">facultatif</span>
          ) : null}
        </FieldLabel>

        <RadioGroup
          id={id}
          value={valeur === null ? "" : valeur ? "1" : "0"}
          disabled={disabled}
          onValueChange={(v) => onChange(v === "1")}
          className="flex gap-4"
        >
          {[
            ["1", "Oui"],
            ["0", "Non"],
          ].map(([v, libelle]) => (
            <div key={v} className="flex items-center gap-2">
              <RadioGroupItem value={v} id={`${id}-${v}`} />
              <label htmlFor={`${id}-${v}`} className="cursor-pointer text-sm">
                {libelle}
              </label>
            </div>
          ))}
        </RadioGroup>

        {aide ? <FieldDescription>{aide}</FieldDescription> : null}
        <FieldError>{erreur}</FieldError>
      </Field>
    );
  }

  // checkbox : une seule case, dont le libellé *est* la question.
  return (
    <Field data-invalid={Boolean(erreur)}>
      <div className="flex items-start gap-2">
        <Checkbox
          id={id}
          checked={valeur === true}
          disabled={disabled}
          onCheckedChange={(coche) => onChange(coche === true)}
        />
        <label htmlFor={id} className="cursor-pointer text-sm leading-tight">
          {question.label}
        </label>
      </div>
      {aide ? <FieldDescription>{aide}</FieldDescription> : null}
      <FieldError>{erreur}</FieldError>
    </Field>
  );
}

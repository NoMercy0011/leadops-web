"use client";

import { useRef, useTransition } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { toast } from "sonner";

import {
  addNote,
  assignProspect,
  changeStage,
  planNextAction,
} from "../actions";
import { NativeSelect } from "@/components/form-fields";
import { StageChip } from "@/components/stage-chip";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { PipelineStage, Prospect, User } from "@/lib/types";

function useAction() {
  const [pending, startTransition] = useTransition();

  const executer = (
    action: () => Promise<{ message?: string; success?: string }>,
  ) =>
    startTransition(async () => {
      const resultat = await action();

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);
    });

  return { pending, executer };
}

/**
 * Changement d'étape.
 *
 * La liste ne propose que les étapes du projet du prospect : l'API refuse une
 * étape étrangère, et l'offrir ici ne mènerait qu'à une erreur.
 */
export function StageSelector({
  prospect,
  etapes,
}: {
  prospect: Prospect;
  etapes: PipelineStage[];
}) {
  const { pending, executer } = useAction();

  return (
    <Field>
      <FieldLabel htmlFor="stage">Étape</FieldLabel>
      <NativeSelect
        id="stage"
        value={prospect.stage_id}
        disabled={pending}
        onChange={(e) => executer(() => changeStage(prospect.id, Number(e.target.value)))}
      >
        {etapes.map((etape) => (
          <option key={etape.id} value={etape.id}>
            {etape.name}
          </option>
        ))}
      </NativeSelect>
      {prospect.stage ? (
        <FieldDescription>
          <StageChip stage={prospect.stage} />
        </FieldDescription>
      ) : null}
    </Field>
  );
}

export function AssignSelector({
  prospect,
  utilisateurs,
  editable,
}: {
  prospect: Prospect;
  utilisateurs: User[];
  editable: boolean;
}) {
  const { pending, executer } = useAction();

  if (!editable) {
    return (
      <Field>
        <FieldLabel>Commercial</FieldLabel>
        <p className="text-sm">
          {prospect.assigned_user?.name ?? (
            <span className="text-muted-foreground italic">Non affecté</span>
          )}
        </p>
      </Field>
    );
  }

  return (
    <Field>
      <FieldLabel htmlFor="assigned">Commercial</FieldLabel>
      <NativeSelect
        id="assigned"
        value={prospect.assigned_user_id ?? ""}
        disabled={pending}
        onChange={(e) =>
          executer(() =>
            assignProspect(
              prospect.id,
              e.target.value === "" ? null : Number(e.target.value),
            ),
          )
        }
      >
        <option value="">Non affecté</option>
        {utilisateurs.map((membre) => (
          <option key={membre.id} value={membre.id}>
            {membre.name}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

export function NextActionForm({ prospect }: { prospect: Prospect }) {
  const { pending, executer } = useAction();

  return (
    <form
      action={(formData) => executer(() => planNextAction(prospect.id, formData))}
      className="space-y-3"
    >
      <Field>
        <FieldLabel htmlFor="next_action_at">Prochaine action</FieldLabel>
        <Input
          id="next_action_at"
          name="next_action_at"
          type="datetime-local"
          defaultValue={prospect.next_action_at?.slice(0, 16) ?? ""}
        />
        <FieldDescription>
          Laisser vide pour annuler la relance.
        </FieldDescription>
      </Field>

      <Input
        name="next_action_note"
        placeholder="Objet de la relance"
        defaultValue={prospect.next_action_note ?? ""}
        aria-label="Objet de la relance"
      />

      <Button type="submit" size="sm" variant="secondary" disabled={pending}>
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        Enregistrer
      </Button>
    </form>
  );
}

/**
 * Ajout d'une note.
 *
 * La note part dans le journal et non dans un champ du prospect : elle est
 * datée, attribuée à son auteur, et ne s'écrase pas — ce qu'un champ texte
 * unique ferait à chaque saisie.
 */
export function NoteForm({ prospectId }: { prospectId: number }) {
  const { pending, executer } = useAction();
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formRef.current?.reset();
        executer(() => addNote(prospectId, formData));
      }}
      className="space-y-2"
    >
      <Textarea
        name="note"
        rows={3}
        required
        placeholder="Appel effectué, rappeler lundi…"
        aria-label="Nouvelle note"
      />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? (
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
        ) : (
          <Send className="size-4" aria-hidden />
        )}
        Ajouter la note
      </Button>
    </form>
  );
}

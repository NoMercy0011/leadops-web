"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { AlarmClock, LoaderCircle, Phone, UserCog } from "lucide-react";
import { toast } from "sonner";

import { bulkAssign } from "./actions";
import { NativeSelect } from "@/components/form-fields";
import { StageChip } from "@/components/stage-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateHeure, formatDistance, formatNombre } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Prospect, User } from "@/lib/types";

/**
 * Liste des prospects, avec sélection pour la réaffectation en masse.
 *
 * La réaffectation est une décision d'encadrement (§10.3) : la colonne de
 * sélection n'apparaît pas pour un commercial, qui ne peut de toute façon pas
 * la déclencher côté API.
 *
 * **Hiérarchie des colonnes.** Elles sont ordonnées par ce qu'un commercial
 * cherche dans cet écran : qui, où en est-on, quoi faire ensuite, qui s'en
 * occupe, quand a-t-on parlé pour la dernière fois. « Prochaine action »
 * manquait entièrement — c'est pourtant la seule donnée qui dit quoi faire, et
 * elle était reléguée à la fiche, donc invisible tant qu'on ne l'ouvrait pas.
 * Une relance dépassée passe en couleur d'alerte : c'est la seule mise en
 * évidence du tableau, pour qu'elle reste repérable au balayage.
 */
/**
 * Cellule « prochaine action ».
 *
 * Trois états, et c'est la distinction entre les deux premiers qui compte :
 * une relance dépassée réclame une action aujourd'hui, une relance à venir
 * n'est qu'une information. Un dossier converti ou perdu n'appelle plus rien,
 * même s'il porte encore une date — l'API l'exclut du compte « à relancer »
 * pour la même raison.
 */
function ProchaineAction({
  prospect,
  fuseau,
}: {
  prospect: Prospect;
  fuseau?: string;
}) {
  const clos = Boolean(prospect.converted_at ?? prospect.lost_at);

  if (!prospect.next_action_at) {
    return <span className="text-muted-foreground">—</span>;
  }

  const enRetard = !clos && new Date(prospect.next_action_at) < new Date();

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap",
        enRetard
          ? "text-warning-subtle-foreground font-medium"
          : "text-muted-foreground",
        clos && "line-through",
      )}
    >
      {enRetard ? <AlarmClock className="size-3.5 shrink-0" aria-hidden /> : null}
      <time
        dateTime={prospect.next_action_at}
        title={
          (prospect.next_action_note ? `${prospect.next_action_note} — ` : "") +
          formatDateHeure(prospect.next_action_at, { timeZone: fuseau })
        }
      >
        {formatDistance(prospect.next_action_at)}
      </time>
    </span>
  );
}

export function ProspectTable({
  prospects,
  utilisateurs,
  peutReaffecter,
  fuseau,
  total,
}: {
  prospects: Prospect[];
  utilisateurs: User[];
  peutReaffecter: boolean;
  fuseau?: string;
  total: number;
}) {
  const [selection, setSelection] = useState<number[]>([]);
  const [destinataire, setDestinataire] = useState<string>("");
  const [pending, startTransition] = useTransition();

  const tousSelectionnes =
    prospects.length > 0 && selection.length === prospects.length;

  function basculerTout(coche: boolean) {
    setSelection(coche ? prospects.map((p) => p.id) : []);
  }

  function basculer(id: number, coche: boolean) {
    setSelection((actuelle) =>
      coche ? [...actuelle, id] : actuelle.filter((x) => x !== id),
    );
  }

  function reaffecter() {
    startTransition(async () => {
      const resultat = await bulkAssign(
        selection,
        destinataire === "" ? null : Number(destinataire),
      );

      if (resultat.success) toast.success(resultat.success);
      // Le message accompagne le succès quand des prospects ont été écartés :
      // le masquer laisserait croire à un succès complet.
      if (resultat.message) toast.warning(resultat.message);

      setSelection([]);
    });
  }

  return (
    <div className="space-y-3">
      {peutReaffecter && selection.length > 0 ? (
        <div className="border-border bg-accent/40 flex flex-wrap items-center gap-3 rounded-lg border px-4 py-3">
          <UserCog className="text-accent-foreground size-4 shrink-0" aria-hidden />
          <p className="text-sm font-medium">
            {formatNombre(selection.length)} sélectionné
            {selection.length > 1 ? "s" : ""}
          </p>

          <NativeSelect
            aria-label="Réaffecter à"
            className="ml-auto w-auto min-w-44"
            value={destinataire}
            onChange={(e) => setDestinataire(e.target.value)}
          >
            <option value="">Retirer l&apos;affectation</option>
            {utilisateurs.map((membre) => (
              <option key={membre.id} value={membre.id}>
                {membre.name}
              </option>
            ))}
          </NativeSelect>

          <Button size="sm" disabled={pending} onClick={reaffecter}>
            {pending ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : null}
            Réaffecter
          </Button>

          <Button
            size="sm"
            variant="ghost"
            disabled={pending}
            onClick={() => setSelection([])}
          >
            Annuler
          </Button>
        </div>
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {peutReaffecter ? (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={tousSelectionnes}
                        onCheckedChange={(c) => basculerTout(c === true)}
                        aria-label="Tout sélectionner"
                      />
                    </TableHead>
                  ) : null}
                  <TableHead>Prospect</TableHead>
                  <TableHead>Étape</TableHead>
                  <TableHead>Prochaine action</TableHead>
                  <TableHead>Commercial</TableHead>
                  <TableHead className="text-right">Dernière interaction</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((prospect) => (
                  <TableRow key={prospect.id}>
                    {peutReaffecter ? (
                      <TableCell>
                        <Checkbox
                          checked={selection.includes(prospect.id)}
                          onCheckedChange={(c) => basculer(prospect.id, c === true)}
                          aria-label={`Sélectionner ${prospect.full_name}`}
                        />
                      </TableCell>
                    ) : null}

                    <TableCell>
                      <div className="min-w-0 space-y-0.5">
                        {/* Le nom est l'entrée de la ligne : il porte le lien
                            et se lit un cran au-dessus du reste. */}
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="block truncate text-[0.9375rem] font-medium hover:underline"
                        >
                          {prospect.full_name}
                        </Link>

                        <div className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
                          {prospect.company_name ? (
                            <span className="truncate">
                              {prospect.company_name}
                            </span>
                          ) : null}

                          {/* Le métier est un métier de téléphone : le numéro
                              est composable d'un clic depuis la liste, sans
                              passer par la fiche. */}
                          {prospect.phone ? (
                            <a
                              href={`tel:${prospect.phone}`}
                              className="hover:text-foreground duration-(--duration-fast) ease-brand inline-flex shrink-0 items-center gap-1 tabular-nums transition-colors hover:underline"
                            >
                              <Phone className="size-3" aria-hidden />
                              {prospect.phone}
                            </a>
                          ) : null}

                          {!prospect.company_name && !prospect.phone ? (
                            <span className="truncate">
                              {prospect.email ?? "Sans coordonnée"}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      {prospect.stage ? (
                        <StageChip stage={prospect.stage} />
                      ) : null}
                    </TableCell>

                    <TableCell className="text-sm">
                      <ProchaineAction prospect={prospect} fuseau={fuseau} />
                    </TableCell>

                    <TableCell className="text-sm">
                      {prospect.assigned_user?.name ?? (
                        <span className="text-muted-foreground italic">
                          Non affecté
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-right text-sm whitespace-nowrap">
                      {/* Le relatif se lit d'un coup d'œil ; la date exacte
                          reste en infobulle, sans quoi on ne peut pas comparer
                          deux lignes affichant toutes deux « il y a 3 jours ». */}
                      {prospect.last_interaction_at ? (
                        <time
                          dateTime={prospect.last_interaction_at}
                          title={formatDateHeure(prospect.last_interaction_at, {
                            timeZone: fuseau,
                          })}
                        >
                          {formatDistance(prospect.last_interaction_at)}
                        </time>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-muted-foreground text-xs">
        {formatNombre(prospects.length)} affiché
        {prospects.length > 1 ? "s" : ""} sur {formatNombre(total)}.
      </p>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { LoaderCircle, UserCog } from "lucide-react";
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
import type { Prospect, User } from "@/lib/types";

/**
 * Liste des prospects, avec sélection pour la réaffectation en masse.
 *
 * La réaffectation est une décision d'encadrement (§10.3) : la colonne de
 * sélection n'apparaît pas pour un commercial, qui ne peut de toute façon pas
 * la déclencher côté API.
 */
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
                  <TableHead>Commercial</TableHead>
                  <TableHead>Dernière interaction</TableHead>
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
                        <Link
                          href={`/prospects/${prospect.id}`}
                          className="block truncate font-medium hover:underline"
                        >
                          {prospect.full_name}
                        </Link>
                        <p className="text-muted-foreground truncate text-xs">
                          {prospect.company_name ??
                            prospect.phone ??
                            prospect.email ??
                            "Sans coordonnée"}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell>
                      {prospect.stage ? (
                        <StageChip stage={prospect.stage} />
                      ) : null}
                    </TableCell>

                    <TableCell className="text-sm">
                      {prospect.assigned_user?.name ?? (
                        <span className="text-muted-foreground italic">
                          Non affecté
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="text-muted-foreground text-sm">
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

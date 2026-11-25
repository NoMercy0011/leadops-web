"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle, Upload } from "lucide-react";
import { toast } from "sonner";

import { importProspects, type ActionState } from "./actions";
import { ChampSelect } from "@/components/form-fields";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ImportReport, Project } from "@/lib/types";

type EtatImport = ActionState & { report?: ImportReport };

const INITIAL: EtatImport = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} aria-busy={pending}>
      {pending ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : null}
      Importer
    </Button>
  );
}

/**
 * Import CSV.
 *
 * La boîte reste ouverte après l'envoi, contrairement aux autres formulaires :
 * le rapport d'import est le résultat utile, et le refermer ferait disparaître
 * la liste des lignes rejetées — donc la seule information permettant de
 * corriger le fichier.
 *
 * Deux points d'appel, une seule boîte. Depuis la liste des prospects, le
 * projet de destination se choisit ; depuis une fiche projet, il est connu et
 * le sélecteur disparaît. Le dupliquer en deux composants ferait diverger le
 * rapport d'erreurs, qui est la partie délicate.
 */
export function ImportDialog({
  projets,
  projet,
  taille = "default",
}: {
  /** Destinations possibles. Ignoré si `projet` est fourni. */
  projets?: Pick<Project, "id" | "name">[];
  /** Destination imposée : le sélecteur laisse place à un champ caché. */
  projet?: Project;
  taille?: "default" | "sm";
}) {
  const [open, setOpen] = useState(false);

  const [state, formAction] = useActionState(
    async (prev: EtatImport, formData: FormData) => {
      const resultat = await importProspects(prev, formData);

      if (resultat.success) toast.success(resultat.success);
      if (resultat.message) toast.error(resultat.message);

      return resultat;
    },
    INITIAL,
  );

  const rapport = state.report;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={taille === "sm" ? "sm" : "default"}>
          <Upload className="size-4" aria-hidden />
          Importer
        </Button>
      </DialogTrigger>

      <DialogContent className="shadow-dialog sm:max-w-lg">
        <form action={formAction}>
          <DialogHeader>
            <DialogTitle>Importer des prospects</DialogTitle>
            <DialogDescription>
              Fichier CSV, séparé par des virgules ou des points-virgules.
              {projet ? ` Destination : ${projet.name}.` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {projet ? (
              // Le projet est déjà celui de la page : un sélecteur à une seule
              // entrée est un champ de plus à lire, et une occasion de se
              // tromper de destination.
              <input type="hidden" name="project_id" value={projet.id} />
            ) : (
              <ChampSelect
                id="project_id"
                label="Projet de destination"
                required
                defaultValue={projets?.[0]?.id}
              >
                {(projets ?? []).map((destination) => (
                  <option key={destination.id} value={destination.id}>
                    {destination.name}
                  </option>
                ))}
              </ChampSelect>
            )}

            <Field>
              <FieldLabel htmlFor="file">Fichier</FieldLabel>
              <Input id="file" name="file" type="file" accept=".csv,text/csv" required />
              <FieldDescription>
                Colonnes reconnues : prénom, nom, société, téléphone, email,
                adresse, source, notes. Seul le prénom est obligatoire.
              </FieldDescription>
            </Field>

            {rapport ? (
              <div className="space-y-3">
                <Notice
                  variant={rapport.errors.length > 0 ? "warning" : "success"}
                  titre={`${rapport.imported} importé${rapport.imported > 1 ? "s" : ""}, ${rapport.skipped} ignoré${rapport.skipped > 1 ? "s" : ""}`}
                >
                  {rapport.errors.length > 0
                    ? "Les lignes ci-dessous n'ont pas été chargées. Corrigez-les dans votre fichier et relancez l'import : les lignes déjà chargées seront reconnues comme doublons et ignorées."
                    : "Toutes les lignes ont été chargées."}
                </Notice>

                {rapport.errors.length > 0 ? (
                  <ScrollArea className="border-border h-40 rounded-lg border">
                    <ul className="divide-border divide-y text-sm">
                      {rapport.errors.map((erreur) => (
                        <li
                          key={`${erreur.line}-${erreur.message}`}
                          className="flex gap-3 px-3 py-2"
                        >
                          <span className="text-muted-foreground shrink-0 tabular-nums">
                            {/* Numéro tel qu'il apparaît dans le tableur :
                                en-tête en ligne 1, données à partir de la 2. */}
                            L{erreur.line}
                          </span>
                          <span className="min-w-0">{erreur.message}</span>
                        </li>
                      ))}
                    </ul>
                  </ScrollArea>
                ) : null}
              </div>
            ) : null}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Fermer
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

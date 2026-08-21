"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { X } from "lucide-react";

import { NativeSelect } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, User, Variant } from "@/lib/types";

/**
 * Filtres du §11 : projet, variante, commercial, période.
 *
 * L'axe « entreprise » de l'esquisse n'apparaît pas : il est appliqué en amont
 * par le cloisonnement, et l'exposer ici en ferait un filtre contournable.
 *
 * L'état vit dans l'URL : un rapport se partage par lien, et le retour arrière
 * doit ramener la sélection précédente.
 */
export function ReportFilters({
  projets,
  variantes,
  utilisateurs,
  from,
  to,
}: {
  projets: Project[];
  variantes: Variant[];
  utilisateurs: User[];
  from: string;
  to: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function appliquer(cle: string, valeur: string) {
    const suivants = new URLSearchParams(params.toString());

    if (valeur === "") {
      suivants.delete(cle);
    } else {
      suivants.set(cle, valeur);
    }

    startTransition(() => router.replace(`/rapports?${suivants}`));
  }

  const actifs = ["project_id", "variant_id", "user_id", "from", "to"].filter(
    (cle) => params.get(cle),
  );

  return (
    <div
      className="border-border bg-card grid gap-3 rounded-xl border p-4 sm:grid-cols-2 lg:grid-cols-5"
      data-pending={pending || undefined}
    >
      <div className="space-y-1.5">
        <Label htmlFor="from">Du</Label>
        <Input
          id="from"
          type="date"
          defaultValue={from}
          onChange={(e) => appliquer("from", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="to">Au</Label>
        <Input
          id="to"
          type="date"
          defaultValue={to}
          onChange={(e) => appliquer("to", e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="project_id">Projet</Label>
        <NativeSelect
          id="project_id"
          value={params.get("project_id") ?? ""}
          onChange={(e) => appliquer("project_id", e.target.value)}
        >
          <option value="">Tous</option>
          {projets.map((projet) => (
            <option key={projet.id} value={projet.id}>
              {projet.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="variant_id">Variante</Label>
        <NativeSelect
          id="variant_id"
          value={params.get("variant_id") ?? ""}
          onChange={(e) => appliquer("variant_id", e.target.value)}
        >
          <option value="">Toutes</option>
          {variantes.map((variante) => (
            <option key={variante.id} value={variante.id}>
              {variante.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="user_id">Commercial</Label>
        <NativeSelect
          id="user_id"
          value={params.get("user_id") ?? ""}
          onChange={(e) => appliquer("user_id", e.target.value)}
        >
          <option value="">Tous</option>
          {utilisateurs.map((membre) => (
            <option key={membre.id} value={membre.id}>
              {membre.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      {actifs.length > 0 ? (
        <div className="sm:col-span-2 lg:col-span-5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startTransition(() => router.replace("/rapports"))}
          >
            <X className="size-4" aria-hidden />
            Réinitialiser les filtres
          </Button>
        </div>
      ) : null}
    </div>
  );
}

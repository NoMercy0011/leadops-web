"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Search, X } from "lucide-react";

import { NativeSelect } from "@/components/form-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PipelineStage, Project, User } from "@/lib/types";

/**
 * Filtres de la liste.
 *
 * L'état vit dans l'URL et non dans un `useState` : un commercial qui partage
 * « les prospects non affectés du projet Santé » à son manager doit pouvoir
 * coller un lien, et le retour arrière du navigateur doit ramener le filtre
 * précédent. Un état local ferait perdre les deux.
 */
export function ProspectFilters({
  projets,
  utilisateurs,
  etapes,
}: {
  projets: Project[];
  utilisateurs: User[];
  etapes: PipelineStage[];
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

    // Changer de projet invalide l'étape sélectionnée : les étapes
    // appartiennent à un projet précis, et garder l'ancienne donnerait une
    // liste vide sans que la cause soit visible.
    if (cle === "project_id") {
      suivants.delete("stage_id");
    }

    startTransition(() => {
      router.replace(suivants.size > 0 ? `/prospects?${suivants}` : "/prospects");
    });
  }

  const actifs = ["project_id", "stage_id", "assigned_user_id", "search"].filter(
    (cle) => params.get(cle),
  );

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-pending={pending || undefined}
    >
      <form
        className="relative min-w-56 flex-1"
        action={(formData) =>
          appliquer("search", String(formData.get("search") ?? ""))
        }
      >
        <Search
          className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2"
          aria-hidden
        />
        <Input
          name="search"
          defaultValue={params.get("search") ?? ""}
          placeholder="Nom, société, téléphone, email…"
          aria-label="Rechercher un prospect"
          className="pl-8"
        />
      </form>

      <NativeSelect
        aria-label="Filtrer par projet"
        className="w-auto min-w-40"
        value={params.get("project_id") ?? ""}
        onChange={(e) => appliquer("project_id", e.target.value)}
      >
        <option value="">Tous les projets</option>
        {projets.map((projet) => (
          <option key={projet.id} value={projet.id}>
            {projet.name}
          </option>
        ))}
      </NativeSelect>

      {/* Les étapes ne sont proposées qu'une fois un projet choisi : elles lui
          appartiennent, et une liste mêlant les étapes de tous les projets
          n'aurait aucun sens. */}
      {etapes.length > 0 ? (
        <NativeSelect
          aria-label="Filtrer par étape"
          className="w-auto min-w-36"
          value={params.get("stage_id") ?? ""}
          onChange={(e) => appliquer("stage_id", e.target.value)}
        >
          <option value="">Toutes les étapes</option>
          {etapes.map((etape) => (
            <option key={etape.id} value={etape.id}>
              {etape.name}
            </option>
          ))}
        </NativeSelect>
      ) : null}

      {utilisateurs.length > 0 ? (
        <NativeSelect
          aria-label="Filtrer par commercial"
          className="w-auto min-w-40"
          value={params.get("assigned_user_id") ?? ""}
          onChange={(e) => appliquer("assigned_user_id", e.target.value)}
        >
          <option value="">Tous les commerciaux</option>
          <option value="none">Non affectés</option>
          {utilisateurs.map((membre) => (
            <option key={membre.id} value={membre.id}>
              {membre.name}
            </option>
          ))}
        </NativeSelect>
      ) : null}

      {actifs.length > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => startTransition(() => router.replace("/prospects"))}
        >
          <X className="size-4" aria-hidden />
          Réinitialiser
        </Button>
      ) : null}
    </div>
  );
}

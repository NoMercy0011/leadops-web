"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { NativeSelect } from "@/components/form-fields";
import type { Project } from "@/lib/types";

/**
 * Choix du projet affiché.
 *
 * Le kanban porte sur un seul projet, les étapes lui appartenant. Ce n'est pas
 * un filtre parmi d'autres mais le cadre de l'écran : d'où un sélecteur dans
 * l'en-tête plutôt qu'une barre de filtres.
 */
export function ProjectPicker({
  projets,
  actif,
}: {
  projets: Project[];
  actif: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label="Projet affiché"
      className="w-auto min-w-44"
      value={actif}
      disabled={pending}
      onChange={(e) =>
        startTransition(() =>
          router.replace(`/prospects/kanban?project_id=${e.target.value}`),
        )
      }
    >
      {projets.map((projet) => (
        <option key={projet.id} value={projet.id}>
          {projet.name}
        </option>
      ))}
    </NativeSelect>
  );
}

import { FamilleFiltre } from "@/components/filtres";
import type { Project } from "@/lib/types";

/**
 * Choix du projet affiché.
 *
 * Le kanban porte sur un seul projet, les étapes lui appartenant. Ce n'est pas
 * un filtre parmi d'autres mais le cadre de l'écran : les jetons vivent donc
 * dans l'en-tête, sans la carte qui entoure les barres de filtres ailleurs.
 *
 * Pas de choix « Tous » ici, contrairement aux autres familles : un kanban sans
 * projet n'aurait pas de colonnes, les étapes étant propres à chaque projet.
 */
export function ProjectPicker({
  projets,
  actif,
  parametres,
}: {
  projets: Pick<Project, "id" | "name">[];
  actif: number;
  parametres: URLSearchParams;
}) {
  return (
    <FamilleFiltre
      libelle="Projet"
      parametre="project_id"
      options={projets.map((projet) => ({
        valeur: String(projet.id),
        libelle: projet.name,
      }))}
      valeurActive={String(actif)}
      base="/prospects/kanban"
      parametres={parametres}
    />
  );
}

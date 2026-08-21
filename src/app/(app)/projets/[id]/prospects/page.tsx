import { Users } from "lucide-react";

import { ProspectFilters } from "@/app/(app)/prospects/prospect-filters";
import { ProspectSummaryStrip } from "@/app/(app)/prospects/prospect-summary";
import { ProspectTable } from "@/app/(app)/prospects/prospect-table";
import { EmptyState } from "@/components/empty-state";
import { requireUser } from "@/lib/dal";
import { getProject, listCompanyUsers } from "@/lib/projects";
import { listProspects } from "@/lib/prospects";

const AUCUN_UTILISATEUR = {
  data: [],
  meta: { current_page: 1, last_page: 1, total: 0 },
};

/**
 * Prospects du projet.
 *
 * La même liste que `/prospects`, bornée à un projet — mêmes composants, mêmes
 * filtres, mêmes actions de masse. Les dupliquer aurait produit deux tableaux
 * qui divergent : le jour où l'un gagne une colonne, l'autre ne l'a pas.
 *
 * Le sélecteur de projet est le seul absent : ici le projet est fixé par
 * l'URL, et proposer d'en changer ferait quitter la fiche sans le dire.
 */
export default async function ProspectsDuProjetPage({
  params,
  searchParams,
}: PageProps<"/projets/[id]/prospects">) {
  const user = await requireUser();
  const [{ id }, filtres] = await Promise.all([params, searchParams]);

  const projectId = Number(id);
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const [projet, prospects, utilisateurs] = await Promise.all([
    getProject(projectId),
    listProspects({
      project_id: projectId,
      stage_id: Number(filtres.stage_id) || undefined,
      assigned_user_id:
        typeof filtres.assigned_user_id === "string"
          ? filtres.assigned_user_id
          : undefined,
      search: typeof filtres.search === "string" ? filtres.search : undefined,
      // L'API écarte les archivés par défaut ; les demander explicitement est
      // le seul moyen de les revoir.
      archived: filtres.archived === "1" ? "1" : undefined,
    }),
    encadrement ? listCompanyUsers() : Promise.resolve(AUCUN_UTILISATEUR),
  ]);

  const base = `/projets/${projectId}/prospects`;
  const archives = filtres.archived === "1";

  // Les filtres courants, pour que les tuiles cliquables du résumé
  // restreignent la sélection au lieu de la remplacer.
  const filtresActifs = new URLSearchParams(
    Object.entries(filtres).flatMap(([cle, valeur]) =>
      typeof valeur === "string" && valeur !== "" ? [[cle, valeur]] : [],
    ),
  );

  return (
    <div className="space-y-6">
      {/* Kanban, Archivés, Exporter et Nouveau prospect ne sont pas ici : ils
          remplissent l'emplacement `@actions` du layout, pour tenir dans la
          même rangée que les actions du projet plutôt que d'ouvrir une
          seconde barre de boutons. Voir `@actions/prospects/page.tsx`. */}

      {/* Les chiffres avant la liste : ils disent où porter l'attention, la
          liste dit sur qui. */}
      <ProspectSummaryStrip
        resume={prospects.summary}
        filtres={filtresActifs}
        base={base}
      />

      <ProspectFilters
        projets={[]}
        utilisateurs={utilisateurs.data}
        etapes={projet.stages ?? []}
        facettes={prospects.facets}
        parametres={filtresActifs}
        base={base}
      />

      {prospects.data.length === 0 ? (
        <EmptyState
          icon={Users}
          titre={
            archives ? "Aucun prospect archivé" : "Aucun prospect ne correspond"
          }
          description={
            archives
              ? "Les prospects archivés quittent les listes et sortent des taux, mais restent consultables. Aucun ne l'a été sur ce projet."
              : "Ajustez les filtres, ou ajoutez un premier prospect à ce projet."
          }
        />
      ) : (
        <ProspectTable
          prospects={prospects.data}
          utilisateurs={utilisateurs.data}
          peutReaffecter={encadrement}
          peutArchiver={encadrement}
          fuseau={user.company?.timezone}
          total={prospects.meta.total}
          // Tous les prospects de cet écran partagent un pipeline : l'étape
          // se change donc depuis la liste, sans ouvrir chaque fiche. C'est
          // impossible sur la liste globale, où les projets diffèrent.
          etapes={projet.stages ?? []}
        />
      )}
    </div>
  );
}

import { redirect } from "next/navigation";
import { Users } from "lucide-react";

import { ProspectFilters } from "@/app/(app)/prospects/prospect-filters";
import { ProspectSummaryStrip } from "@/app/(app)/prospects/prospect-summary";
import { ProspectTable } from "@/app/(app)/prospects/prospect-table";
import { EmptyState } from "@/components/empty-state";
import { PaginationListe } from "@/components/pagination-liste";
import { requireUser } from "@/lib/dal";
import { getOptionsFiltres } from "@/lib/options";
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
      page: Math.max(1, Number.parseInt(String(filtres.page ?? "1"), 10) || 1),
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
  // Sans `page` (revue du lot 10) : changer de filtre repart de la première
  // page, faute de quoi la page 5 d'un nouveau filtre d'une seule page
  // s'affichait vide.
  const filtresActifs = new URLSearchParams(
    Object.entries(filtres).flatMap(([cle, valeur]) =>
      cle !== "page" && typeof valeur === "string" && valeur !== "" ? [[cle, valeur]] : [],
    ),
  );

  // Une page au-delà de la dernière (`?page=999`) revient à la dernière
  // (revue du lot 10) : l'écran tombait sur l'état vide, sans pagination.
  if (prospects.data.length === 0 && prospects.meta.total > 0) {
    const suivants = new URLSearchParams(filtresActifs);
    suivants.set("page", String(prospects.meta.last_page));
    redirect(`${`/projets/${projectId}/prospects`}?${suivants.toString()}`);
  }

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
        <>
<ProspectTable
          prospects={prospects.data}
          utilisateurs={encadrement ? (await getOptionsFiltres()).users : []}
          peutReaffecter={encadrement}
          peutArchiver={encadrement}
          projetArchive={projet.status === "archived"}
          fuseau={user.company?.timezone}
          total={prospects.meta.total}
          // Tous les prospects de cet écran partagent un pipeline : l'étape
          // se change donc depuis la liste, sans ouvrir chaque fiche. C'est
          // impossible sur la liste globale, où les projets diffèrent.
          etapes={projet.stages ?? []}
        />
        <PaginationListe
          base={`/projets/${projectId}/prospects`}
          filtres={filtres}
          page={prospects.meta.current_page}
          derniere={prospects.meta.last_page}
          total={prospects.meta.total}
        />
</>
      )}
    </div>
  );
}

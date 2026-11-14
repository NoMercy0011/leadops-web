import Link from "next/link";
import { Archive, Columns3 } from "lucide-react";

import { CreateProspectDialog } from "@/app/(app)/prospects/create-prospect-dialog";
import { ImportDialog } from "@/app/(app)/prospects/import-dialog";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/dal";
import { getProject, listCompanyUsers } from "@/lib/projects";

const AUCUN_UTILISATEUR = {
  data: [],
  meta: { current_page: 1, last_page: 1, total: 0 },
};

/**
 * Actions propres à la section Prospects, remontées dans l'en-tête du projet.
 *
 * **Pourquoi une route parallèle.** Ces commandes n'ont de sens que sur cette
 * section, mais doivent s'afficher dans la même rangée que celles du projet —
 * sinon l'écran empile deux barres de boutons pour un seul geste à faire. Les
 * déclarer dans le layout obligerait celui-ci à charger la liste des
 * commerciaux pour les *cinq* sections, y compris celles qui n'en ont que
 * faire. L'emplacement `@actions` renverse la charge : chaque section remplit
 * le sien, et ne coûte qu'à elle-même.
 *
 * `getProject` et `listCompanyUsers` sont mémoïsés le temps du rendu : la page
 * de la section les réclame aussi, et l'appel n'a donc lieu qu'une fois.
 */
export default async function ActionsProspects({
  params,
  searchParams,
}: PageProps<"/projets/[id]/prospects">) {
  const user = await requireUser();
  const [{ id }, filtres] = await Promise.all([params, searchParams]);

  const projectId = Number(id);
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const [projet, utilisateurs] = await Promise.all([
    getProject(projectId),
    encadrement ? listCompanyUsers() : Promise.resolve(AUCUN_UTILISATEUR),
  ]);

  const base = `/projets/${projectId}/prospects`;
  const archives = filtres.archived === "1";

  // L'export reprend la vue affichée : les archivés quand on les regarde
  // (lot 9, faille F17). Le relais transmet le paramètre à l'API.
  const exporter = new URLSearchParams({ project_id: String(projectId) });
  if (archives) exporter.set("archived", "1");

  return (
    <>
      {/* L'import rejoint les actions de l'onglet Prospects (planche du lot 9,
          S-01) : il n'avait rien à faire sur les autres onglets. Il n'est
          proposé que si le projet accepte des prospects — l'API le refuse sur
          un projet suspendu, terminé ou archivé. */}
      {encadrement && projet.accepts_new_prospects ? (
        <ImportDialog projet={projet} taille="sm" />
      ) : null}

      <Button asChild variant="outline" size="sm">
        <Link href={`/prospects/kanban?project_id=${projectId}`}>
          <Columns3 className="size-4" aria-hidden />
          Kanban
        </Link>
      </Button>

      <Button asChild variant={archives ? "secondary" : "outline"} size="sm">
        <Link href={archives ? base : `${base}?archived=1`}>
          <Archive className="size-4" aria-hidden />
          {/* « Voir les archivés » et non « Archivés » : sur la même rangée
              qu'« Archiver », le seul participe se lisait comme une action
              (décision P4). */}
          {archives ? "Voir les actifs" : "Voir les archivés"}
        </Link>
      </Button>

      <Button asChild variant="outline" size="sm">
        <a href={`/api/prospects/export?${exporter.toString()}`}>Exporter</a>
      </Button>

      {/* Un projet fermé refuse les créations côté API : offrir le bouton
          mènerait à un échec annoncé. */}
      {projet.accepts_new_prospects ? (
        <CreateProspectDialog
          projets={[projet]}
          utilisateurs={utilisateurs.data}
          taille="sm"
        />
      ) : null}
    </>
  );
}

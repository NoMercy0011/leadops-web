import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OngletsProjet } from "./onglets-projet";
import { EditProjectDialog, ProjectStatusActions } from "./project-actions";
import { ImportDialog } from "@/app/(app)/prospects/import-dialog";
import { LibelleFilAriane } from "@/components/fil-ariane";
import { Notice } from "@/components/notice";
import { StatusBadge, type Tone } from "@/components/status-badge";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { getProject, listVariants } from "@/lib/projects";
import type { Project, ProjectStatus } from "@/lib/types";

const TONS: Record<ProjectStatus, Tone> = {
  active: "success",
  suspended: "warning",
  completed: "neutral",
  archived: "neutral",
};

/**
 * Charge le projet, ou renvoie vers la page 404.
 *
 * 403 et 404 mènent au même écran : les distinguer confirmerait l'existence
 * d'un projet à qui n'y a pas accès. `getProject` est mémoïsé le temps du
 * rendu, si bien que le layout, `generateMetadata` et la page de section se
 * partagent un seul appel.
 */
async function chargerProjet(id: string): Promise<Project> {
  const projectId = Number(id);

  if (!Number.isInteger(projectId)) {
    notFound();
  }

  try {
    return await getProject(projectId);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }
}

export async function generateMetadata({
  params,
}: LayoutProps<"/projets/[id]">): Promise<Metadata> {
  const { id } = await params;

  // Le nom du projet plutôt que « Projet » : c'est ce qui distingue deux
  // onglets de navigateur ouverts côte à côte, situation courante dès qu'on
  // compare deux projets.
  //
  // Sans `try`/`catch`, délibérément : `notFound()` signale son intention en
  // levant une erreur, et l'intercepter ici laissait Next répondre 200 en
  // servant la page « introuvable ». Un robot d'indexation, un cache ou un
  // moniteur y auraient lu une page valide.
  const projet = await chargerProjet(id);

  return { title: projet.name };
}

/**
 * Cadre commun aux cinq sections de la fiche projet.
 *
 * Ce qui identifie le projet — son nom, son état, ses actions — appartient au
 * layout : il persiste d'une section à l'autre sans être redessiné, et React
 * ne remonte que le contenu. Ce qui est propre à une section vit dans sa page,
 * et n'est donc chargé que si on l'ouvre. C'est la raison d'être du découpage
 * en routes plutôt qu'en onglets clients : ouvrir un projet ne réclame plus
 * les sept appels d'API que l'ancienne page unique déclenchait d'un bloc.
 */
export default async function LayoutFicheProjet({
  children,
  params,
}: LayoutProps<"/projets/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const projet = await chargerProjet(id);

  const editable = user.role === "admin_client";
  const encadrement = user.role === "admin_client" || user.role === "manager";

  // Les variantes ne servent qu'au dialogue de modification : les charger pour
  // qui ne peut pas modifier serait une requête pour rien.
  const variantes = editable ? await listVariants() : [];

  return (
    <div className="space-y-6">
      {/* Donne son nom réel au segment d'identifiant du fil d'Ariane :
          « #12 » n'apprend rien à personne. */}
      <LibelleFilAriane segment={String(projet.id)} nom={projet.name} />

      {/* Bandeau d'identité, resserré.

          La navigation passe au-dessus du titre : c'est elle qu'on vient
          chercher en revenant sur la fiche, alors que le nom du projet est
          déjà connu de qui a cliqué pour l'ouvrir. Le titre et ses actions
          restent juste en dessous, dans une seule ligne d'un cran plus petite
          que l'en-tête commun du produit — cinq sections gagnent à ce que le
          cadre coûte quelques dizaines de pixels, pas deux cents. */}
      <div className="space-y-3">
        {/* Le plan et les plafonds sont une affaire de gestion : l'API en
            réserve la lecture à l'Admin Client, l'onglet ne lui est donc
            proposé qu'à lui. Seules des données franchissent la frontière —
            une icône est une fonction, que rien ne saurait sérialiser. */}
        <OngletsProjet projectId={projet.id} avecAbonnement={editable} />

        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-0.5">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="font-heading truncate text-lg font-semibold tracking-tight">
                {projet.name}
              </h1>

              {/* L'état qualifie le projet, il ne s'actionne pas : sa place
                  est contre le titre, pas dans la rangée de boutons où il
                  se lisait comme une commande de plus. */}
              <StatusBadge tone={TONS[projet.status]}>
                {projet.status_label}
              </StatusBadge>
            </div>

            <p className="text-muted-foreground text-xs leading-snug">
              {projet.product ?? "Produit non renseigné"}
              {projet.target ? ` · Cible : ${projet.target}` : null}
              {projet.variant ? ` · Variante : ${projet.variant.name}` : null}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {/* L'import n'est proposé que si le projet accepte des prospects :
                l'API le refuse sur un projet suspendu, terminé ou archivé, et
                offrir le bouton mènerait à un échec annoncé. */}
            {encadrement && projet.accepts_new_prospects ? (
              <ImportDialog projet={projet} taille="sm" />
            ) : null}

            {/* Modifier et changer d'état sont réservés à l'Admin Client par
                la policy. Le front masque, l'API tranche. */}
            {editable ? (
              <>
                <EditProjectDialog projet={projet} variantes={variantes} />
                <ProjectStatusActions projet={projet} />
              </>
            ) : null}
          </div>
        </header>
      </div>

      {/* L'état du projet conditionne la lecture de toutes les sections : il
          se dit une fois, au-dessus du contenu, plutôt que répété dans
          chacune. */}
      {projet.status === "archived" ? (
        <Notice variant="info" titre="Projet archivé">
          Il ne figure plus dans la liste des projets et n&apos;accepte plus de
          nouveaux prospects. Ses données restent intactes — rien n&apos;a été
          supprimé, et l&apos;archivage se défait.
        </Notice>
      ) : !projet.accepts_new_prospects ? (
        <Notice variant="warning" titre="Projet fermé aux nouveaux prospects">
          Les données existantes restent consultables et exportables.
        </Notice>
      ) : null}

      {children}
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { OngletsProjet } from "./onglets-projet";
import { EditProjectDialog, ProjectStatusActions } from "./project-actions";
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
  actions,
  params,
}: LayoutProps<"/projets/[id]">) {
  const user = await requireUser();
  const { id } = await params;

  const projet = await chargerProjet(id);

  const editable = user.role === "admin_client";

  // Les variantes ne servent qu'au dialogue de modification : les charger pour
  // qui ne peut pas modifier serait une requête pour rien.
  const variantes = editable ? await listVariants() : [];

  return (
    <div className="space-y-6">
      {/* Donne son nom réel au segment d'identifiant du fil d'Ariane :
          « #12 » n'apprend rien à personne. */}
      <LibelleFilAriane segment={String(projet.id)} nom={projet.name} />

      {/* Une seule bande d'en-tête : identité à gauche, actions et navigation
          empilées à droite, le tout au-dessus d'un unique filet.

          La navigation occupait auparavant sa propre ligne, dont les trois
          quarts droits restaient vides pendant que le titre en réclamait une
          seconde juste en dessous. Les deux tiennent désormais côte à côte, et
          la bande ne coûte plus que la hauteur du bloc d'identité.

          Le passage en colonnes n'intervient qu'à `lg` : plus tôt, le titre
          rognerait la place des onglets, qui se mettraient à défiler
          horizontalement — troquer une ligne visible contre des sections
          cachées serait un mauvais échange. */}
      <header className="flex flex-col gap-3 border-b lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="min-w-0 space-y-0.5 lg:pb-3">
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="font-heading truncate text-lg font-semibold tracking-tight">
              {projet.name}
            </h1>

            {/* L'état qualifie le projet, il ne s'actionne pas : sa place est
                contre le titre, pas dans la rangée de boutons où il se lisait
                comme une commande de plus.

                La pastille bat quand le projet est actif : l'aplat vert clair
                est très pâle en thème clair, et « Actif » s'y effaçait au
                point qu'on ne savait plus s'il l'était. Les autres états sont
                des arrêts, pas un fonctionnement en cours — ils n'ont rien à
                signaler du coin de l'œil, et le bandeau qui suit les explique
                déjà. */}
            <StatusBadge
              tone={TONS[projet.status]}
              pulse={projet.status === "active"}
            >
              {projet.status_label}
            </StatusBadge>
          </div>

          <p className="text-muted-foreground text-xs leading-snug">
            {projet.product ?? "Produit non renseigné"}
            {projet.target ? ` · Cible : ${projet.target}` : null}
            {projet.variant ? ` · Variante : ${projet.variant.name}` : null}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-2 lg:items-end">
          {/* Une seule rangée pour les deux familles d'actions : celles du
              projet, valables partout, puis celles de la section ouverte,
              fournies par l'emplacement `@actions`. Empilées sur deux lignes,
              elles coûtaient deux fois la hauteur pour un seul geste à faire ;
              réunies, elles ne se replient que si la fenêtre l'impose.
              L'action principale de la section ferme la marche, comme sur les
              autres écrans du produit. */}
          <div className="flex flex-wrap items-center gap-2 lg:justify-end">
            {/* Modifier et changer d'état sont réservés à l'Admin Client par
                la policy. Le front masque, l'API tranche. */}
            {editable ? (
              <>
                <EditProjectDialog projet={projet} variantes={variantes} />
                <ProjectStatusActions projet={projet} />
              </>
            ) : null}

            {actions}
          </div>

          {/* Les mêmes onglets pour tous les rôles (lot 9, décision P2 :
              l'abonnement vit dans Paramètres). Seules des données
              franchissent la frontière — une icône est une fonction, que rien
              ne saurait sérialiser. */}
          <OngletsProjet projectId={projet.id} />
        </div>
      </header>

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

import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { AgendaSummary } from "@/app/(app)/calendrier/agenda-summary";
import { AgendaList, MonthGrid } from "@/app/(app)/calendrier/month-grid";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { resumeAgenda } from "@/lib/agenda";
import { listAppointments } from "@/lib/appointments";
import { requireUser } from "@/lib/dal";
import { aujourdhui } from "@/lib/format";

/**
 * Mois affiché, sous la forme `AAAA-MM`.
 *
 * Le mois vit dans l'URL et non dans un état local : revenir en arrière doit
 * ramener le mois précédemment consulté, et un lien collé dans une
 * conversation doit rouvrir le même écran.
 */
function moisValide(valeur: unknown, defaut: string): string {
  return typeof valeur === "string" && /^\d{4}-\d{2}$/.test(valeur)
    ? valeur
    : defaut;
}

function decaler(mois: string, pas: number): string {
  const [annee, m] = mois.split("-").map(Number);
  const date = new Date(Date.UTC(annee, m - 1 + pas, 1));

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Bornes à demander à l'API, en dates **locales** `AAAA-MM-JJ`.
 *
 * La grille déborde sur les mois voisins : la plage couvre donc une semaine de
 * part et d'autre, sans quoi les premières et dernières cases resteraient vides
 * alors qu'elles portent des rendez-vous.
 */
function bornes(mois: string): { from: string; to: string } {
  const [annee, m] = mois.split("-").map(Number);

  const debut = new Date(Date.UTC(annee, m - 1, 1));
  debut.setUTCDate(debut.getUTCDate() - 7);

  const fin = new Date(Date.UTC(annee, m, 0));
  fin.setUTCDate(fin.getUTCDate() + 7);

  return {
    from: debut.toISOString().slice(0, 10),
    to: fin.toISOString().slice(0, 10),
  };
}

/**
 * Rendez-vous du projet.
 *
 * Vue mensuelle en lecture seule, avec les deux chevrons pour parcourir les
 * mois. Les rendez-vous ne se créent pas ici mais depuis la fiche d'un
 * prospect : ils y héritent de son projet et de son commercial, alors qu'un
 * formulaire posé sur le calendrier obligerait à ressaisir les deux — et à
 * traiter le cas où ils se contredisent.
 */
export default async function RendezVousDuProjetPage({
  params,
  searchParams,
}: PageProps<"/projets/[id]/rendez-vous">) {
  const user = await requireUser();
  const [{ id }, filtres] = await Promise.all([params, searchParams]);

  const projectId = Number(id);
  const fuseau = user.company?.timezone;

  // Le mois par défaut est le mois local de l'entreprise, pas celui du
  // serveur : à Antananarivo, un serveur en UTC bascule de mois trois heures
  // trop tard.
  const ceJour = aujourdhui({ timeZone: fuseau });
  const mois = moisValide(filtres.mois, ceJour.slice(0, 7));

  const rendezVous = await listAppointments({
    project_id: projectId,
    ...bornes(mois),
  });

  const [annee, numeroMois] = mois.split("-").map(Number);
  const resume = resumeAgenda(rendezVous, { fuseau, ceJour });

  const base = `/projets/${projectId}/rendez-vous`;
  const libelleMois = new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(annee, numeroMois - 1, 1)));

  return (
    <div className="space-y-6">
      {/* Les chiffres avant la grille : sans eux, un rendez-vous passé resté
          « planifié » se découvre en parcourant les mois un à un. */}
      {rendezVous.length > 0 ? <AgendaSummary resume={resume} /> : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
          <CardTitle className="first-letter:uppercase">
            {libelleMois}
          </CardTitle>

          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="icon-sm">
              <Link
                href={`${base}?mois=${decaler(mois, -1)}`}
                aria-label="Mois précédent"
              >
                <ChevronLeft className="size-4" aria-hidden />
              </Link>
            </Button>

            {/* Le retour au mois courant n'apparaît que si on l'a quitté :
                un bouton qui ne fait rien apprend à ignorer les boutons. */}
            {mois !== ceJour.slice(0, 7) ? (
              <Button asChild variant="ghost" size="sm">
                <Link href={base}>Ce mois-ci</Link>
              </Button>
            ) : null}

            <Button asChild variant="ghost" size="icon-sm">
              <Link
                href={`${base}?mois=${decaler(mois, 1)}`}
                aria-label="Mois suivant"
              >
                <ChevronRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <MonthGrid
            annee={annee}
            mois={numeroMois - 1}
            rendezVous={rendezVous}
            fuseau={fuseau}
          />
        </CardContent>
      </Card>

      {rendezVous.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          titre="Aucun rendez-vous ce mois-ci"
          description="Les rendez-vous se planifient depuis la fiche d'un prospect : ils héritent alors de son projet et de son commercial."
        />
      ) : (
        // La grille montre la répartition, la liste montre le détail : dans
        // une case de calendrier, l'heure et l'objet d'un rendez-vous sont
        // tronqués dès qu'il y en a deux le même jour.
        <AgendaList rendezVous={rendezVous} fuseau={fuseau} />
      )}
    </div>
  );
}

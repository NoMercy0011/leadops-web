import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { AgendaSummary } from "./agenda-summary";
import { CalendarControls } from "./calendar-controls";
import { AgendaList, MonthGrid } from "./month-grid";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { resumeAgenda } from "@/lib/agenda";
import { listAppointments } from "@/lib/appointments";
import { requireUser } from "@/lib/dal";
import { aujourdhui } from "@/lib/format";
import { listCompanyUsers, listProjects } from "@/lib/projects";

export const metadata: Metadata = {
  title: "Calendrier",
};

type Vue = "jour" | "semaine" | "mois";

/**
 * Bornes de la période affichée, en dates **locales** `AAAA-MM-JJ`.
 *
 * Ce sont des dates et non des instants : l'API les interprète dans le fuseau
 * de l'entreprise. Envoyer un instant ISO ferait déraper la journée d'autant
 * d'heures que le décalage.
 */
function bornes(vue: Vue, ancre: string): { from: string; to: string } {
  const [annee, mois, jour] = ancre.split("-").map(Number);
  const reference = new Date(Date.UTC(annee, mois - 1, jour));

  if (vue === "jour") {
    return { from: ancre, to: ancre };
  }

  if (vue === "semaine") {
    // Semaine du lundi au dimanche : `getUTCDay()` renvoie 0 pour dimanche,
    // qu'on ramène en fin de semaine.
    const decalage = (reference.getUTCDay() + 6) % 7;
    const lundi = new Date(reference);
    lundi.setUTCDate(reference.getUTCDate() - decalage);

    const dimanche = new Date(lundi);
    dimanche.setUTCDate(lundi.getUTCDate() + 6);

    return {
      from: lundi.toISOString().slice(0, 10),
      to: dimanche.toISOString().slice(0, 10),
    };
  }

  // La grille mensuelle déborde sur les mois voisins : la plage couvre donc
  // une semaine de part et d'autre, sans quoi les premières et dernières
  // cases resteraient vides alors qu'elles portent des rendez-vous.
  const debut = new Date(Date.UTC(annee, mois - 1, 1));
  debut.setUTCDate(debut.getUTCDate() - 7);

  const fin = new Date(Date.UTC(annee, mois, 0));
  fin.setUTCDate(fin.getUTCDate() + 7);

  return {
    from: debut.toISOString().slice(0, 10),
    to: fin.toISOString().slice(0, 10),
  };
}

export default async function CalendrierPage({
  searchParams,
}: PageProps<"/calendrier">) {
  const user = await requireUser();
  const params = await searchParams;

  const fuseau = user.company?.timezone;
  const encadrement = user.role === "admin_client" || user.role === "manager";

  const vue: Vue =
    params.vue === "jour" || params.vue === "semaine" ? params.vue : "mois";

  // L'ancre par défaut est la journée locale, pas celle du serveur.
  const ancre =
    typeof params.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.date)
      ? params.date
      : aujourdhui({ timeZone: fuseau });

  const plage = bornes(vue, ancre);

  const [rendezVous, projets, utilisateurs] = await Promise.all([
    listAppointments({
      ...plage,
      user_id:
        typeof params.user_id === "string" ? params.user_id : undefined,
      project_id: Number(params.project_id) || undefined,
      status: typeof params.status === "string" ? params.status : undefined,
    }),
    listProjects(),
    encadrement
      ? listCompanyUsers()
      : Promise.resolve({ data: [], meta: { current_page: 1, last_page: 1, total: 0 } }),
  ]);

  const [annee, mois] = ancre.split("-").map(Number);

  const resume = resumeAgenda(rendezVous, {
    fuseau,
    ceJour: aujourdhui({ timeZone: fuseau }),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Calendrier"
        description={
          <>
            Rendez-vous de votre périmètre, affichés dans le fuseau de
            l&apos;entreprise ({fuseau ?? "par défaut"}).
          </>
        }
      />

      <CalendarControls
        vue={vue}
        ancre={ancre}
        projets={projets.data}
        utilisateurs={utilisateurs.data}
      />

      {/* Les chiffres avant la grille : sans eux, un rendez-vous passé resté
          « planifié » se découvre en parcourant les semaines une à une. */}
      {rendezVous.length > 0 ? <AgendaSummary resume={resume} /> : null}

      {rendezVous.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          titre="Aucun rendez-vous sur cette période"
          description="Les rendez-vous se planifient depuis la fiche d'un prospect : ils héritent alors de son projet et de son commercial."
        />
      ) : vue === "mois" ? (
        <MonthGrid
          annee={annee}
          mois={mois - 1}
          rendezVous={rendezVous}
          fuseau={fuseau}
        />
      ) : (
        <AgendaList rendezVous={rendezVous} fuseau={fuseau} />
      )}
    </div>
  );
}

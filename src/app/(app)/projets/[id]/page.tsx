import {
  CircleCheck,
  CircleSlash,
  PhoneCall,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";

import { DataQualityPanel } from "./data-quality";
import { PipelineHealthPanel } from "./pipeline-health";
import { VariantComparisonPanel } from "./variant-comparison";
import { StatTile } from "@/components/stat-tile";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import {
  getDataQuality,
  getPipelineHealth,
  getProject,
  getVariantComparison,
} from "@/lib/projects";
import { listProspects } from "@/lib/prospects";
import { getReport } from "@/lib/reporting";

/**
 * Tableau de bord du projet.
 *
 * La période demandée court depuis la création du projet, et non sur les
 * trente derniers jours comme le fait l'API par défaut : la question qu'on se
 * pose en ouvrant un projet est « où en est-il », pas « qu'a-t-il produit ce
 * mois-ci ». Un projet lancé il y a six semaines afficherait sinon un taux
 * calculé sur une fraction de son histoire, sans que rien ne le signale — et
 * c'est aussi pourquoi le libellé nomme la période qu'il couvre réellement.
 */
export default async function TableauDeBordProjetPage({
  params,
}: PageProps<"/projets/[id]">) {
  const user = await requireUser();
  const { id } = await params;
  const projectId = Number(id);

  const projet = await getProject(projectId);
  const encadrement = user.role === "admin_client" || user.role === "manager";

  // Sans date de création connue, on laisse l'API retenir sa fenêtre par
  // défaut — trente jours — et le libellé le dit, plutôt que d'annoncer une
  // période que les chiffres ne couvrent pas.
  const depuis = projet.created_at?.slice(0, 10);
  const periode = depuis
    ? "depuis la création du projet"
    : "sur les trente derniers jours";

  // La santé du pipeline, la comparaison et l'audit sont réservés à
  // l'encadrement côté API : les demander pour un commercial produirait un 403
  // à chaque visite.
  const [rapport, prospects, sante, comparaison, qualite] = await Promise.all([
    getReport({ project_id: projectId, from: depuis }),
    // `per_page: 1` : seul le résumé agrégé est utilisé ici, la liste est
    // l'affaire de l'onglet Prospects.
    listProspects({ project_id: projectId, per_page: 1 }),
    encadrement ? getPipelineHealth(projectId) : Promise.resolve(null),
    encadrement ? getVariantComparison(projectId) : Promise.resolve(null),
    encadrement ? getDataQuality(projectId) : Promise.resolve(null),
  ]);

  const totaux = rapport.totals;
  const resume = prospects.summary;

  const versProspects = `/projets/${projet.id}/prospects`;

  return (
    <div className="space-y-6">
      {/* Une seule dominante : le taux de conversion répond à la question
          qu'on se pose en ouvrant un projet. Tout le reste l'explique. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          className="lg:col-span-2"
          taille="lg"
          label="Taux de conversion"
          valeur={rapport.rates.conversion}
          suffixe="%"
          detail={`${totaux.converted} converti${totaux.converted > 1 ? "s" : ""} sur ${totaux.prospects} prospect${totaux.prospects > 1 ? "s" : ""} ${periode}.`}
          icon={TrendingUp}
          accent="success"
        />

        <StatTile
          label="Prospects"
          valeur={resume.total}
          detail={
            resume.non_affectes > 0
              ? `${resume.non_affectes} sans commercial`
              : "Tous affectés"
          }
          icon={Users}
          href={versProspects}
        />

        <StatTile
          label="Relances en retard"
          valeur={resume.en_retard}
          detail="Prochaine action datée, non traitée"
          icon={TriangleAlert}
          // Le seul indicateur de cet écran qui appelle une action
          // aujourd'hui : c'est ce qui justifie de le mettre en évidence, et
          // rien d'autre. Une page où tout est accentué n'accentue rien.
          accent={resume.en_retard > 0 ? "warning" : undefined}
          href={versProspects}
        />
      </div>

      {/* Le second rang est du contexte : exact, utile, mais ce n'est pas ce
          qu'on vient chercher. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          taille="sm"
          label="Taux de qualification"
          valeur={rapport.rates.qualification}
          suffixe="%"
          detail={`${totaux.qualified} qualifié${totaux.qualified > 1 ? "s" : ""}`}
          icon={CircleCheck}
        />
        <StatTile
          taille="sm"
          label="Contactés"
          valeur={totaux.contacted}
          detail="Au moins une interaction"
          icon={PhoneCall}
        />
        <StatTile
          taille="sm"
          label="Perdus"
          valeur={totaux.lost}
          suffixe={rapport.rates.loss !== null ? `· ${rapport.rates.loss} %` : undefined}
          detail="Affaires closes sans suite"
          icon={CircleSlash}
        />
        <StatTile
          taille="sm"
          label="Rendez-vous"
          valeur={totaux.appointments}
          detail={periode.replace(/^./, (c) => c.toUpperCase())}
          href={`/projets/${projet.id}/rendez-vous`}
        />
      </div>

      {sante ? (
        <Card>
          <CardHeader>
            <CardTitle>Santé du pipeline</CardTitle>
            <CardDescription>
              La répartition dit où sont les prospects ; la durée dit où ils
              s&apos;arrêtent. Deux étapes peuvent porter le même nombre de
              dossiers sans appeler la même action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PipelineHealthPanel sante={sante} />
          </CardContent>
        </Card>
      ) : null}

      {comparaison || qualite ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {comparaison ? (
            <Card>
              <CardHeader>
                <CardTitle>Face aux autres offres</CardTitle>
                <CardDescription>
                  Un taux de conversion isolé ne dit rien ; rapporté aux autres
                  projets du même axe, il devient une décision.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VariantComparisonPanel comparaison={comparaison} />
              </CardContent>
            </Card>
          ) : null}

          {qualite ? (
            <Card>
              <CardHeader>
                <CardTitle>Qualité des données</CardTitle>
                <CardDescription>
                  Ces défauts n&apos;empêchent pas de travailler : ils faussent
                  des chiffres.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DataQualityPanel qualite={qualite} />
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

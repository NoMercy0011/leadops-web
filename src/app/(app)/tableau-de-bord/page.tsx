import type { Metadata } from "next";
import Link from "next/link";
import { Flag, Star, TrendingUp, Users } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { StageDistribution } from "@/components/stage-distribution";
import { Apparition, BarreAnimee } from "@/components/tableau-de-bord/animations";
import {
  AFaire,
  Classement,
  EnteteCarte,
  Entonnoir,
  Tendance,
  TuileTendance,
} from "@/components/tableau-de-bord/cartes";
import { CourbeConversions, type Variante } from "@/components/tableau-de-bord/courbe-conversions";
import { Compteur } from "@/components/tableau-de-bord/animations";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDateCourte, formatNombre, prenom } from "@/lib/format";
import { getDashboard, type PeriodeApi } from "@/lib/reporting";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

/**
 * Tableau de bord — lot 12, planche n°12 validée le 25/11/2026.
 *
 * Lu de haut en bas, de la tendance à l'action : tuiles à tendance, courbe et
 * priorités du jour, entonnoir et répartition, équipe et projets. Chaque
 * rangée aligne la hauteur de ses cartes (ajustement A1).
 *
 * La période, la présentation de la courbe et le projet de l'entonnoir vivent
 * dans l'adresse : ils se partagent, et un retour arrière les restitue.
 */
const PERIODES = { "7j": "7d", "30j": "30d", trimestre: "90d" } as const satisfies Record<string, PeriodeApi>;
const LIBELLES_PERIODE = { "7j": "7 jours", "30j": "30 jours", trimestre: "Trimestre" } as const;
const VARIANTES = { aires: "Aires", barres: "Barres", cumul: "Cumul" } as const satisfies Record<Variante, string>;

type CleePeriode = keyof typeof PERIODES;

export default async function TableauDeBordPage({ searchParams }: PageProps<"/tableau-de-bord">) {
  const user = await requireUser();
  const params = await searchParams;

  const periode: CleePeriode =
    typeof params.periode === "string" && params.periode in PERIODES ? (params.periode as CleePeriode) : "30j";
  const variante: Variante =
    typeof params.courbe === "string" && params.courbe in VARIANTES ? (params.courbe as Variante) : "aires";
  const projetEntonnoir = Number(params.entonnoir) || undefined;

  const tableau = await getDashboard({ period: PERIODES[periode], funnelProjectId: projetEntonnoir });

  // Les rapports relèvent de l'encadrement : la page renvoie « introuvable »
  // à un commercial.
  const encadrement = user.role === "admin_client" || user.role === "manager";

  /** Lien qui ne change qu'un paramètre et garde les autres. */
  const avec = (cle: string, valeur: string) => {
    const suivants = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (typeof v === "string" && v !== "") suivants.set(k, v);
    }
    suivants.set(cle, valeur);
    return `/tableau-de-bord?${suivants.toString()}`;
  };

  const precedente = `la période précédente`;
  const { kpis } = tableau;
  const totalConvertis = tableau.series.reduce((s, p) => s + p.converted, 0);
  const totalPerdus = tableau.series.reduce((s, p) => s + p.lost, 0);

  return (
    <div className="space-y-4 text-[13px]">
      <PageHeader
        titre={`Bonjour ${prenom(user.name)}`}
        description={
          <>
            {user.company ? `${user.company.name} · ` : ""}
            {formatNombre(tableau.active_projects)} projet{tableau.active_projects > 1 ? "s" : ""} actif
            {tableau.active_projects > 1 ? "s" : ""} · du {formatDateCourte(tableau.period.from)} au{" "}
            {formatDateCourte(tableau.period.to)}
          </>
        }
        actions={
          <>
            <nav aria-label="Période" className="bg-muted inline-flex gap-0.5 rounded-[10px] p-[3px]">
              {(Object.keys(PERIODES) as CleePeriode[]).map((cle) => (
                <Link
                  key={cle}
                  href={avec("periode", cle)}
                  aria-current={cle === periode ? "page" : undefined}
                  className={cn(
                    "rounded-lg px-3 py-1 text-[13px]",
                    cle === periode
                      ? "bg-card text-card-foreground font-medium shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {LIBELLES_PERIODE[cle]}
                </Link>
              ))}
            </nav>
            {encadrement ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/rapports">Rapports détaillés</Link>
              </Button>
            ) : null}
          </>
        }
      />

      {/* Rangée 1 — les tendances. */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Apparition rang={0}>
          <Card className="h-full">
            <CardContent className="space-y-1 p-4">
              <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
                <TrendingUp className="size-3.5" aria-hidden />
                Taux de conversion
              </p>
              <p className="font-heading text-[22px] font-semibold tabular-nums leading-tight">
                {kpis.conversion_rate.value === null ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  <>
                    <Compteur valeur={kpis.conversion_rate.value} decimales={1} />
                    <span className="text-muted-foreground ml-1 text-base font-normal">%</span>
                  </>
                )}
              </p>
              <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]">
                <Tendance valeur={kpis.conversion_rate.trend_points} unite="pts" />
                {kpis.conversion_rate.trend_points === null ? "pas de base de comparaison" : `vs ${precedente}`}
              </p>
            </CardContent>
          </Card>
        </Apparition>
        <Apparition rang={1}>
          <TuileTendance label="Convertis" icon={Star} kpi={kpis.converted} libellePrecedent={precedente} />
        </Apparition>
        <Apparition rang={2}>
          <TuileTendance label="Perdus" icon={Flag} kpi={kpis.lost} hausseFavorable={false} libellePrecedent={precedente} />
        </Apparition>
        <Apparition rang={3}>
          <TuileTendance label="Nouveaux prospects" icon={Users} kpi={kpis.new_prospects} libellePrecedent={precedente} />
        </Apparition>
      </div>

      {/* Rangée 2 — la courbe et les priorités du jour. */}
      <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Apparition rang={4} className="h-full">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-4">
              <EnteteCarte
                titre="Conversions et pertes"
                description={
                  variante === "barres"
                    ? "Passages à une étape gagnée ou perdue, par semaine : gains au-dessus, pertes en dessous."
                    : variante === "cumul"
                      ? "Passages à une étape gagnée ou perdue, cumulés depuis le début de la période."
                      : tableau.period.granularity === "day"
                        ? "Passages à une étape gagnée ou perdue ; aires lissées sur 7 jours."
                        : "Passages à une étape gagnée ou perdue, par semaine."
                }
                action={
                  <nav aria-label="Présentation de la courbe" className="bg-muted inline-flex shrink-0 gap-0.5 rounded-[10px] p-[3px]">
                    {(Object.keys(VARIANTES) as Variante[]).map((cle) => (
                      <Link
                        key={cle}
                        href={avec("courbe", cle)}
                        scroll={false}
                        aria-current={cle === variante ? "true" : undefined}
                        className={cn(
                          "rounded-lg px-2.5 py-0.5 text-xs",
                          cle === variante
                            ? "bg-card text-card-foreground font-medium shadow-sm"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {VARIANTES[cle]}
                      </Link>
                    ))}
                  </nav>
                }
              />
              <div className="mb-2 flex flex-wrap gap-7">
                <Chiffre libelle="Convertis" valeur={totalConvertis} tendance={<Tendance valeur={kpis.converted.trend} />} />
                <Chiffre libelle="Perdus" valeur={totalPerdus} tendance={<Tendance valeur={kpis.lost.trend} hausseFavorable={false} />} />
                <Chiffre libelle="Solde" valeur={totalConvertis - totalPerdus} signe />
              </div>
              <p className="text-muted-foreground mb-1 flex gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5">
                  <i className="border-chart-1 inline-block w-4 border-t-2" aria-hidden />
                  Convertis
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <i className="border-chart-5 inline-block w-4 border-t-2 border-dashed" aria-hidden />
                  Perdus
                </span>
              </p>
              <CourbeConversions serie={tableau.series} granularite={tableau.period.granularity} variante={variante} />
              <details className="mt-auto pt-2 text-xs">
                <summary className="text-muted-foreground cursor-pointer">Voir les chiffres en tableau</summary>
                <TableauSerie serie={tableau.series} semaine={tableau.period.granularity === "week"} />
              </details>
            </CardContent>
          </Card>
        </Apparition>

        <Apparition rang={5} className="h-full">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-4">
              <EnteteCarte titre="À faire aujourd'hui" description={formatDateCourte(tableau.period.to)} />
              <AFaire aujourdhui={tableau.today} fuseau={tableau.timezone} />
            </CardContent>
          </Card>
        </Apparition>
      </div>

      {/* Rangée 3 — l'entonnoir et la répartition. Les objectifs prendront la
          place de la répartition au lot 13 (planche, S-14). */}
      <div className="grid items-stretch gap-4 lg:grid-cols-2">
        <Apparition rang={6} className="h-full">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-4">
              <EnteteCarte
                titre="Entonnoir du pipeline"
                description="Prospects de la période, par étape la plus avancée atteinte."
                action={
                  tableau.funnel && tableau.funnel.projects.length > 1 ? (
                    <nav aria-label="Projet de l'entonnoir" className="flex max-w-[50%] flex-wrap justify-end gap-1">
                      {tableau.funnel.projects.map((p) => (
                        <Link
                          key={p.id}
                          href={avec("entonnoir", String(p.id))}
                          scroll={false}
                          aria-current={p.id === tableau.funnel?.project.id ? "true" : undefined}
                          className={cn(
                            "truncate rounded-lg px-2 py-0.5 text-xs ring-1",
                            p.id === tableau.funnel?.project.id
                              ? "bg-card ring-ring font-medium"
                              : "text-muted-foreground ring-border hover:text-foreground",
                          )}
                        >
                          {p.name}
                        </Link>
                      ))}
                    </nav>
                  ) : undefined
                }
              />
              {tableau.funnel ? (
                <Entonnoir entonnoir={tableau.funnel} />
              ) : (
                <p className="text-muted-foreground py-8 text-center text-xs">Aucun projet actif dans votre périmètre.</p>
              )}
            </CardContent>
          </Card>
        </Apparition>

        <Apparition rang={7} className="h-full">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-4">
              <EnteteCarte
                titre="Répartition par étape"
                description="Où se trouvent aujourd'hui les prospects, tous projets confondus."
              />
              <StageDistribution etapes={tableau.by_stage} />
            </CardContent>
          </Card>
        </Apparition>
      </div>

      {/* Rangée 4 — l'équipe et les projets. */}
      <div className={cn("grid items-stretch gap-4", tableau.leaderboard ? "lg:grid-cols-2" : "")}>
        {tableau.leaderboard ? (
          <Apparition rang={8} className="h-full">
            <Card className="h-full">
              <CardContent className="flex h-full flex-col p-4">
                <EnteteCarte
                  titre="Commerciaux"
                  description="Votre périmètre, sur la période, triés par conversions. Courbe : les 7 derniers jours."
                />
                <Classement lignes={tableau.leaderboard} />
              </CardContent>
            </Card>
          </Apparition>
        ) : null}

        <Apparition rang={9} className="h-full">
          <Card className="h-full">
            <CardContent className="flex h-full flex-col p-4">
              <EnteteCarte titre="Performance par projet" description="Depuis l'origine de chaque projet, triés par conversion." />
              <TableauProjets lignes={tableau.by_project} />
              {encadrement ? (
                <p className="text-muted-foreground mt-auto pt-3 text-[11px]">
                  Le détail par période est dans les{" "}
                  <Link href="/rapports" className="underline">
                    rapports
                  </Link>
                  .
                </p>
              ) : null}
            </CardContent>
          </Card>
        </Apparition>
      </div>
    </div>
  );
}

function Chiffre({
  libelle,
  valeur,
  tendance,
  signe = false,
}: {
  libelle: string;
  valeur: number;
  tendance?: React.ReactNode;
  signe?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-muted-foreground text-[11px]">{libelle}</span>
      <span className="text-lg leading-tight font-semibold tabular-nums">
        {signe && valeur > 0 ? "+" : signe && valeur < 0 ? "−" : ""}
        {formatNombre(Math.abs(valeur))}
      </span>
      {tendance}
    </div>
  );
}

/** Équivalent texte de la courbe (règle R9). */
function TableauSerie({ serie, semaine }: { serie: { date: string; converted: number; lost: number }[]; semaine: boolean }) {
  return (
    <table className="mt-2 w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="text-muted-foreground text-left text-[10.5px] tracking-[0.06em] uppercase">
          <th className="px-2 pb-2 font-semibold">{semaine ? "Semaine du" : "Jour"}</th>
          <th className="px-2 pb-2 text-right font-semibold">Convertis</th>
          <th className="px-2 pb-2 text-right font-semibold">Perdus</th>
        </tr>
      </thead>
      <tbody>
        {serie.map((p) => (
          <tr key={p.date} className="border-border/60 border-t">
            <td className="px-2 py-1.5">{formatDateCourte(p.date)}</td>
            <td className="px-2 py-1.5 text-right tabular-nums">{p.converted}</td>
            <td className="px-2 py-1.5 text-right tabular-nums">{p.lost}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Tableau allégé (décision n°9) : petites capitales, séparateurs fins, barre de taux. */
function TableauProjets({
  lignes,
}: {
  lignes: { project_id?: number; project?: string; total: number; conversion_rate: number | null }[];
}) {
  if (lignes.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-xs">Aucun projet pour l&apos;instant.</p>;
  }

  const tries = [...lignes].sort((a, b) => (b.conversion_rate ?? -1) - (a.conversion_rate ?? -1));
  const max = Math.max(...tries.map((l) => l.conversion_rate ?? 0), 1);

  return (
    <table className="w-full border-collapse text-[12.5px]">
      <thead>
        <tr className="text-muted-foreground text-left text-[10.5px] tracking-[0.06em] uppercase">
          <th className="px-2 pb-2 font-semibold">Projet</th>
          <th className="px-2 pb-2 text-right font-semibold">Prospects</th>
          <th className="px-2 pb-2 font-semibold">Conversion</th>
        </tr>
      </thead>
      <tbody>
        {tries.map((l) => (
          <tr key={l.project_id ?? l.project} className="border-border/60 hover:bg-muted/50 border-t">
            <td className="px-2 py-2 font-medium">
              {l.project_id ? (
                <Link href={`/projets/${l.project_id}`} className="hover:underline">
                  {l.project}
                </Link>
              ) : (
                l.project
              )}
            </td>
            <td className="px-2 py-2 text-right tabular-nums">{formatNombre(l.total)}</td>
            <td className="px-2 py-2 whitespace-nowrap">
              <span className="bg-muted mr-2 inline-block h-1.5 w-20 overflow-hidden rounded-full align-middle">
                <BarreAnimee largeur={((l.conversion_rate ?? 0) / max) * 100} className="bg-chart-1 h-full rounded-full" />
              </span>
              <span className="font-mono tabular-nums">
                {l.conversion_rate === null ? "—" : `${l.conversion_rate.toLocaleString("fr-FR")} %`}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

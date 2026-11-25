import Link from "next/link";
import { CalendarClock, CircleAlert, Clock3, type LucideIcon } from "lucide-react";

import { BarreAnimee, Compteur } from "@/components/tableau-de-bord/animations";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateCourte, formatHeure, formatNombre, initiales } from "@/lib/format";
import type { DashboardFunnel, DashboardKpi, DashboardToday, LeaderboardRow } from "@/lib/reporting";
import { cn } from "@/lib/utils";

/**
 * Cartes du tableau de bord — lot 12, planche n°12 (S-12), validée le
 * 25/11/2026. Rendu serveur ; seules les animations sont côté client.
 *
 * Densité réduite d'un cran (décision n°7) : texte de 13 px, titres de carte
 * à 14 px, détails à 11 px. Limité au tableau de bord.
 */

/** En-tête commun : titre, description, et une action à droite. */
export function EnteteCarte({
  titre,
  description,
  action,
}: {
  titre: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-3.5 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-snug">{titre}</h2>
        {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

/**
 * Pastille de tendance. La flèche dit le sens du chiffre, la couleur dit si
 * c'est une bonne nouvelle (décision n°3) : `hausseFavorable` vaut `false`
 * pour les pertes. Sans base : « — », jamais un pourcentage inventé.
 */
export function Tendance({
  valeur,
  unite = "%",
  hausseFavorable = true,
}: {
  valeur: number | null;
  unite?: "%" | "pts";
  hausseFavorable?: boolean;
}) {
  if (valeur === null) {
    return (
      <span className="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 text-[11px] font-medium">
        —
      </span>
    );
  }

  const hausse = valeur > 0;
  const stable = valeur === 0;
  const bonne = stable ? null : hausse === hausseFavorable;
  const texte = `${hausse ? "▲" : stable ? "=" : "▼"} ${Math.abs(valeur).toLocaleString("fr-FR")}${unite === "pts" ? " pts" : " %"}`;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 text-[11px] font-medium tabular-nums",
        bonne === null && "bg-muted text-muted-foreground",
        bonne === true && "bg-success-subtle text-success-subtle-foreground",
        bonne === false && "bg-destructive-subtle text-destructive-subtle-foreground",
      )}
    >
      <span aria-hidden>{texte}</span>
      <span className="sr-only">
        {stable ? "stable" : `${hausse ? "en hausse" : "en baisse"} de ${Math.abs(valeur).toLocaleString("fr-FR")} ${unite === "pts" ? "points" : "%"}`}
      </span>
    </span>
  );
}

export function TuileTendance({
  label,
  icon: Icone,
  kpi,
  hausseFavorable = true,
  libellePrecedent,
}: {
  label: string;
  icon: LucideIcon;
  kpi: DashboardKpi;
  hausseFavorable?: boolean;
  libellePrecedent: string;
}) {
  return (
    <Card className="h-full">
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-medium">
          <Icone className="size-3.5" aria-hidden />
          {label}
        </p>
        <p className="font-heading text-[22px] font-semibold tabular-nums leading-tight">
          <Compteur valeur={kpi.value} />
        </p>
        <p className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-[11px]">
          <Tendance valeur={kpi.trend} hausseFavorable={hausseFavorable} />
          {kpi.trend === null ? "pas de période précédente" : `${formatNombre(kpi.previous)} ${libellePrecedent}`}
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Entonnoir centré : la largeur suit le nombre, l'intensité monte d'étape en
 * étape (une seule teinte). Entre deux étapes, le taux de passage ; la plus
 * forte chute est signalée.
 */
export function Entonnoir({ entonnoir }: { entonnoir: DashboardFunnel }) {
  const etapes = entonnoir.stages;
  const max = etapes[0]?.reached ?? 0;

  if (max === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-xs">
        Aucun nouveau prospect sur la période dans ce projet.
      </p>
    );
  }

  const taux = etapes.map((e) => e.pass_rate);
  const valides = taux.filter((t): t is number => t !== null);
  const pire = valides.length > 0 ? taux.indexOf(Math.min(...valides)) : -1;
  const dernier = etapes[etapes.length - 1];

  return (
    <>
      <ol className="flex flex-col items-center" aria-label={`Entonnoir du projet ${entonnoir.project.name}`}>
        {etapes.map((e, i) => {
          const melange = Math.round(30 + (70 * i) / Math.max(etapes.length - 1, 1));
          const clair = melange > 60;
          return (
            <li key={e.stage_id} className="flex w-full flex-col items-center">
              {i > 0 ? (
                <span
                  className={cn(
                    "my-1 rounded-full px-2 text-[10.5px] tabular-nums",
                    i === pire
                      ? "bg-warning-subtle text-warning-subtle-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  ↓ {e.pass_rate === null ? "—" : `${e.pass_rate.toLocaleString("fr-FR")} %`}
                  {i === pire ? " · plus forte chute" : ""}
                </span>
              ) : null}
              <BarreAnimee
                largeur={Math.max((e.reached / max) * 100, 28)}
                className="flex h-[30px] items-center justify-between rounded-lg px-3 text-xs"
                style={{ background: `color-mix(in srgb, var(--chart-1) ${melange}%, var(--card))` }}
              >
                <span className={cn("truncate", clair && "text-primary-foreground")}>{e.name}</span>
                <span className={cn("font-semibold tabular-nums", clair && "text-primary-foreground")}>
                  {formatNombre(e.reached)}
                </span>
              </BarreAnimee>
            </li>
          );
        })}
      </ol>
      <p className="text-muted-foreground mt-auto pt-4 text-[11px]">
        Sur {formatNombre(max)} nouveau{max > 1 ? "x" : ""} prospect{max > 1 ? "s" : ""},{" "}
        <b className="text-foreground font-medium">
          {formatNombre(dernier?.reached ?? 0)} à « {dernier?.name} »
        </b>{" "}
        : {Math.round(((dernier?.reached ?? 0) * 1000) / max) / 10} % de bout en bout.
      </p>
    </>
  );
}

export function AFaire({ aujourdhui, fuseau }: { aujourdhui: DashboardToday; fuseau: string }) {
  const { overdue, appointments, stale } = aujourdhui;
  const total = overdue.count + appointments.count + stale.count;

  const ligne = (
    ton: "danger" | "neutre" | "alerte",
    Icone: LucideIcon,
    titre: string,
    detail: string,
    lien?: { href: string; texte: string },
  ) => (
    <li
      className={cn(
        "grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2.5 rounded-[10px] p-2.5",
        ton === "danger" && "bg-destructive-subtle",
        ton === "alerte" && "bg-warning-subtle",
        ton === "neutre" && "bg-muted/55",
      )}
    >
      <span
        className={cn(
          "bg-card grid size-7 place-items-center rounded-lg",
          ton === "danger" && "text-destructive-subtle-foreground",
          ton === "alerte" && "text-warning-subtle-foreground",
        )}
      >
        <Icone className="size-3.5" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col text-[12.5px]">
        <b className="font-semibold">{titre}</b>
        <span className="text-muted-foreground text-[11px]">{detail}</span>
      </span>
      {lien ? (
        <Link href={lien.href} className="text-primary text-xs font-medium whitespace-nowrap hover:underline">
          {lien.texte} →
        </Link>
      ) : null}
    </li>
  );

  if (total === 0) {
    return <p className="text-muted-foreground py-6 text-center text-xs">Rien d&apos;urgent aujourd&apos;hui.</p>;
  }

  const prochain = appointments.items[0];

  return (
    <>
      <ul className="space-y-1.5">
        {overdue.count > 0
          ? ligne(
              "danger",
              CircleAlert,
              `${formatNombre(overdue.count)} rendez-vous en retard`,
              overdue.oldest ? `Le plus ancien : ${formatDateCourte(overdue.oldest)}` : "Planifiés, non clos",
              { href: "/calendrier", texte: "Traiter" },
            )
          : null}
        {appointments.count > 0
          ? ligne(
              "neutre",
              CalendarClock,
              `${formatNombre(appointments.count)} rendez-vous aujourd'hui`,
              prochain ? `Prochain à ${formatHeure(prochain.scheduled_at, { timeZone: fuseau })} · ${prochain.prospect.name}` : "",
              { href: "/calendrier", texte: "Ouvrir" },
            )
          : null}
        {stale.count > 0
          ? ligne(
              "alerte",
              Clock3,
              `${formatNombre(stale.count)} prospect${stale.count > 1 ? "s" : ""} sans mouvement`,
              `Depuis plus de ${stale.days} jours · détail par projet, onglet Tableau de bord`,
            )
          : null}
      </ul>
      {appointments.items.length > 0 ? (
        <div className="border-border mt-auto border-t pt-3">
          <p className="text-muted-foreground mb-2 text-[10.5px] font-semibold tracking-[0.06em] uppercase">
            Rendez-vous du jour
          </p>
          <ul className="space-y-1.5">
            {appointments.items.slice(0, 2).map((r) => (
              <li key={r.id} className="border-chart-1 grid grid-cols-[44px_minmax(0,1fr)] gap-2 border-l-2 py-0.5 pl-2.5 text-[12.5px]">
                <span className="font-mono text-xs font-medium tabular-nums">
                  {formatHeure(r.scheduled_at, { timeZone: fuseau })}
                </span>
                <span className="flex min-w-0 flex-col">
                  <Link href={`/prospects/${r.prospect.id}`} className="truncate hover:underline">
                    {r.prospect.name}
                  </Link>
                  <span className="text-muted-foreground truncate text-[11px]">
                    {r.type_label} · {r.project.name}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          {appointments.count > 2 ? (
            <p className="text-muted-foreground mt-1.5 text-[11px]">
              + {appointments.count - 2} autre{appointments.count - 2 > 1 ? "s" : ""} ·{" "}
              <Link href="/calendrier" className="underline">
                Voir le calendrier
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** Mini-courbe des 7 derniers jours, dessinée côté serveur. */
function Etincelle({ valeurs }: { valeurs: number[] }) {
  const l = 72;
  const h = 22;
  const max = Math.max(...valeurs, 1);
  const points = valeurs.map((v, i) => [2 + (i * (l - 4)) / Math.max(valeurs.length - 1, 1), h - 3 - (v / max) * (h - 6)]);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const fin = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${l} ${h}`} width={l} height={h} aria-hidden className="shrink-0">
      <path d={d} fill="none" stroke="var(--chart-1)" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
      {fin ? <circle cx={fin[0]} cy={fin[1]} r={2} fill="var(--chart-1)" /> : null}
    </svg>
  );
}

export function Classement({ lignes }: { lignes: LeaderboardRow[] }) {
  if (lignes.length === 0) {
    return <p className="text-muted-foreground py-6 text-center text-xs">Aucun commercial dans votre périmètre.</p>;
  }

  return (
    <ol>
      {lignes.map((l, i) => (
        <li
          key={l.user.id}
          className="border-border/60 grid grid-cols-[18px_32px_minmax(0,1fr)_72px_56px] items-center gap-2.5 border-t py-2 first:border-t-0"
        >
          <span className={cn("text-center text-[11px] tabular-nums", i === 0 ? "text-primary font-bold" : "text-muted-foreground")}>
            {i + 1}
          </span>
          <span className="bg-chart-1/15 grid size-8 place-items-center rounded-full text-[11px] font-semibold">
            {initiales(l.user.name)}
          </span>
          <span className="flex min-w-0 flex-col text-[12.5px]">
            <b className="truncate font-medium">{l.user.name}</b>
            <span className="text-muted-foreground truncate text-[11px]">
              {l.conversion_rate === null ? "—" : `${l.conversion_rate.toLocaleString("fr-FR")} %`} de conversion ·{" "}
              {formatNombre(l.appointments)} RDV
            </span>
          </span>
          <Etincelle valeurs={l.last_7_days} />
          <span className="flex flex-col items-end">
            <b className="text-base leading-tight font-semibold tabular-nums">{formatNombre(l.converted)}</b>
            <span className="text-muted-foreground text-[11px]">convertis</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

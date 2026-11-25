"use client";

import { useReducedMotion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { DashboardSeriesPoint } from "@/lib/reporting";

/**
 * Courbe des conversions et des pertes — lot 12, planche n°12, S-15.
 *
 * Trois présentations des mêmes données, au choix de l'utilisateur
 * (ajustement A2 de la validation) : aires lissées, barres miroir par semaine,
 * cumul. Aucune ne refait d'appel : tout se dérive de la série renvoyée par
 * l'API.
 *
 * Couleurs de la charte (`--chart-1`, `--chart-5`). Le validateur les juge
 * limites pour un daltonien protanope (ΔE 7,6) : les pertes sont donc aussi en
 * pointillés, chaque série est nommée dans la légende, et le tableau
 * équivalent est sous le graphique.
 */
export type Variante = "aires" | "barres" | "cumul";

const config = {
  converted: { label: "Convertis", color: "var(--chart-1)" },
  lost: { label: "Perdus", color: "var(--chart-5)" },
} satisfies ChartConfig;

const jourCourt = (iso: string) => {
  const [, m, j] = iso.split("-");
  return `${j}/${m}`;
};

/** Moyenne glissante sur 7 points, fenêtre tronquée au début. */
function moyenne7(valeurs: number[]): number[] {
  return valeurs.map((_, i) => {
    const fenetre = valeurs.slice(Math.max(0, i - 6), i + 1);
    return Math.round((fenetre.reduce((a, b) => a + b, 0) / fenetre.length) * 10) / 10;
  });
}

/** Lundi de la semaine d'une date ISO (calcul en UTC, sans fuseau). */
function lundi(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function CourbeConversions({
  serie,
  granularite,
  variante,
}: {
  serie: DashboardSeriesPoint[];
  granularite: "day" | "week";
  variante: Variante;
}) {
  const anime = !useReducedMotion();
  const hauteur = "h-[220px] w-full";

  if (variante === "barres") {
    // Par semaine : en vue quotidienne, la série est regroupée ici.
    const semaines = new Map<string, { date: string; converted: number; lost: number }>();
    for (const p of serie) {
      const cle = granularite === "week" ? p.date : lundi(p.date);
      const s = semaines.get(cle) ?? { date: cle, converted: 0, lost: 0 };
      s.converted += p.converted;
      s.lost += p.lost;
      semaines.set(cle, s);
    }
    // Les pertes sous l'axe : la valeur est négative pour le dessin, le
    // libellé et l'infobulle restent positifs.
    const donnees = [...semaines.values()].map((s) => ({ ...s, lost: -s.lost }));

    return (
      <ChartContainer config={config} className={hauteur}>
        <BarChart data={donnees} stackOffset="sign" margin={{ left: -16, right: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="date" tickFormatter={jourCourt} tickLine={false} axisLine={false} fontSize={11} />
          <YAxis tickFormatter={(v: number) => String(Math.abs(v))} tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
          <ReferenceLine y={0} stroke="var(--border)" />
          <ChartTooltip
            cursor={{ fill: "var(--muted)", opacity: 0.4 }}
            content={
              <ChartTooltipContent
                labelFormatter={(v) => `Semaine du ${jourCourt(String(v))}`}
                formatter={(valeur, nom) => (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{nom === "lost" ? "Perdus" : "Convertis"}</span>
                    <span className="font-medium tabular-nums">{Math.abs(Number(valeur))}</span>
                  </span>
                )}
              />
            }
          />
          <Bar dataKey="converted" stackId="s" fill="var(--color-converted)" radius={[4, 4, 0, 0]} isAnimationActive={anime} animationDuration={600} />
          <Bar dataKey="lost" stackId="s" fill="var(--color-lost)" fillOpacity={0.85} radius={[4, 4, 0, 0]} isAnimationActive={anime} animationDuration={600} />
        </BarChart>
      </ChartContainer>
    );
  }

  if (variante === "cumul") {
    const donnees = serie.map((p, i) => {
      const jusquIci = serie.slice(0, i + 1);
      return {
        date: p.date,
        converted: jusquIci.reduce((s, q) => s + q.converted, 0),
        lost: jusquIci.reduce((s, q) => s + q.lost, 0),
      };
    });

    return (
      <ChartContainer config={config} className={hauteur}>
        <LineChart data={donnees} margin={{ left: -16, right: 8 }}>
          <CartesianGrid vertical={false} strokeDasharray="2 4" />
          <XAxis dataKey="date" tickFormatter={jourCourt} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
          <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
          <ChartTooltip content={<ChartTooltipContent labelFormatter={(v) => `Au ${jourCourt(String(v))}`} />} />
          <Line type="monotone" dataKey="converted" stroke="var(--color-converted)" strokeWidth={2.5} dot={false} isAnimationActive={anime} animationDuration={800} />
          <Line type="monotone" dataKey="lost" stroke="var(--color-lost)" strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={anime} animationDuration={800} animationBegin={120} />
        </LineChart>
      </ChartContainer>
    );
  }

  // Aires lissées : moyenne glissante sur 7 jours en vue quotidienne, valeur
  // brute par semaine. `monotone` ne dépasse jamais les points.
  const lisser = granularite === "day";
  const mc = lisser ? moyenne7(serie.map((p) => p.converted)) : serie.map((p) => p.converted);
  const mp = lisser ? moyenne7(serie.map((p) => p.lost)) : serie.map((p) => p.lost);
  const donnees = serie.map((p, i) => ({ date: p.date, converted: mc[i], lost: mp[i], brutC: p.converted, brutP: p.lost }));

  return (
    <ChartContainer config={config} className={hauteur}>
      <AreaChart data={donnees} margin={{ left: -16, right: 8 }}>
        <defs>
          <linearGradient id="degrade-convertis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-converted)" stopOpacity={0.28} />
            <stop offset="1" stopColor="var(--color-converted)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="degrade-perdus" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--color-lost)" stopOpacity={0.14} />
            <stop offset="1" stopColor="var(--color-lost)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="2 4" />
        <XAxis dataKey="date" tickFormatter={jourCourt} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
        <YAxis tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: number) => v.toLocaleString("fr-FR")} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              labelFormatter={(v) => (granularite === "week" ? `Semaine du ${jourCourt(String(v))}` : jourCourt(String(v)))}
              formatter={(valeur, nom, item) => {
                const brut = nom === "lost" ? item.payload.brutP : item.payload.brutC;
                return (
                  <span className="flex w-full justify-between gap-4">
                    <span className="text-muted-foreground">{nom === "lost" ? "Perdus" : "Convertis"}</span>
                    <span className="font-medium tabular-nums">
                      {brut}
                      {lisser ? ` · moy. ${Number(valeur).toLocaleString("fr-FR")}` : ""}
                    </span>
                  </span>
                );
              }}
            />
          }
        />
        <Area type="monotone" dataKey="converted" stroke="var(--color-converted)" strokeWidth={2} fill="url(#degrade-convertis)" isAnimationActive={anime} animationDuration={800} />
        <Area type="monotone" dataKey="lost" stroke="var(--color-lost)" strokeWidth={2} strokeDasharray="5 4" fill="url(#degrade-perdus)" isAnimationActive={anime} animationDuration={800} animationBegin={120} />
      </AreaChart>
    </ChartContainer>
  );
}

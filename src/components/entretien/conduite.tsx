"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useTransition } from "react";
import { Check, ChevronLeft, ChevronRight, Info, LoaderCircle } from "lucide-react";
import { toast } from "sonner";

import { enregistrerReponse, garderMesDurees, terminerEntretien } from "@/app/(app)/entretien-actions";
import { Minuteur } from "@/components/entretien/minuteur";
import { QuestionField } from "@/components/question-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ecrireDuree } from "@/lib/duree";
import type { Interview, PlanQuestion } from "@/lib/interviews";
import { cn } from "@/lib/utils";

/**
 * Conduite d'un entretien, réel ou simulé — lot 13, planche n°13 (S-17, S-18).
 *
 * - **Entretien** : la réponse est enregistrée en passant à une autre question
 *   (R4) ; l'heure de début vient du serveur, un rechargement ne remet donc
 *   pas le minuteur à zéro (R6).
 * - **Simulation** : aucun appel d'écriture ; le temps passé sur chaque
 *   question est mesuré, et le bilan propose de le garder comme durées
 *   personnelles (R7).
 *
 * Le temps guide, il ne coupe jamais (D5) : au-delà du temps prévu, le
 * minuteur passe au rouge et compte le dépassement.
 */
type Valeur = string | number | boolean | string[] | null;

export function Conduite({
  mode,
  questions,
  reponsesInitiales = {},
  entretien,
  prospectId,
  projectId,
  titre,
  sousTitre,
  retour,
}: {
  mode: "entretien" | "simulation";
  questions: PlanQuestion[];
  reponsesInitiales?: Record<number, Valeur>;
  entretien?: Interview;
  prospectId?: number;
  projectId: number;
  titre: string;
  sousTitre: string;
  retour: string;
}) {
  const simulation = mode === "simulation";
  const cible = (q: PlanQuestion) => q.my_seconds ?? q.planned_seconds ?? 0;
  const prevuTotal = entretien?.planned_seconds ?? questions.reduce((s, q) => s + cible(q), 0);

  // Heure de départ : celle du serveur pour un entretien (un rechargement
  // ne remet pas le minuteur à zéro), l'ouverture de l'écran pour une
  // simulation. Initialiseur paresseux : lu une seule fois.
  const [depart] = useState(() => (entretien ? new Date(entretien.started_at).getTime() : Date.now()));
  const indexInitial = Math.max(
    0,
    questions.findIndex((q) => q.id === entretien?.current_question_id),
  );

  const [index, setIndex] = useState(indexInitial);
  const [valeurs, setValeurs] = useState<Record<number, Valeur>>(reponsesInitiales);
  const [erreurs, setErreurs] = useState<Record<number, string>>({});
  const [message, setMessage] = useState<string>();
  const [enregistree, setEnregistree] = useState<number | null>(null);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  const [mesures, setMesures] = useState<Record<number, number>>({});
  const [bilan, setBilan] = useState(false);
  const [pending, startTransition] = useTransition();
  // Entrée sur la question en cours, pour mesurer le temps qui y est passé.
  const [entree, setEntree] = useState(() => Date.now());

  // Une seconde, pas plus : le minuteur se recalcule depuis l'heure de
  // départ, il ne dérive pas si un battement est sauté.
  useEffect(() => {
    if (bilan) return;
    const t = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(t);
  }, [bilan]);

  const question = questions[index];
  const ecoule = Math.max(0, Math.round((maintenant - depart) / 1000));
  const ecouleQuestion = Math.max(0, Math.round((maintenant - entree) / 1000)) + (mesures[question?.id ?? 0] ?? 0);

  /** Cumule le temps passé sur la question qu'on quitte. */
  const noterTemps = useCallback(() => {
    if (!question) return;
    const instant = Date.now();
    const passe = Math.round((instant - entree) / 1000);
    setEntree(instant);
    setMesures((m) => ({ ...m, [question.id]: (m[question.id] ?? 0) + passe }));
  }, [entree, question]);

  const aller = useCallback(
    (suivant: number) => {
      if (!question || suivant < 0 || suivant >= questions.length) return;
      setMessage(undefined);

      if (simulation || !entretien) {
        noterTemps();
        setIndex(suivant);
        return;
      }

      startTransition(async () => {
        const etat = await enregistrerReponse(entretien.id, question.id, valeurs[question.id] ?? null);
        if (etat.erreurs || etat.message) {
          setErreurs((e) => ({ ...e, ...(etat.erreurs ?? {}) }));
          setMessage(etat.message);
          return;
        }
        setErreurs((e) => {
          const reste = { ...e };
          delete reste[question.id];
          return reste;
        });
        setEnregistree(index + 1);
        noterTemps();
        setIndex(suivant);
      });
    },
    [entretien, index, noterTemps, question, questions.length, simulation, valeurs],
  );

  const terminer = useCallback(() => {
    if (simulation || !entretien || prospectId === undefined) {
      noterTemps();
      setBilan(true);
      return;
    }
    startTransition(async () => {
      if (question) {
        const etat = await enregistrerReponse(entretien.id, question.id, valeurs[question.id] ?? null);
        if (etat.erreurs || etat.message) {
          setErreurs((e) => ({ ...e, ...(etat.erreurs ?? {}) }));
          setMessage(etat.message);
          return;
        }
      }
      const fin = await terminerEntretien(entretien.id, prospectId);
      // En cas de succès, l'action redirige vers la fiche.
      if (fin.erreurs) {
        setErreurs(fin.erreurs);
        const premiere = questions.findIndex((q) => fin.erreurs?.[q.id]);
        if (premiere >= 0) {
          noterTemps();
          setIndex(premiere);
        }
        setMessage("Des questions obligatoires sont sans réponse : l'entretien n'est pas clos.");
      } else if (fin.message) {
        setMessage(fin.message);
      }
    });
  }, [entretien, noterTemps, prospectId, question, questions, simulation, valeurs]);

  // Clavier : ← et → hors d'un champ de saisie, Ctrl + Entrée pour terminer.
  useEffect(() => {
    const touche = (e: KeyboardEvent) => {
      const cibleSaisie = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role=radiogroup]");
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        terminer();
      } else if (!cibleSaisie && e.key === "ArrowRight") {
        aller(index + 1);
      } else if (!cibleSaisie && e.key === "ArrowLeft") {
        aller(index - 1);
      }
    };
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, [aller, index, terminer]);

  if (bilan) {
    return <Bilan questions={questions} mesures={mesures} projectId={projectId} retour={retour} />;
  }

  if (!question) {
    return null;
  }

  const cibleQ = cible(question);
  const partQ = cibleQ > 0 ? ecouleQuestion / cibleQ : 0;

  return (
    <div className="space-y-4 text-[13px]">
      {simulation ? (
        <p className="bg-info-subtle text-info-subtle-foreground flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-[12.5px]">
          <Info className="size-4 shrink-0" aria-hidden />
          <span>
            <b>Simulation</b> — aucune réponse n&apos;est enregistrée, rien n&apos;entre au journal ni dans les chiffres.
            Le temps passé sur chaque question est mesuré.
          </span>
        </p>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold">{titre}</h1>
          <p className="text-muted-foreground text-xs">{sousTitre}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={retour}>{simulation ? "Quitter la simulation" : "Mettre en pause et quitter"}</Link>
          </Button>
          <Button size="sm" onClick={terminer} disabled={pending}>
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            {simulation ? "Terminer la simulation" : "Terminer l'entretien"}
          </Button>
        </div>
      </div>

      {message ? (
        <p role="alert" className="bg-destructive-subtle text-destructive-subtle-foreground rounded-[10px] px-3 py-2 text-[12.5px]">
          {message}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card>
          <CardContent className="p-4 text-center">
            <Minuteur ecoule={ecoule} prevu={prevuTotal} />
            <ol className="mt-3 space-y-0.5 text-left" aria-label="Questions de l'entretien">
              {questions.map((q, i) => (
                <li key={q.id}>
                  <button
                    type="button"
                    onClick={() => aller(i)}
                    aria-current={i === index ? "step" : undefined}
                    className={cn(
                      "grid w-full grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg px-1.5 py-1 text-left text-xs",
                      i === index && "bg-chart-1/12 font-medium",
                      i < index && "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-3.5 place-items-center rounded-full border-[1.5px] text-[9px]",
                        valeurs[q.id] !== undefined && valeurs[q.id] !== null && valeurs[q.id] !== ""
                          ? "bg-chart-1 border-chart-1 text-primary-foreground"
                          : i === index
                            ? "border-chart-1"
                            : "border-border",
                      )}
                      aria-hidden
                    >
                      {valeurs[q.id] !== undefined && valeurs[q.id] !== null && valeurs[q.id] !== "" ? "✓" : ""}
                    </span>
                    <span className="truncate">
                      {i + 1}. {q.label}
                    </span>
                    {cible(q) > 0 ? (
                      <span className="bg-muted text-muted-foreground rounded px-1.5 font-mono text-[11px]">{ecrireDuree(cible(q))}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-muted-foreground text-xs">
              Question {index + 1} sur {questions.length} · {question.type_label}
            </p>
            {cibleQ > 0 ? (
              <>
                <div className="bg-muted mt-3 h-1.5 overflow-hidden rounded-full" aria-hidden>
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] duration-(--duration-slow)",
                      partQ > 1 ? "bg-destructive" : partQ >= 0.8 ? "bg-warning" : "bg-chart-1",
                    )}
                    style={{ width: `${Math.min(partQ, 1) * 100}%` }}
                  />
                </div>
                <p className="text-muted-foreground mt-1 text-[11px]">
                  {ecrireDuree(ecouleQuestion)} sur {ecrireDuree(cibleQ)} prévues pour cette question
                  {ecouleQuestion > cibleQ ? (
                    <b className="text-destructive-subtle-foreground"> · +{ecrireDuree(ecouleQuestion - cibleQ)}</b>
                  ) : null}
                </p>
              </>
            ) : null}

            <div className="mt-4">
              <QuestionField
                question={question}
                valeur={valeurs[question.id] ?? null}
                erreur={erreurs[question.id]}
                onChange={(v) => setValeurs((vs) => ({ ...vs, [question.id]: v }))}
                disabled={pending}
              />
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
              <Button variant="outline" size="sm" onClick={() => aller(index - 1)} disabled={index === 0 || pending}>
                <ChevronLeft className="size-4" aria-hidden />
                Précédente
              </Button>
              <span className="text-[11px]" aria-live="polite">
                {simulation ? (
                  <span className="text-muted-foreground">Rien n&apos;est enregistré</span>
                ) : enregistree !== null ? (
                  <span className="text-success-subtle-foreground inline-flex items-center gap-1">
                    <Check className="size-3" aria-hidden />
                    Réponse {enregistree} enregistrée
                  </span>
                ) : null}
              </span>
              <Button size="sm" onClick={() => aller(index + 1)} disabled={index === questions.length - 1 || pending}>
                Suivante
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Bilan de simulation (S-18) : votre durée, le temps mesuré, l'écart. */
function Bilan({
  questions,
  mesures,
  projectId,
  retour,
}: {
  questions: PlanQuestion[];
  mesures: Record<number, number>;
  projectId: number;
  retour: string;
}) {
  const [pending, startTransition] = useTransition();
  const [garde, setGarde] = useState(false);
  const total = questions.reduce((s, q) => s + (mesures[q.id] ?? 0), 0);
  const actuel = questions.reduce((s, q) => s + (q.my_seconds ?? q.planned_seconds ?? 0), 0);
  // Seules les questions réellement parcourues donnent une mesure ; l'API
  // arrondit à 5 s et borne de 0:15 à 15:00.
  const aGarder = questions.filter((q) => (mesures[q.id] ?? 0) > 0).map((q) => ({ question_id: q.id, seconds: mesures[q.id] }));

  return (
    <Card className="mx-auto max-w-3xl text-[13px]">
      <CardContent className="p-5">
        <h1 className="text-sm font-semibold">Simulation terminée en {ecrireDuree(total)}</h1>
        <p className="text-muted-foreground mt-0.5 text-xs">
          Votre temps actuel : {ecrireDuree(actuel)}. Écart : {total >= actuel ? "+" : "−"}
          {ecrireDuree(Math.abs(total - actuel))}.
        </p>
        <table className="mt-4 w-full border-collapse text-[12.5px]">
          <thead>
            <tr className="text-muted-foreground text-left text-[10.5px] tracking-[0.06em] uppercase">
              <th className="px-2 pb-2 font-semibold">Question</th>
              <th className="px-2 pb-2 text-right font-semibold">Votre durée</th>
              <th className="px-2 pb-2 text-right font-semibold">Mesuré</th>
              <th className="px-2 pb-2 text-right font-semibold">Écart</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q, i) => {
              const avant = q.my_seconds ?? q.planned_seconds ?? 0;
              const mesure = mesures[q.id] ?? 0;
              const ecart = mesure - avant;
              return (
                <tr key={q.id} className="border-border/60 border-t">
                  <td className="px-2 py-2">
                    {i + 1}. {q.label}
                  </td>
                  <td className="px-2 py-2 text-right font-mono">{avant > 0 ? ecrireDuree(avant) : "—"}</td>
                  <td className="px-2 py-2 text-right font-mono">{mesure > 0 ? ecrireDuree(mesure) : "—"}</td>
                  <td
                    className={cn(
                      "px-2 py-2 text-right font-mono",
                      ecart > 0 && "text-destructive-subtle-foreground",
                      ecart < 0 && "text-success-subtle-foreground",
                    )}
                  >
                    {mesure === 0 || avant === 0 ? "—" : `${ecart > 0 ? "+" : ecart < 0 ? "−" : ""}${ecrireDuree(Math.abs(ecart))}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="mt-4 flex justify-end gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href={retour}>{garde ? "Revenir à la préparation" : "Fermer sans rien garder"}</Link>
          </Button>
          <Button
            size="sm"
            disabled={pending || garde || aGarder.length === 0}
            onClick={() =>
              startTransition(async () => {
                const r = await garderMesDurees(projectId, aGarder);
                if (r.message) {
                  toast.error(r.message);
                } else {
                  setGarde(true);
                  toast.success("Vos durées sont enregistrées.");
                }
              })
            }
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Garder ces durées comme les miennes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

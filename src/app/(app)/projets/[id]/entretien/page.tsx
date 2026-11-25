import Link from "next/link";
import { notFound } from "next/navigation";
import { Play } from "lucide-react";

import { RevenirAuxDureesPrevues } from "./revenir-aux-durees";
import { Conduite } from "@/components/entretien/conduite";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { requireUser } from "@/lib/dal";
import { ecrireDuree } from "@/lib/duree";
import { getInterviewPlan } from "@/lib/interviews";

/**
 * Préparer l'entretien, et le simuler — lot 13, planche n°13 (S-16, S-18).
 *
 * Ouvert à tous les rôles d'entreprise (décision n°3). La simulation vit à
 * la même adresse, `?simulation=1` : elle ne fait aucun appel d'écriture,
 * sauf si l'utilisateur garde ses durées à la fin.
 */
export default async function PreparerEntretienPage({
  params,
  searchParams,
}: PageProps<"/projets/[id]/entretien">) {
  const user = await requireUser();
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();
  const { simulation } = await searchParams;

  let plan;
  try {
    plan = await getInterviewPlan(projectId);
  } catch (error) {
    if (error instanceof ApiError && [403, 404].includes(error.status)) notFound();
    throw error;
  }

  const retour = `/projets/${projectId}/entretien`;
  const vide = plan.questions.length === 0;

  if (simulation === "1" && !vide) {
    return (
      <Conduite
        mode="simulation"
        questions={plan.questions}
        projectId={projectId}
        titre={`Simulation · ${plan.project.name}`}
        sousTitre="Questionnaire du projet, vos durées personnelles"
        retour={retour}
      />
    );
  }

  const aDesDurees = plan.questions.some((q) => q.my_seconds !== null);

  return (
    <div className="space-y-4 text-[13px]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-heading text-lg font-semibold">Préparer l&apos;entretien</h2>
          <p className="text-muted-foreground text-xs">
            {plan.questions.length} question{plan.questions.length > 1 ? "s" : ""}, dans l&apos;ordre où elles seront posées.
          </p>
        </div>
        <div className="flex gap-2">
          {aDesDurees ? <RevenirAuxDureesPrevues projectId={projectId} /> : null}
          {vide ? null : (
            <Button asChild size="sm">
              <Link href={`${retour}?simulation=1`}>
                <Play className="size-4" aria-hidden />
                Lancer une simulation
              </Link>
            </Button>
          )}
        </div>
      </div>

      {vide ? (
        <Card>
          <CardContent className="text-muted-foreground p-6 text-center text-xs">
            Ce projet n&apos;a pas encore de questionnaire.{" "}
            {user.role === "admin_client" ? (
              <Link href={`/projets/${projectId}/reglages`} className="text-foreground underline">
                Le configurer
              </Link>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <Tuile titre="Temps prévu" valeur={plan.totals.planned_seconds} detail="Fixé par l'Admin Client" />
            <Tuile
              titre="Votre temps"
              valeur={plan.totals.my_seconds}
              detail={aDesDurees ? "Vos durées personnelles, appliquées à vos entretiens" : "Aucune durée personnelle : le temps prévu s'applique"}
            />
          </div>
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold">Votre plan d&apos;entretien</h3>
              <table className="mt-3 w-full border-collapse text-[12.5px]">
                <thead>
                  <tr className="text-muted-foreground text-left text-[10.5px] tracking-[0.06em] uppercase">
                    <th className="px-2 pb-2 font-semibold">Question</th>
                    <th className="px-2 pb-2 text-right font-semibold">Prévu</th>
                    <th className="px-2 pb-2 text-right font-semibold">Votre durée</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.questions.map((q, i) => (
                    <tr key={q.id} className="border-border/60 border-t">
                      <td className="px-2 py-2 font-medium">
                        {i + 1}. {q.label}
                        <span className="text-muted-foreground ml-2 text-[11px] font-normal">{q.type_label}</span>
                      </td>
                      <td className="px-2 py-2 text-right font-mono">{q.planned_seconds ? ecrireDuree(q.planned_seconds) : "—"}</td>
                      <td className="px-2 py-2 text-right font-mono">
                        {q.my_seconds ? <b>{ecrireDuree(q.my_seconds)}</b> : q.planned_seconds ? ecrireDuree(q.planned_seconds) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Tuile({ titre, valeur, detail }: { titre: string; valeur: number; detail: string }) {
  return (
    <Card>
      <CardContent className="space-y-1 p-4">
        <p className="text-muted-foreground text-[11px] font-medium">{titre}</p>
        <p className="font-heading text-[22px] font-semibold tabular-nums">{valeur > 0 ? ecrireDuree(valeur) : "—"}</p>
        <p className="text-muted-foreground text-[11px]">{detail}</p>
      </CardContent>
    </Card>
  );
}

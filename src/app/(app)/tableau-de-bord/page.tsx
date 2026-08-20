import type { Metadata } from "next";
import { Building2, CalendarClock, ChartNoAxesColumn } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, toneAbonnement } from "@/components/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatDistance, formatQuota, prenom } from "@/lib/format";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function TableauDeBordPage() {
  const user = await requireUser();
  const entreprise = user.company;
  const abonnement = entreprise?.subscription;
  const fuseau = entreprise?.timezone;

  const plafonds = [
    { label: "Projets", valeur: abonnement?.plan?.max_projects },
    { label: "Utilisateurs", valeur: abonnement?.plan?.max_users },
    { label: "Prospects", valeur: abonnement?.plan?.max_prospects },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        titre={`Bonjour ${prenom(user.name)}`}
        description={
          <>
            Vous êtes connecté en tant que {user.role_label}
            {entreprise ? ` chez ${entreprise.name}` : " de la plateforme"}.
          </>
        }
      />

      {entreprise ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardDescription className="flex items-center gap-1.5">
                <Building2 className="size-3.5" aria-hidden />
                Entreprise
              </CardDescription>
              <CardTitle className="text-xl">{entreprise.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="text-sm">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-muted-foreground">Fuseau horaire</dt>
                  {/* Le fuseau conditionne l'heure de tous les rendez-vous du
                      calendrier : il est affiché, pas caché dans un réglage. */}
                  <dd className="font-medium">{entreprise.timezone}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {abonnement ? (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardDescription className="flex items-center gap-1.5">
                  <CalendarClock className="size-3.5" aria-hidden />
                  Abonnement
                </CardDescription>
                <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
                  {abonnement.plan?.name ?? "Plan inconnu"}
                  {/* `effective_status` et non `status` : l'API distingue la
                      valeur stockée d'une échéance déjà dépassée que la tâche
                      planifiée n'a pas encore traitée. */}
                  <StatusBadge tone={toneAbonnement(abonnement.effective_status)}>
                    {abonnement.effective_status_label}
                  </StatusBadge>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {abonnement.expires_at ? (
                  <p className="text-muted-foreground text-sm">
                    Échéance le{" "}
                    <span
                      className="text-foreground font-medium"
                      title={formatDate(abonnement.expires_at, {
                        timeZone: fuseau,
                      })}
                    >
                      {formatDate(abonnement.expires_at, { timeZone: fuseau })}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      — {formatDistance(abonnement.expires_at)}
                    </span>
                  </p>
                ) : (
                  <p className="text-muted-foreground text-sm">Sans échéance.</p>
                )}

                <Separator />

                <div>
                  <p className="text-muted-foreground mb-3 text-xs font-medium tracking-wide uppercase">
                    Plafonds du plan
                  </p>
                  {/* Les plafonds seuls, sans la consommation : l'endpoint qui
                      la fournit arrive au lot 2. Afficher une barre de
                      progression sans dénominateur réel serait une invention. */}
                  <dl className="grid gap-3 sm:grid-cols-3">
                    {plafonds.map(({ label, valeur }) => (
                      <div key={label} className="space-y-0.5">
                        <dt className="text-muted-foreground text-sm">
                          {label}
                        </dt>
                        <dd className="font-heading text-lg font-semibold tabular-nums">
                          {formatQuota(valeur)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}

      <EmptyState
        icon={ChartNoAxesColumn}
        titre="Les indicateurs arrivent au lot 7"
        description="Taux de qualification, taux de conversion, activité par commercial et durée de cycle s'afficheront ici, filtrables par projet, variante et période."
      />
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CompanyActions } from "./company-actions";
import { CompanyStatusBadge } from "@/components/company-status-badge";
import { LienRetour } from "@/components/lien-retour";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { UsageMeter } from "@/components/usage-meter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiError } from "@/lib/api";
import { getCompany, getCompanyUsage, listPlans } from "@/lib/admin";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Fiche entreprise",
};

export default async function FicheEntreprisePage({
  params,
}: PageProps<"/back-office/entreprises/[id]">) {
  const user = await requireUser();

  if (user.role !== "super_admin") {
    notFound();
  }

  const { id } = await params;
  const companyId = Number(id);

  if (!Number.isInteger(companyId)) {
    notFound();
  }

  let company, usage, plans;

  try {
    [company, usage, plans] = await Promise.all([
      getCompany(companyId),
      getCompanyUsage(companyId),
      listPlans(),
    ]);
  } catch (error) {
    // 404 comme 403 mènent à la même page : ne pas distinguer les deux évite
    // de confirmer l'existence d'une entreprise à qui n'y a pas accès.
    if (error instanceof ApiError && [403, 404].includes(error.status)) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <LienRetour
        href="/back-office/entreprises"
        label="Toutes les entreprises"
      />

      <PageHeader
        titre={company.name}
        description={
          <span className="font-mono text-xs">{company.slug}</span>
        }
        actions={<CompanyStatusBadge company={company} />}
      />

      {!company.allows_writes ? (
        <Notice variant="warning" titre="Écriture bloquée">
          Cette entreprise ne peut plus enregistrer de modifications. La
          consultation et l&apos;export lui restent ouverts — couper la lecture
          reviendrait à retenir ses données.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consommation</CardTitle>
            <CardDescription>
              Face aux plafonds du plan «{" "}
              {company.subscription?.plan?.name ?? "—"} ».
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {(
              Object.entries(usage.usage) as [
                keyof typeof usage.usage,
                (typeof usage.usage)[keyof typeof usage.usage],
              ][]
            ).map(([resource, entry]) => (
              <UsageMeter key={resource} resource={resource} entry={entry} />
            ))}
            <p className="text-muted-foreground border-t pt-4 text-xs">
              Projets et prospects restent à zéro : leurs compteurs sont
              branchés aux lots 3 et 4.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">État</span>
                <span>{company.subscription?.effective_status_label ?? "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Échéance</span>
                <span>
                  {/* Passe par le point de formatage unique : la date est
                      stockée en UTC et doit être lue dans le fuseau de
                      l'entreprise, pas dans celui du serveur ni du navigateur. */}
                  {company.subscription?.expires_at
                    ? formatDate(company.subscription.expires_at, {
                        timeZone: company.timezone,
                      })
                    : "Sans échéance"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fuseau</span>
                <span>{company.timezone}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Administration</CardTitle>
            </CardHeader>
            <CardContent>
              <CompanyActions company={company} plans={plans} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

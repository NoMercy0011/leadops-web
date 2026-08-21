import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2 } from "lucide-react";

import { CreateCompanyDialog } from "./create-company-dialog";
import { CompanyStatusBadge } from "@/components/company-status-badge";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listCompanies, listPlans } from "@/lib/admin";
import { requireUser } from "@/lib/dal";
import { formatDateCourte, formatNombre } from "@/lib/format";

export const metadata: Metadata = {
  title: "Entreprises clientes",
};

export default async function EntreprisesPage() {
  const user = await requireUser();

  // Deuxième garde, après le middleware Laravel : évite d'afficher une page
  // qui de toute façon ne recevrait que des 403.
  if (user.role !== "super_admin") {
    notFound();
  }

  const [companies, plans] = await Promise.all([listCompanies(), listPlans()]);
  const total = companies.meta.total;

  return (
    <div className="space-y-6">
      <PageHeader
        titre="Entreprises clientes"
        description={
          total === 0
            ? "Aucune entreprise sur la plateforme."
            : `${formatNombre(total)} entreprise${total > 1 ? "s" : ""} sur la plateforme.`
        }
        actions={<CreateCompanyDialog plans={plans} />}
      />

      {companies.data.length === 0 ? (
        // Un tableau vide avec une ligne « aucun résultat » demande à
        // l'utilisateur de comprendre l'en-tête d'un tableau qui ne contient
        // rien. Sur une plateforme neuve, cet écran est le tout premier : il
        // doit porter l'action, pas un constat.
        <EmptyState
          icon={Building2}
          titre="Aucune entreprise cliente"
          description="Créez la première entreprise et attribuez-lui un plan pour ouvrir son espace de prospection."
          action={<CreateCompanyDialog plans={plans} />}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Entreprise</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead className="w-24">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.data.map((company) => (
                  <TableRow
                    key={company.id}
                    // Hauteur de ligne prise dans l'échelle de densité, et non
                    // décidée écran par écran : les listes de prospects,
                    // d'utilisateurs et de rendez-vous doivent s'aligner.
                    className="h-(--row-height)"
                  >
                    <TableCell>
                      <div className="space-y-0.5">
                        <p className="font-medium">{company.name}</p>
                        <p className="text-muted-foreground font-mono text-xs">
                          {company.slug}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {company.subscription?.plan?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <CompanyStatusBadge company={company} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm tabular-nums">
                      {company.subscription?.expires_at
                        ? formatDateCourte(company.subscription.expires_at, {
                            timeZone: company.timezone,
                          })
                        : "Sans échéance"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/back-office/entreprises/${company.id}`}>
                          Détail
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

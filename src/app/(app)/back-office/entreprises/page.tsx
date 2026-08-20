import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CreateCompanyDialog } from "./create-company-dialog";
import { CompanyStatusBadge } from "@/components/company-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Entreprises clientes
          </h1>
          <p className="text-muted-foreground text-sm">
            {companies.meta.total} entreprise
            {companies.meta.total > 1 ? "s" : ""} sur la plateforme.
          </p>
        </div>

        <CreateCompanyDialog plans={plans} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-muted-foreground py-10 text-center"
                  >
                    Aucune entreprise pour le moment.
                  </TableCell>
                </TableRow>
              ) : (
                companies.data.map((company) => (
                  <TableRow key={company.id}>
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
                    <TableCell className="text-muted-foreground text-sm">
                      {company.subscription?.expires_at
                        ? new Date(
                            company.subscription.expires_at,
                          ).toLocaleDateString("fr-FR")
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

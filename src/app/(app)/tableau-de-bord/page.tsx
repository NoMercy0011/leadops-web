import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/dal";

export const metadata: Metadata = {
  title: "Tableau de bord",
};

export default async function TableauDeBordPage() {
  const user = await requireUser();
  const subscription = user.company?.subscription;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Bonjour {user.name.split(" ")[0]}
        </h1>
        <p className="text-muted-foreground text-sm">
          Les indicateurs seront mis en place au lot 7.
        </p>
      </div>

      {user.company && !user.company.allows_writes ? (
        <div className="bg-warning-subtle text-warning rounded-md px-4 py-3 text-sm">
          L&apos;abonnement de votre entreprise ne permet plus d&apos;enregistrer
          de modifications. La consultation et l&apos;export restent
          disponibles.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Rôle</CardDescription>
            <CardTitle className="text-xl">{user.role_label}</CardTitle>
          </CardHeader>
        </Card>

        {user.company ? (
          <Card>
            <CardHeader>
              <CardDescription>Entreprise</CardDescription>
              <CardTitle className="text-xl">{user.company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Fuseau : {user.company.timezone}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {subscription ? (
          <Card>
            <CardHeader>
              <CardDescription>Abonnement</CardDescription>
              <CardTitle className="flex items-center gap-2 text-xl">
                {subscription.plan?.name ?? "—"}
                <Badge
                  className={
                    subscription.effective_status === "active"
                      ? "bg-success-subtle text-success-foreground"
                      : "bg-destructive-subtle text-destructive"
                  }
                >
                  {subscription.effective_status_label}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-1 text-sm">
              <p>
                Projets :{" "}
                {subscription.plan?.max_projects ?? "illimité"}
              </p>
              <p>
                Utilisateurs :{" "}
                {subscription.plan?.max_users ?? "illimité"}
              </p>
              <p>
                Prospects :{" "}
                {subscription.plan?.max_prospects ?? "illimité"}
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}

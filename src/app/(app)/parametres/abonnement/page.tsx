import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { PageHeader } from "@/components/page-header";
import { StatusBadge, type Tone } from "@/components/status-badge";
import { UsageMeter } from "@/components/usage-meter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireUser } from "@/lib/dal";
import { formatDate } from "@/lib/format";
import { getSubscriptionOverview } from "@/lib/subscription";
import type { SubscriptionStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Abonnement",
};

const TONS: Record<SubscriptionStatus, Tone> = {
  active: "success",
  suspended: "warning",
  expired: "danger",
};

/**
 * Abonnement de l'entreprise — décision P2 de la planche du lot 9.
 *
 * L'abonnement appartient à l'entreprise, et ses plafonds valent pour tous
 * ses projets réunis. Il vivait dans un onglet de la fiche projet : une
 * entreprise de dix projets voyait le même écran dix fois, et l'Admin Client
 * avait un onglet que les autres rôles n'avaient pas. Il rejoint donc
 * Paramètres, déjà réservé à l'Admin Client. La tuile « Part de ce projet »,
 * qui n'a plus de projet auquel se rapporter, disparaît.
 */
export default async function AbonnementPage() {
  const user = await requireUser();

  // L'API réserve la lecture à l'Admin Client. Répondre 404 plutôt que
  // laisser passer un 403 : la page n'existe pas pour les autres rôles, et
  // une page d'erreur suggérerait qu'il suffit de demander la permission.
  if (user.role !== "admin_client") {
    notFound();
  }

  const { subscription, usage } = await getSubscriptionOverview();

  const entete = (
    <PageHeader
      titre="Abonnement"
      description="Votre plan, son échéance et la consommation de l'entreprise, tous projets confondus."
    />
  );

  if (subscription === null) {
    return (
      <div className="space-y-6">
        {entete}
        <EmptyState
          icon={CreditCard}
          titre="Aucun abonnement rattaché"
          description="Votre entreprise n'a pas d'abonnement actif : aucune création n'est possible tant qu'un plan ne lui est pas associé. Contactez votre interlocuteur commercial."
        />
      </div>
    );
  }

  const suspendu = subscription.effective_status !== "active";

  return (
    <div className="space-y-6">
      {entete}

      {suspendu ? (
        <Notice
          variant="warning"
          titre={`Abonnement ${subscription.effective_status_label.toLowerCase()}`}
        >
          L&apos;enregistrement de toute modification est bloqué. La
          consultation et l&apos;export restent disponibles : vos données ne
          sont pas retenues.
        </Notice>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Consommation</CardTitle>
            <CardDescription>
              Ces plafonds valent pour l&apos;entreprise entière, tous projets
              confondus. Ils sont tenus par le serveur : une création au-delà
              du plafond est refusée, quel que soit ce qu&apos;affiche cet
              écran. Un prospect archivé reste compté ; un projet archivé
              libère sa place.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {(["prospects", "projects", "users"] as const).map((ressource) => (
              <UsageMeter
                key={ressource}
                resource={ressource}
                entry={usage[ressource]}
              />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between gap-3">
              {subscription.plan?.name ?? "Plan inconnu"}
              <StatusBadge tone={TONS[subscription.effective_status]}>
                {subscription.effective_status_label}
              </StatusBadge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Depuis le</span>
              <span>
                {subscription.starts_at
                  ? formatDate(subscription.starts_at, {
                      timeZone: user.company?.timezone,
                    })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Échéance</span>
              {/* Une échéance nulle n'est pas une donnée manquante : elle
                  signifie « sans terme ». Afficher un tiret laisserait
                  croire à un oubli de saisie. */}
              <span>
                {subscription.expires_at
                  ? formatDate(subscription.expires_at, {
                      timeZone: user.company?.timezone,
                    })
                  : "Sans terme"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-muted-foreground text-sm">
        Le changement de plan relève de votre interlocuteur commercial : il ne
        se fait pas depuis cet écran, pour la même raison qu&apos;une
        suspension ne s&apos;applique pas soi-même.
      </p>
    </div>
  );
}

import { notFound } from "next/navigation";
import { CreditCard } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { Notice } from "@/components/notice";
import { StatTile } from "@/components/stat-tile";
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
import { listProspects } from "@/lib/prospects";
import { getSubscriptionOverview } from "@/lib/subscription";
import type { SubscriptionStatus } from "@/lib/types";

const TONS: Record<SubscriptionStatus, Tone> = {
  active: "success",
  suspended: "warning",
  expired: "danger",
};

/**
 * Abonnement de l'entreprise, vu depuis un projet.
 *
 * L'abonnement n'appartient pas au projet — il est porté par l'entreprise, et
 * les plafonds valent pour tous les projets réunis. Le montrer ici n'est donc
 * pas une redite du back-office : c'est au moment où l'on ajoute des prospects
 * à un projet que le plafond devient une contrainte concrète, et c'est là que
 * sa proximité doit se voir. La part que ce projet occupe dans le quota est
 * affichée pour cette raison précise.
 */
export default async function AbonnementDuProjetPage({
  params,
}: PageProps<"/projets/[id]/abonnement">) {
  const user = await requireUser();
  const { id } = await params;

  // L'API réserve la lecture à l'Admin Client. Répondre 404 plutôt que
  // laisser passer un 403 : l'onglet n'existe pas pour les autres rôles, et
  // une page d'erreur suggérerait qu'il suffit de demander la permission.
  if (user.role !== "admin_client") {
    notFound();
  }

  const projectId = Number(id);

  const [apercu, prospectsDuProjet] = await Promise.all([
    getSubscriptionOverview(),
    listProspects({ project_id: projectId, per_page: 1 }),
  ]);

  const { subscription, usage } = apercu;

  if (subscription === null) {
    return (
      <EmptyState
        icon={CreditCard}
        titre="Aucun abonnement rattaché"
        description="Votre entreprise n'a pas d'abonnement actif : aucune création n'est possible tant qu'un plan ne lui est pas associé. Contactez votre interlocuteur commercial."
      />
    );
  }

  const suspendu = subscription.effective_status !== "active";

  const partDuProjet =
    usage.prospects.used > 0
      ? Math.round((prospectsDuProjet.summary.total / usage.prospects.used) * 100)
      : null;

  return (
    <div className="space-y-6">
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
              écran.
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

        <div className="space-y-6">
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

          <StatTile
            label="Part de ce projet"
            valeur={partDuProjet}
            suffixe="%"
            detail={`${prospectsDuProjet.summary.total} prospect${prospectsDuProjet.summary.total > 1 ? "s" : ""} sur les ${usage.prospects.used} de l'entreprise.`}
          />
        </div>
      </div>

      <p className="text-muted-foreground text-sm">
        Le changement de plan relève de votre interlocuteur commercial : il ne
        se fait pas depuis cet écran, pour la même raison qu&apos;une
        suspension ne s&apos;applique pas soi-même.
      </p>
    </div>
  );
}

import type { Metadata } from "next";
import Image from "next/image";

import { EmptyState } from "@/components/empty-state";
import { ModeToggle } from "@/components/mode-toggle";
import { Notice } from "@/components/notice";
import { StatusBadge, type Tone } from "@/components/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChampSelect, ChampTexte, ChampZone } from "@/components/form-fields";
import { FieldGroup } from "@/components/ui/field";
import { Inbox } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const metadata: Metadata = {
  title: "Charte graphique",
  description: "Référence visuelle du design system LeadOps.",
};

/** Couleurs de marque telles que fournies, avant dérivation. */
const MARQUE = [
  { hex: "#1D3FD1", nom: "Bleu", role: "Information, liens", derive: true },
  { hex: "#0F766E", nom: "Teal", role: "Action principale" },
  { hex: "#2B2D42", nom: "Navy", role: "Texte, navigation" },
  { hex: "#EDF2F4", nom: "Clair", role: "Fond d'application" },
  { hex: "#8D99AE", nom: "Gris", role: "Bordures, inactifs" },
  { hex: "#8FBC8F", nom: "Sauge", role: "Converti, gagné" },
  { hex: "#EF233C", nom: "Rouge", role: "Perdu, suppression" },
  { hex: "#B45309", nom: "Ocre", role: "Alerte", ajout: true },
];

/** Contrastes mesurés sur le fond clair #EDF2F4. */
const CONTRASTES = [
  { couleur: "#2B2D42", usage: "Texte principal", ratio: "11,9:1", ok: true },
  { couleur: "#1D3FD1", usage: "Blanc sur bleu", ratio: "7,8:1", ok: true },
  { couleur: "#0F766E", usage: "Blanc sur teal", ratio: "5,5:1", ok: true },
  { couleur: "#5A6478", usage: "Texte secondaire (dérivé)", ratio: "5,3:1", ok: true },
  { couleur: "#8D99AE", usage: "Gris d'origine en texte", ratio: "2,6:1", ok: false },
  { couleur: "#EF233C", usage: "Blanc sur rouge d'origine", ratio: "4,2:1", ok: false },
  { couleur: "#8FBC8F", usage: "Sauge d'origine en texte", ratio: "1,9:1", ok: false },
];

const ETATS: Array<{ label: string; tone: Tone }> = [
  { label: "Converti", tone: "success" },
  { label: "Relance en retard", tone: "warning" },
  { label: "Perdu", tone: "danger" },
  { label: "Nouveau", tone: "info" },
  { label: "Sans suite", tone: "neutral" },
];

/** Échelle de mouvement, telle que définie dans globals.css. */
const MOUVEMENT = [
  { nom: "fast", valeur: "120 ms", usage: "Survol, focus, changement de couleur" },
  { nom: "base", valeur: "200 ms", usage: "Menu, panneau, ligne de tableau" },
  { nom: "slow", valeur: "320 ms", usage: "Transition de page, glisser-déposer" },
];

/** Registres d élévation. */
const ELEVATION = [
  { nom: "plat", classe: "", usage: "Cartes, tableaux, sections" },
  { nom: "raised", classe: "shadow-raised", usage: "Carte survolée, élément saisi" },
  { nom: "overlay", classe: "shadow-overlay", usage: "Menu, popover, feuille" },
  { nom: "dialog", classe: "shadow-dialog", usage: "Boîte de dialogue modale" },
];

function Section({
  titre,
  description,
  children,
}: {
  titre: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-semibold tracking-tight">
          {titre}
        </h2>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function ChartePage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-12 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="LeadOps"
            width={44}
            height={44}
            priority
            className="rounded-lg"
          />
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight">
              Charte graphique
            </h1>
            <p className="text-muted-foreground text-sm">
              Référence visuelle du design system — page provisoire de validation.
            </p>
          </div>
        </div>
        <ModeToggle />
      </header>

      <div
        className="h-1.5 w-full rounded-full"
        style={{ backgroundImage: "var(--brand-gradient)" }}
      />

      <Section
        titre="Palette de marque"
        description="Les teintes fournies, plus l'ocre ajouté pour les alertes que la palette d'origine ne couvrait pas."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MARQUE.map((c) => (
            <div key={c.hex} className="space-y-2">
              <div
                className="border-border h-16 w-full rounded-lg border"
                style={{ backgroundColor: c.hex }}
              />
              <div className="space-y-0.5">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  {c.nom}
                  {c.ajout ? (
                    <Badge variant="outline" className="text-[10px]">
                      ajout
                    </Badge>
                  ) : null}
                </p>
                <p className="text-muted-foreground font-mono text-xs">
                  {c.hex}
                </p>
                <p className="text-muted-foreground text-xs">{c.role}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        titre="Lisibilité"
        description="Trois teintes fournies ne peuvent pas porter de texte sur le fond clair. Leur version d'origine reste utilisée en aplat ; une déclinaison foncée prend le relais dès qu'il y a du texte."
      >
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usage</TableHead>
                  <TableHead className="w-28">Couleur</TableHead>
                  <TableHead className="w-24 text-right">Contraste</TableHead>
                  <TableHead className="w-28 text-right">Seuil AA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {CONTRASTES.map((c) => (
                  <TableRow key={c.usage}>
                    <TableCell className="font-medium">{c.usage}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        <span
                          className="border-border size-4 rounded border"
                          style={{ backgroundColor: c.couleur }}
                        />
                        <span className="text-muted-foreground font-mono text-xs">
                          {c.couleur}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {c.ratio}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        className={
                          c.ok
                            ? "bg-success-subtle text-success-subtle-foreground"
                            : "bg-destructive-subtle text-destructive-subtle-foreground"
                        }
                      >
                        {c.ok ? "atteint" : "échoue"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Section>

      <Section titre="Actions">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Enregistrer</Button>
          <Button variant="secondary">Annuler</Button>
          <Button variant="outline">Filtrer</Button>
          <Button variant="ghost">Ignorer</Button>
          <Button variant="destructive">Supprimer</Button>
          <Button variant="link">En savoir plus</Button>
        </div>
      </Section>

      <Section
        titre="États métier"
        description="StatusBadge prend une tonalité, jamais un état métier. Les étapes de pipeline sont des lignes en base configurées par chaque client, et leur couleur vient de l API : un composant qui testerait le libellé « Converti » serait faux dès le premier client qui renomme ses étapes. Chaque aplat discret porte son propre jeton de texte, --x-subtle-foreground, distinct de --x-foreground qui est destiné à l aplat plein — à vérifier dans les deux thèmes avec le sélecteur ci-dessus."
      >
        <div className="flex flex-wrap gap-2">
          {ETATS.map((e) => (
            <StatusBadge key={e.label} tone={e.tone}>
              {e.label}
            </StatusBadge>
          ))}
        </div>
      </Section>

      <Section
        titre="Champs de formulaire"
        description="Un seul jeu de champs pour tout le produit — ChampTexte, ChampSelect, ChampZone — construits sur Field, que shadcn a substitué à form. L étiquette, l aide, l erreur et le câblage aria-describedby font partie du composant : ils ne s ajoutent pas après coup, et ne peuvent donc pas être oubliés. Le questionnaire dynamique du lot 5 générera ses onze types de questions depuis ce registre."
      >
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nouveau prospect</CardTitle>
            <CardDescription>
              Les champs réels seront dérivés du questionnaire du projet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <ChampTexte id="charte-nom" label="Nom" placeholder="Dupont" />

              <ChampTexte
                id="charte-email"
                label="Adresse email"
                type="email"
                placeholder="jean@example.com"
                erreur="Adresse email invalide."
              />

              <ChampSelect
                id="charte-source"
                label="Source"
                aide="La liste déroulante est native : sa valeur doit arriver dans le FormData d une Server Action."
              >
                <option>Salon</option>
                <option>Recommandation</option>
                <option>Publicité</option>
              </ChampSelect>

              <ChampZone
                id="charte-notes"
                label="Notes"
                rows={2}
                optionnel
              />

              <Separator />
              <Button className="w-full">Créer le prospect</Button>
            </FieldGroup>
          </CardContent>
        </Card>
      </Section>

      <Section
        titre="Mouvement"
        description="Trois durées et une seule courbe pour tout le produit. Une échelle plus fine ne tient pas dans le temps : chaque écran finit par inventer sa valeur. Le réglage système « animations réduites » ramène toutes ces durées à zéro."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {MOUVEMENT.map((m) => (
            <Card key={m.nom}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-mono text-sm font-medium">{m.nom}</p>
                  <p className="text-muted-foreground font-mono text-xs">
                    {m.valeur}
                  </p>
                </div>
                <div className="bg-muted h-1.5 overflow-hidden rounded-full">
                  <div
                    className="bg-brand-gradient h-full rounded-full"
                    style={{ width: `${33 * (MOUVEMENT.indexOf(m) + 1)}%` }}
                  />
                </div>
                <p className="text-muted-foreground text-xs">{m.usage}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section
        titre="Élévation"
        description="Les surfaces de contenu restent plates — leur profondeur vient du contraste entre le canevas et le blanc des cartes. Seules les surfaces temporaires, qui recouvrent du contenu, portent une ombre."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ELEVATION.map((e) => (
            <div key={e.nom} className="space-y-2">
              <div
                className={`bg-card border-border flex h-20 items-center justify-center rounded-lg border ${e.classe}`}
              >
                <span className="font-mono text-xs">{e.nom}</span>
              </div>
              <p className="text-muted-foreground text-xs">{e.usage}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section
        titre="Messages"
        description="Un Notice décrit un état qui persiste tant que sa cause persiste. À distinguer du toast, qui signale le résultat d'une action et disparaît."
      >
        <div className="space-y-3">
          <Notice variant="info">
            Ce prospect existe déjà dans un autre projet. C&apos;est autorisé :
            un même contact peut être travaillé sur plusieurs projets.
          </Notice>
          <Notice variant="success" titre="Import terminé">
            284 prospects créés, 3 lignes ignorées.
          </Notice>
          <Notice variant="warning" titre="Enregistrement suspendu">
            L&apos;abonnement ne permet plus d&apos;enregistrer de
            modifications. La consultation et l&apos;export restent disponibles.
          </Notice>
          <Notice variant="destructive">
            Ces identifiants ne correspondent à aucun compte.
          </Notice>
        </div>
      </Section>

      <Section
        titre="Écran vide"
        description="Le premier écran que voit tout nouvel utilisateur : un projet sans prospect, un questionnaire sans question. Il porte toujours une action — ou, à défaut, l'explication de qui peut fournir ce qui manque."
      >
        <EmptyState
          icon={Inbox}
          titre="Aucun prospect dans ce projet"
          description="Importez un fichier CSV ou créez le premier prospect à la main."
          action={<Button>Importer des prospects</Button>}
        />
      </Section>

      <Section
        titre="Typographie"
        description="Geist, choisie par le preset shadcn. Ses formes géométriques répondent au tracé du logo."
      >
        <div className="space-y-2">
          <p className="font-heading text-3xl font-semibold tracking-tight">
            Pilotage de la prospection
          </p>
          <p className="text-lg">
            Chaque projet garde sa cible, son questionnaire et son pipeline.
          </p>
          <p className="text-muted-foreground text-sm">
            Texte secondaire — 5,3:1 sur le fond, lisible en usage dense.
          </p>
          <p className="font-mono text-sm">+261 34 12 345 67</p>
        </div>
      </Section>
    </main>
  );
}

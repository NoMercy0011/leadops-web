import type { Metadata } from "next";
import Image from "next/image";

import { ModeToggle } from "@/components/mode-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
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

const ETATS = [
  { label: "Converti", classe: "bg-success-subtle text-success-foreground" },
  { label: "Relance en retard", classe: "bg-warning-subtle text-warning" },
  { label: "Perdu", classe: "bg-destructive-subtle text-destructive" },
  { label: "Nouveau", classe: "bg-info-subtle text-info" },
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
                            ? "bg-success-subtle text-success-foreground"
                            : "bg-destructive-subtle text-destructive"
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
        description="Aplats de badge, avec la déclinaison foncée en texte. Les étapes de pipeline étant configurables par projet, elles piocheront dans un jeu restreint défini au lot 3."
      >
        <div className="flex flex-wrap gap-2">
          {ETATS.map((e) => (
            <span
              key={e.label}
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${e.classe}`}
            >
              {e.label}
            </span>
          ))}
        </div>
      </Section>

      <Section titre="Formulaire">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Nouveau prospect</CardTitle>
            <CardDescription>
              Les champs réels seront dérivés du questionnaire du projet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nom">Nom</Label>
              <Input id="nom" placeholder="Dupont" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="jean@example.com" />
            </div>
            <Separator />
            <Button className="w-full">Créer le prospect</Button>
          </CardContent>
        </Card>
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

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Retour vers l'écran parent, en tête d'une page de détail.
 *
 * Il double le fil d'Ariane de l'en-tête, et c'est voulu. Le fil d'Ariane
 * affiche l'identifiant brut pour un segment dynamique — « #12 » — parce qu'il
 * ne connaît que l'URL ; ce lien-ci nomme la destination. Il offre surtout une
 * cible bien plus large, ce qui compte sur un écran tactile où le fil d'Ariane
 * de l'en-tête est masqué en dessous de `sm`.
 */
export function LienRetour({ href, label }: { href: string; label: string }) {
  return (
    <Button
      asChild
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-foreground duration-(--duration-fast) ease-brand -ml-2 w-fit transition-colors"
    >
      <Link href={href}>
        <ChevronLeft className="size-4" aria-hidden />
        {label}
      </Link>
    </Button>
  );
}

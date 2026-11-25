"use client";

import { animate, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatNombre } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Animations du tableau de bord — lot 12, règle R8 et planche n°12.
 *
 * Les apparitions (cartes, barres) sont en CSS, dans globals.css : le serveur
 * rend l'état final, la page reste lisible avant l'hydratation, et « réduire
 * les animations » les coupe (revue du lot 12). Changer de période garde les
 * composants montés : l'entrée ne rejoue pas. `motion` ne sert qu'au
 * glissement des chiffres d'une période à l'autre, coupé lui aussi par
 * `useReducedMotion`.
 *
 * Durées et courbe : celles des jetons du produit (`--duration-slow` = 320 ms,
 * `--ease-brand` = cubic-bezier(0.2, 0, 0, 1)), recopiées ici parce que
 * `motion` anime en JavaScript et ne lit pas les variables CSS.
 */
const EASE_BRAND = [0.2, 0, 0, 1] as const;
const DUREE_LENTE = 0.32;

/**
 * Carte qui apparaît en fondu, montée de 8 px, décalée selon son rang. En CSS
 * (`.lo-apparition`, globals.css) : rendue visible par le serveur, coupée
 * sous « réduire les animations » (revue du lot 12).
 */
export function Apparition({
  rang = 0,
  className,
  children,
}: {
  rang?: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("lo-apparition", className)} style={{ animationDelay: `${rang * 40}ms` }}>
      {children}
    </div>
  );
}

/**
 * Nombre qui glisse d'une valeur à l'autre quand la période change (320 ms). Le texte final est rendu dès le
 * serveur : sans JavaScript, ou pour un lecteur d'écran, la valeur est juste.
 */
export function Compteur({ valeur, decimales = 0 }: { valeur: number; decimales?: number }) {
  const reduit = useReducedMotion();
  const precedente = useRef<number | null>(null);
  const [affichee, setAffichee] = useState(valeur);

  useEffect(() => {
    // Premier rendu : la valeur du serveur reste affichée, sans repartir de
    // zéro — le chiffre clignotait (revue du lot 12). Seuls les changements
    // de période s'animent.
    if (precedente.current === null) {
      precedente.current = valeur;
      return;
    }
    const depart = precedente.current;
    precedente.current = valeur;
    if (reduit || depart === valeur) {
      setAffichee(valeur);
      return;
    }
    const controle = animate(depart, valeur, {
      duration: DUREE_LENTE,
      ease: EASE_BRAND,
      onUpdate: (v) => setAffichee(v),
    });
    return () => controle.stop();
  }, [valeur, reduit]);

  const texte =
    decimales > 0
      ? affichee.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
      : formatNombre(Math.round(affichee));

  return (
    <>
      <span aria-hidden>{texte}</span>
      <span className="sr-only">
        {decimales > 0
          ? valeur.toLocaleString("fr-FR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales })
          : formatNombre(valeur)}
      </span>
    </>
  );
}

/**
 * Barre qui s'allonge (600 ms). Largeur finale rendue par le serveur ;
 * l'allongement est une animation CSS (`.lo-barre`), coupée sous « réduire
 * les animations ». `depuisCentre` pour l'entonnoir, centré.
 */
export function BarreAnimee({
  largeur,
  depuisCentre = false,
  className,
  style,
  children,
}: {
  largeur: number;
  depuisCentre?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("lo-barre", depuisCentre && "lo-barre-centre", className)} style={{ ...style, width: `${largeur}%` }}>
      {children}
    </div>
  );
}

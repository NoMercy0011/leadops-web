"use client";

import { animate, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { formatNombre } from "@/lib/format";

/**
 * Animations du tableau de bord — lot 12, règle R8 et planche n°12.
 *
 * Elles jouent à l'apparition des composants : une navigation dans la même
 * page (changer de période) garde les composants montés, donc ne rejoue pas
 * l'entrée — seules les valeurs glissent de l'ancienne à la nouvelle. Sous
 * « réduire les animations » du système, tout s'affiche directement : c'est
 * `useReducedMotion`, en plus de la règle globale de `globals.css`, qui ne
 * couvre que les animations CSS.
 *
 * Durées et courbe : celles des jetons du produit (`--duration-slow` = 320 ms,
 * `--ease-brand` = cubic-bezier(0.2, 0, 0, 1)), recopiées ici parce que
 * `motion` anime en JavaScript et ne lit pas les variables CSS.
 */
const EASE_BRAND = [0.2, 0, 0, 1] as const;
const DUREE_LENTE = 0.32;

/** Carte qui apparaît en fondu, montée de 8 px, décalée selon son rang. */
export function Apparition({
  rang = 0,
  className,
  children,
}: {
  rang?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const reduit = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduit ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: DUREE_LENTE, ease: EASE_BRAND, delay: rang * 0.04 }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Nombre qui compte jusqu'à sa valeur (600 ms), puis glisse d'une valeur à
 * l'autre quand la période change (320 ms). Le texte final est rendu dès le
 * serveur : sans JavaScript, ou pour un lecteur d'écran, la valeur est juste.
 */
export function Compteur({ valeur, decimales = 0 }: { valeur: number; decimales?: number }) {
  const reduit = useReducedMotion();
  const precedente = useRef<number | null>(null);
  const [affichee, setAffichee] = useState(valeur);

  useEffect(() => {
    const depart = precedente.current ?? 0;
    precedente.current = valeur;
    if (reduit || depart === valeur) {
      setAffichee(valeur);
      return;
    }
    const controle = animate(depart, valeur, {
      duration: depart === 0 ? 0.6 : DUREE_LENTE,
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

/** Barre qui s'allonge depuis la gauche (600 ms). */
export function BarreAnimee({
  largeur,
  className,
  style,
  children,
}: {
  largeur: number;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const reduit = useReducedMotion();

  return (
    <motion.div
      className={className}
      style={style}
      initial={reduit ? false : { width: 0, opacity: 0.4 }}
      animate={{ width: `${largeur}%`, opacity: 1 }}
      transition={{ duration: 0.6, ease: EASE_BRAND }}
    >
      {children}
    </motion.div>
  );
}

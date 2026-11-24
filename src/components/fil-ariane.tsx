"use client";

import {
  createContext,
  Fragment,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

/**
 * Fil d'Ariane dérivé de l'URL.
 *
 * L'en-tête ne portait au départ que la poignée de la navigation et le
 * sélecteur de thème : rien n'y disait où l'on était. Sur un produit qui
 * descend à trois niveaux — projet, prospect, fiche — c'est le repère qui
 * manque le plus.
 *
 * Le libellé vient d'une table plutôt que du segment d'URL : « tableau-de-bord »
 * affiché tel quel serait à peine lisible, et la table permet aussi de nommer
 * correctement les segments accentués que l'URL ne peut pas porter.
 */
const LIBELLES: Record<string, string> = {
  "tableau-de-bord": "Tableau de bord",
  projets: "Projets",
  prospects: "Prospects",
  calendrier: "Calendrier",
  rapports: "Rapports",
  parametres: "Paramètres",
  "back-office": "Back-office",
  entreprises: "Entreprises",
  abonnements: "Abonnements",
  plans: "Plans",
  variantes: "Variantes",
  kanban: "Kanban",
  // Lot 9 : sections de la fiche projet et page d'abonnement de l'entreprise.
  reglages: "Réglages",
  "rendez-vous": "Rendez-vous",
  abonnement: "Abonnement",
};

/**
 * Nom au singulier de la collection parente.
 *
 * Sert de repli pour un identifiant. « #12 » n'apprend rien à personne :
 * l'identifiant technique d'une ressource n'a de sens que pour la base. Faute
 * de mieux, « Projet » situe au moins l'utilisateur — et c'est ce qui s'affiche
 * le temps que le nom réel arrive.
 */
const SINGULIERS: Record<string, string> = {
  projets: "Projet",
  prospects: "Prospect",
  entreprises: "Entreprise",
  variantes: "Variante",
};

/**
 * Noms réels des ressources, par segment d'URL.
 *
 * Le fil d'Ariane est un composant client posé dans la coque : il ne connaît
 * que l'URL et n'a aucun moyen de savoir qu'un « 1 » désigne « Assurance
 * Santé ». Seule la page de détail le sait, et elle est rendue *sous* la
 * coque — un enfant ne peut pas fournir une valeur à son parent pendant le
 * rendu.
 *
 * D'où ce contexte : la coque tient l'état, la page l'alimente au montage.
 * Le rendu serveur affiche donc le repli au singulier, remplacé par le nom
 * réel à l'hydratation. Jamais d'identifiant nu à l'écran, dans aucun des deux
 * temps.
 */
const LibellesContext = createContext<{
  libelles: Record<string, string>;
  definir: (segment: string, nom: string) => void;
}>({ libelles: {}, definir: () => {} });

export function FilArianeProvider({ children }: { children: React.ReactNode }) {
  const [libelles, setLibelles] = useState<Record<string, string>>({});

  const valeur = useMemo(
    () => ({
      libelles,
      definir: (segment: string, nom: string) =>
        setLibelles((actuels) =>
          // Comparaison avant écriture : sans elle, chaque rendu de la page
          // déclencherait un changement d'état, donc un nouveau rendu.
          actuels[segment] === nom ? actuels : { ...actuels, [segment]: nom },
        ),
    }),
    [libelles],
  );

  return (
    <LibellesContext.Provider value={valeur}>
      {children}
    </LibellesContext.Provider>
  );
}

/**
 * Donne son nom réel à un segment du fil d'Ariane.
 *
 * À rendre depuis une page de détail : `<LibelleFilAriane
 * segment={`projets/${projet.id}`} nom={projet.name} />`. La clé est
 * « parent/identifiant », comme dans l'URL. N'affiche rien.
 */
export function LibelleFilAriane({
  segment,
  nom,
}: {
  segment: string;
  nom: string;
}) {
  const { definir } = useContext(LibellesContext);

  useEffect(() => {
    definir(segment, nom);
  }, [definir, segment, nom]);

  return null;
}

function libelle(
  segment: string,
  parent: string | undefined,
  nomsConnus: Record<string, string>,
): string {
  // Les noms sont indexés par « parent/segment » (revue du lot 9) : indexés
  // par le seul identifiant, le prospect 5 prêtait un instant son nom au
  // projet 5 pendant la navigation.
  const cle = parent ? `${parent}/${segment}` : segment;

  if (nomsConnus[cle]) {
    return nomsConnus[cle];
  }

  if (LIBELLES[segment]) {
    return LIBELLES[segment];
  }

  // Un identifiant : on nomme la *nature* de la ressource plutôt que son
  // numéro, en attendant que la page fournisse son vrai nom.
  if (/^\d+$/.test(segment)) {
    return (parent && SINGULIERS[parent]) ?? "Détail";
  }

  return segment.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function FilAriane() {
  const pathname = usePathname();
  const { libelles } = useContext(LibellesContext);
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {segments.map((segment, index) => {
          const href = `/${segments.slice(0, index + 1).join("/")}`;
          const dernier = index === segments.length - 1;
          const texte = libelle(segment, segments[index - 1], libelles);

          return (
            <Fragment key={href}>
              <BreadcrumbItem
                // Sur téléphone, seul le segment courant tient dans la barre.
                // Les parents restent atteignables par le bouton retour du
                // navigateur, qui est le geste naturel sur ce format.
                className={dernier ? undefined : "hidden sm:block"}
              >
                {dernier ? (
                  <BreadcrumbPage className="max-w-52 truncate">
                    {texte}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{texte}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {dernier ? null : (
                <BreadcrumbSeparator className="hidden sm:block" />
              )}
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

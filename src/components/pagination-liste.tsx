import Link from "next/link";

/**
 * Navigation entre les pages d'une liste — lot 10, règle R3.
 *
 * La liste des prospects s'arrêtait à sa première page, sans moyen d'aller
 * plus loin. Les liens gardent tous les filtres de l'adresse et ne changent
 * que `page`.
 */
export function PaginationListe({
  base,
  filtres,
  page,
  derniere,
  total,
}: {
  base: string;
  filtres: Record<string, string | string[] | undefined>;
  page: number;
  derniere: number;
  total: number;
}) {
  if (derniere <= 1) {
    return null;
  }

  const vers = (cible: number) => {
    const parametres = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(filtres)) {
      if (cle !== "page" && typeof valeur === "string" && valeur !== "") {
        parametres.set(cle, valeur);
      }
    }
    if (cible > 1) parametres.set("page", String(cible));
    return parametres.size > 0 ? `${base}?${parametres.toString()}` : base;
  };

  return (
    <nav
      aria-label="Pages de la liste"
      className="text-muted-foreground flex items-center justify-between gap-4 text-sm"
    >
      {page > 1 ? (
        <Link href={vers(page - 1)} className="hover:text-foreground underline">
          Page précédente
        </Link>
      ) : (
        <span />
      )}
      <span>
        Page {page} sur {derniere} · {total} prospects
      </span>
      {page < derniere ? (
        <Link href={vers(page + 1)} className="hover:text-foreground underline">
          Page suivante
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

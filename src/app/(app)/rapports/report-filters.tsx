import {
  BarreFiltres,
  FamilleFiltre,
  LigneFiltre,
  type OptionFiltre,
} from "@/components/filtres";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Project, User, Variant } from "@/lib/types";

/**
 * Filtres du §11 : projet, variante, commercial, période.
 *
 * L'axe « entreprise » de l'esquisse n'apparaît pas : il est appliqué en amont
 * par le cloisonnement, et l'exposer ici en ferait un filtre contournable.
 *
 * Même modèle de jetons que les prospects et le calendrier, à une exception
 * près : **la période reste deux champs**. Un intervalle continu n'a pas de
 * valeurs à énumérer, et le réduire à quelques choix figés — trente jours, ce
 * mois — retirerait ce qu'un écran de rapport a de plus utile, la comparaison
 * de deux périodes arbitraires.
 *
 * Elle passe donc par un formulaire GET avec un bouton, plutôt que par une
 * navigation à chaque frappe : on pose les deux bornes, puis on applique une
 * fois. L'ancienne version repartait au serveur dès la première saisie, avec
 * une borne de fin encore vide.
 */
export function ReportFilters({
  projets,
  variantes,
  utilisateurs,
  from,
  to,
  parametres,
}: {
  projets: Pick<Project, "id" | "name">[];
  variantes: Variant[];
  utilisateurs: Pick<User, "id" | "name">[];
  from: string;
  to: string;
  parametres: URLSearchParams;
}) {
  const base = "/rapports";

  const autres = [...parametres.entries()].filter(
    ([cle]) => cle !== "from" && cle !== "to",
  );

  const optionsProjet: OptionFiltre[] = [
    { valeur: "", libelle: "Tous" },
    ...projets.map((projet) => ({
      valeur: String(projet.id),
      libelle: projet.name,
    })),
  ];

  const optionsVariante: OptionFiltre[] = [
    { valeur: "", libelle: "Toutes" },
    ...variantes.map((variante) => ({
      valeur: String(variante.id),
      libelle: variante.name,
    })),
  ];

  const optionsCommercial: OptionFiltre[] = [
    { valeur: "", libelle: "Tous" },
    ...utilisateurs.map((membre) => ({
      valeur: String(membre.id),
      libelle: membre.name,
    })),
  ];

  return (
    <BarreFiltres>
      <LigneFiltre>
        <form
          action={base}
          className="grid gap-x-3 gap-y-1 sm:grid-cols-[6.5rem_1fr] sm:items-start"
        >
          {autres.map(([cle, valeur]) => (
            <input key={cle} type="hidden" name={cle} value={valeur} />
          ))}

          <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase sm:pt-2.5">
            Période
          </span>

          <div className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="from" className="text-xs">
                Du
              </Label>
              <Input
                id="from"
                name="from"
                type="date"
                defaultValue={from}
                className="w-auto"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="to" className="text-xs">
                Au
              </Label>
              <Input
                id="to"
                name="to"
                type="date"
                defaultValue={to}
                className="w-auto"
              />
            </div>

            <Button type="submit" variant="outline" size="sm">
              Appliquer
            </Button>
          </div>
        </form>
      </LigneFiltre>

      <LigneFiltre>
        <FamilleFiltre
          libelle="Projet"
          parametre="project_id"
          options={optionsProjet}
          valeurActive={parametres.get("project_id") ?? ""}
          base={base}
          parametres={parametres}
        />
      </LigneFiltre>

      {variantes.length > 0 ? (
        <LigneFiltre>
          <FamilleFiltre
            libelle="Variante"
            parametre="variant_id"
            options={optionsVariante}
            valeurActive={parametres.get("variant_id") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>
      ) : null}

      {utilisateurs.length > 0 ? (
        <LigneFiltre>
          <FamilleFiltre
            libelle="Commercial"
            parametre="user_id"
            options={optionsCommercial}
            valeurActive={parametres.get("user_id") ?? ""}
            base={base}
            parametres={parametres}
          />
        </LigneFiltre>
      ) : null}
    </BarreFiltres>
  );
}

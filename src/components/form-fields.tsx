import * as React from "react";
import { ChevronDown } from "lucide-react";

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/**
 * Champs de formulaire du produit.
 *
 * Chaque boîte de dialogue des lots 2 et 3 réécrivait son propre trio
 * `Label` + `Input` + `<p class="text-destructive">`, avec des variantes : le
 * back-office s'était fabriqué un composant `Champ` local, l'éditeur de
 * pipeline posait les trois éléments à la main, et l'écran des variantes
 * affichait son erreur *hors* du champ, recalée par un `-mt-4`. Trois formes
 * pour un même objet, donc trois occasions de diverger — et deux d'entre elles
 * oubliaient déjà `aria-describedby`, qui est ce qui relie l'erreur au champ
 * pour une synthèse vocale.
 *
 * Tout passe désormais par `Field`, le composant que shadcn a substitué à
 * `form`. Le questionnaire dynamique du lot 5 générera ses champs depuis ce
 * même registre : ce qui est réglé ici vaudra pour les onze types de questions.
 *
 * Ces composants n'ont aucun état : ils s'utilisent indifféremment depuis un
 * composant serveur ou client.
 */

interface BaseProps {
  /** Sert d'`id` et de `name` : dans nos formulaires les deux coïncident. */
  id: string;
  label: string;
  /** Message d'erreur renvoyé par la Server Action pour ce champ. */
  erreur?: string;
  /** Aide affichée sous le champ, avant l'éventuelle erreur. */
  aide?: React.ReactNode;
  /**
   * Marque le champ comme facultatif.
   *
   * On signale l'exception, pas la règle : dans ces formulaires la plupart des
   * champs sont obligatoires, et semer des astérisques partout ajoute du bruit
   * sans informer. C'est l'inverse qui renseigne.
   */
  optionnel?: boolean;
}

function Etiquette({
  id,
  label,
  optionnel,
}: Pick<BaseProps, "id" | "label" | "optionnel">) {
  return (
    <FieldLabel htmlFor={id}>
      {label}
      {optionnel ? (
        <span className="text-muted-foreground font-normal">facultatif</span>
      ) : null}
    </FieldLabel>
  );
}

/**
 * Identifiants des éléments décrivant le champ, dans l'ordre où une synthèse
 * vocale doit les lire : l'aide d'abord, l'erreur ensuite.
 */
function decritPar(id: string, aide: boolean, erreur: boolean): string | undefined {
  const ids = [aide && `${id}-aide`, erreur && `${id}-erreur`].filter(Boolean);

  return ids.length > 0 ? ids.join(" ") : undefined;
}

export function ChampTexte({
  id,
  label,
  erreur,
  aide,
  optionnel,
  ...props
}: BaseProps & Omit<React.ComponentProps<typeof Input>, "id">) {
  return (
    <Field data-invalid={Boolean(erreur)}>
      <Etiquette id={id} label={label} optionnel={optionnel} />
      <Input
        id={id}
        name={id}
        aria-invalid={Boolean(erreur)}
        aria-describedby={decritPar(id, Boolean(aide), Boolean(erreur))}
        {...props}
      />
      {aide ? <FieldDescription id={`${id}-aide`}>{aide}</FieldDescription> : null}
      <FieldError id={`${id}-erreur`}>{erreur}</FieldError>
    </Field>
  );
}

export function ChampZone({
  id,
  label,
  erreur,
  aide,
  optionnel,
  ...props
}: BaseProps & Omit<React.ComponentProps<typeof Textarea>, "id">) {
  return (
    <Field data-invalid={Boolean(erreur)}>
      <Etiquette id={id} label={label} optionnel={optionnel} />
      <Textarea
        id={id}
        name={id}
        aria-invalid={Boolean(erreur)}
        aria-describedby={decritPar(id, Boolean(aide), Boolean(erreur))}
        {...props}
      />
      {aide ? <FieldDescription id={`${id}-aide`}>{aide}</FieldDescription> : null}
      <FieldError id={`${id}-erreur`}>{erreur}</FieldError>
    </Field>
  );
}

/**
 * Liste déroulante native, habillée comme un `Input`.
 *
 * **Pourquoi native et non le `Select` de shadcn.** Celui-ci est construit sur
 * Radix : il ne pose aucun champ de formulaire dans le DOM, et sa valeur
 * n'arriverait donc pas dans le `FormData` d'une Server Action. Tous nos
 * formulaires étant des Server Actions (invariant n°6), c'est le `<select>`
 * natif qui convient — avec le bénéfice secondaire de la liste déroulante du
 * système sur mobile.
 *
 * Les classes reprennent **exactement** celles d'`Input`. Les quatre selects
 * écrits à la main dans les lots 2 et 3 employaient `h-9 rounded-md
 * focus-visible:ring-2 bg-background`, là où `Input` est en `h-8 rounded-lg
 * ring-3 dark:bg-input/30` : hauteur, rayon, anneau de focus et fond en mode
 * sombre différaient, ce qui se voyait dès qu'un select côtoyait un champ
 * texte dans la même boîte de dialogue.
 */
export function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative w-full">
      <select
        data-slot="native-select"
        className={cn(
          "h-8 w-full min-w-0 appearance-none rounded-lg border border-input bg-transparent py-1 pr-8 pl-2.5 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          // Le menu déroulant reste rendu par le système : sur fond sombre,
          // sans cette couleur, les <option> héritent d'un fond blanc.
          "[&>option]:bg-popover [&>option]:text-popover-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </select>

      {/* `appearance-none` supprime le chevron du système ; on remet le nôtre
          pour que le champ reste reconnaissable comme une liste. */}
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
      />
    </div>
  );
}

export function ChampSelect({
  id,
  label,
  erreur,
  aide,
  optionnel,
  children,
  ...props
}: BaseProps & Omit<React.ComponentProps<"select">, "id">) {
  return (
    <Field data-invalid={Boolean(erreur)}>
      <Etiquette id={id} label={label} optionnel={optionnel} />
      <NativeSelect
        id={id}
        name={id}
        aria-invalid={Boolean(erreur)}
        aria-describedby={decritPar(id, Boolean(aide), Boolean(erreur))}
        {...props}
      >
        {children}
      </NativeSelect>
      {aide ? <FieldDescription id={`${id}-aide`}>{aide}</FieldDescription> : null}
      <FieldError id={`${id}-erreur`}>{erreur}</FieldError>
    </Field>
  );
}

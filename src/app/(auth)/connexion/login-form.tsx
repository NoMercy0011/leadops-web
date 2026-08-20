"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

import { login, type LoginState } from "./actions";
import { Notice } from "@/components/notice";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";

const INITIAL: LoginState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      size="lg"
      className="w-full"
      disabled={pending}
      // Le bouton reste monté et change d'état plutôt que d'être remplacé :
      // sa position ne bouge pas, et le lecteur d'écran annonce la progression
      // sur le même élément.
      aria-busy={pending}
    >
      {pending ? (
        <>
          <LoaderCircle className="size-4 animate-spin" aria-hidden />
          Connexion…
        </>
      ) : (
        "Se connecter"
      )}
    </Button>
  );
}

export function LoginForm() {
  const [state, formAction] = useActionState(login, INITIAL);
  const [motDePasseVisible, setMotDePasseVisible] = useState(false);
  const alerte = useRef<HTMLDivElement>(null);

  // Le message d'échec s'affiche en haut du formulaire, hors du champ de vision
  // de quelqu'un qui vient de cliquer sur le bouton du bas. Y amener le focus
  // le fait lire par la synthèse vocale et ramène la vue dessus.
  useEffect(() => {
    if (state.message) {
      alerte.current?.focus();
    }
  }, [state.message]);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {state.message ? (
        <Notice ref={alerte} variant="destructive" tabIndex={-1}>
          {state.message}
        </Notice>
      ) : null}

      <Field>
        <FieldLabel htmlFor="email">Adresse email</FieldLabel>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          // Le premier champ prend le focus au chargement : sur un écran qui ne
          // sert qu'à cela, faire cliquer l'utilisateur est un geste de trop.
          autoFocus
          required
          placeholder="vous@entreprise.mg"
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? "email-error" : undefined}
        />
        <FieldError id="email-error">{state.fieldErrors?.email}</FieldError>
      </Field>

      <Field>
        <div className="flex items-center justify-between gap-2">
          <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
          <Link
            href="/mot-de-passe-oublie"
            className="text-muted-foreground hover:text-primary duration-(--duration-fast) ease-brand text-sm underline-offset-4 transition-colors hover:underline"
          >
            Oublié ?
          </Link>
        </div>

        <InputGroup>
          <InputGroupInput
            id="password"
            name="password"
            type={motDePasseVisible ? "text" : "password"}
            autoComplete="current-password"
            required
            aria-invalid={Boolean(state.fieldErrors?.password)}
            aria-describedby={
              state.fieldErrors?.password ? "password-error" : undefined
            }
          />
          <InputGroupAddon align="inline-end">
            {/* Voir ce qu'on tape supprime la première cause d'échec de
                connexion. Le bouton est exclu de la tabulation : il se place
                entre le champ et le bouton d'envoi, où personne ne l'attend. */}
            <InputGroupButton
              size="icon-xs"
              tabIndex={-1}
              aria-label={
                motDePasseVisible
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
              onClick={() => setMotDePasseVisible((visible) => !visible)}
            >
              {motDePasseVisible ? <EyeOff /> : <Eye />}
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <FieldError id="password-error">
          {state.fieldErrors?.password}
        </FieldError>
      </Field>

      <SubmitButton />
    </form>
  );
}

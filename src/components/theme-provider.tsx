"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * next-themes pose la classe `dark` sur <html> avant la peinture, ce qui évite
 * le flash de thème clair au chargement. Le composant doit rester client :
 * il lit le stockage local et écoute la préférence système.
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}

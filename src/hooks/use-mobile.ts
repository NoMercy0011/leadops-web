import * as React from "react"

const MOBILE_BREAKPOINT = 768
const QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

/**
 * Version du hook livré par shadcn réécrite avec `useSyncExternalStore`.
 *
 * L'original appelait `setState` directement dans un `useEffect`, ce que la
 * règle `react-hooks/set-state-in-effect` de React 19 refuse : cela déclenche
 * un rendu en cascade. `useSyncExternalStore` est l'API prévue pour s'abonner
 * à une source extérieure à React — ici `matchMedia` — et gère en prime le
 * rendu serveur via son troisième argument.
 */
function subscribe(onStoreChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

// Côté serveur, aucune fenêtre : on suppose un écran large, ce qui évite
// d'afficher la variante mobile puis de la remplacer à l'hydratation.
function getServerSnapshot() {
  return false
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

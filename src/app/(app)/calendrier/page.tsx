import type { Metadata } from "next";

import { Agenda } from "./agenda";

export const metadata: Metadata = {
  title: "Calendrier",
};

/** Calendrier de l'entreprise — voir `Agenda`, partagé avec l'onglet Rendez-vous d'un projet. */
export default async function CalendrierPage({
  searchParams,
}: PageProps<"/calendrier">) {
  return <Agenda params={await searchParams} base="/calendrier" />;
}

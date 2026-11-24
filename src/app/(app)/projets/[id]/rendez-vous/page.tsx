import { notFound } from "next/navigation";

import { Agenda } from "@/app/(app)/calendrier/agenda";

/**
 * Rendez-vous du projet — décision P6 de la planche du lot 9.
 *
 * L'onglet reprend l'écran du Calendrier, borné au projet, comme l'onglet
 * Prospects reprend la liste des prospects. La branche y affichait une grille
 * mensuelle distincte : deux agendas qui auraient divergé.
 *
 * Les rendez-vous ne se créent pas ici mais depuis la fiche d'un prospect :
 * ils y héritent de son projet et de son commercial, alors qu'un formulaire
 * posé sur le calendrier obligerait à ressaisir les deux — et à traiter le cas
 * où ils se contredisent.
 */
export default async function RendezVousDuProjetPage({
  params,
  searchParams,
}: PageProps<"/projets/[id]/rendez-vous">) {
  const [{ id }, filtres] = await Promise.all([params, searchParams]);
  const projetId = Number(id);

  if (!Number.isInteger(projetId) || projetId <= 0) {
    notFound();
  }

  return (
    <Agenda
      params={filtres}
      base={`/projets/${projetId}/rendez-vous`}
      projetId={projetId}
    />
  );
}

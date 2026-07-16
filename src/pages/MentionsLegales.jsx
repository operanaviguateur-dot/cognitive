import React from "react";
import Navbar from "@/components/news/Navbar";
import Footer from "@/components/news/Footer";

export default function MentionsLegales() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-heading text-4xl font-semibold tracking-tight mb-10">
          Mentions légales
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Éditeur du site</h2>
            <p>
              Cognitive Chronicle est édité par l'équipe Cognitive Chronicle. Pour toute
              question relative au contenu ou au fonctionnement du site, vous pouvez nous
              contacter via le formulaire de contact.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Hébergement</h2>
            <p>
              Le site est hébergé par Base44, Inc. sur des serveurs sécurisés. Les données
              sont traitées conformément à notre politique de confidentialité.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Propriété intellectuelle</h2>
            <p>
              L'ensemble des contenus publiés sur Cognitive Chronicle (articles, visuels,
              synthèses, logos) est protégé par le droit de la propriété intellectuelle.
              Toute reproduction, représentation ou diffusion, totale ou partielle, sans
              autorisation écrite préalable est interdite.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Responsabilité éditoriale</h2>
            <p>
              Les articles sont générés ou assistés par intelligence artificielle, puis
              vérifiés par notre équipe éditoriale. Malgré le soin apporté à la
              vérification des sources, des erreurs ou inexactitudes peuvent subsister.
              Cognitive Chronicle ne saurait être tenu responsable des décisions prises
              sur la base des informations publiées.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Liens hypertextes</h2>
            <p>
              Le site peut contenir des liens vers des sites tiers. Cognitive Chronicle
              n'exerce aucun contrôle sur ces sites et décline toute responsabilité quant
              à leur contenu.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Droit applicable</h2>
            <p>
              Les présentes mentions légales sont régies par le droit français. Tout
              litige relèvera de la compétence des juridictions françaises compétentes.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
import React from "react";
import Navbar from "@/components/news/Navbar";
import Footer from "@/components/news/Footer";

export default function Confidentialite() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="font-heading text-4xl font-semibold tracking-tight mb-10">
          Politique de confidentialité
        </h1>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Données collectées</h2>
            <p>
              Cognitive Chronicle collecte uniquement les données strictement nécessaires
              au fonctionnement du service : adresse e-mail (lors de la création d'un
              compte), préférences de lecture et données techniques (type d'appareil,
              navigateur) visant à améliorer l'expérience utilisateur.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Utilisation des données</h2>
            <p>
              Vos données sont utilisées pour vous fournir un accès au service, personnaliser
              votre expérience de lecture, assurer la sécurité du compte et, le cas échéant,
              vous transmettre des communications liées au service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Conservation</h2>
            <p>
              Les données sont conservées pour la durée strictement nécessaire à la
              fourniture du service. Les comptes inactifs font l'objet d'une suppression
              après une période prolongée d'inactivité, conformément aux obligations légales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Cookies</h2>
            <p>
              Le site utilise des cookies techniques nécessaires au bon fonctionnement
              (session, préférences de lecture). Aucun cookie publicitaire ni de pistage
              tiers n'est déposé sans votre consentement.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Partage des données</h2>
            <p>
              Vos données ne sont jamais vendues ni cédées à des tiers. Elles peuvent
              être transmises uniquement à nos prestataires techniques agissant en qualité
              de sous-traitants, dans le respect strict du RGPD.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Vos droits</h2>
            <p>
              Conformément au Règlement Général sur la Protection des Données (RGPD), vous
              disposez d'un droit d'accès, de rectification, d'effacement et d'opposition
              concernant vos données. Pour exercer ces droits, contactez-nous via le
              formulaire de contact.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">Sécurité</h2>
            <p>
              Nous mettons en œuvre des mesures techniques et organisationnelles
              appropriées pour protéger vos données contre la perte, l'accès non autorisé
              ou la divulgation. Aucune méthode de transmission n'étant totalement sûre,
              nous ne pouvons garantir une sécurité absolue.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
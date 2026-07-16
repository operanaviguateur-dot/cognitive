import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <span className="font-heading text-lg font-semibold">Cognitive Chronicle</span>
            <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mt-3">
              L'actualité distillée par l'intelligence artificielle. Chaque fait vérifié, chaque perspective analysée.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold mb-4 uppercase tracking-wide">Navigation</h4>
            <div className="space-y-2.5">
              <Link to="/" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Accueil</Link>
              <Link to="/?cat=politique" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Politique</Link>
              <Link to="/?cat=technologie" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Technologie</Link>
              <Link to="/?cat=monde" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Monde</Link>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold mb-4 uppercase tracking-wide">Informations</h4>
            <div className="space-y-2.5">
              <Link to="/mentions-legales" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Mentions légales</Link>
              <Link to="/confidentialite" className="block text-sm text-muted-foreground hover:text-foreground transition-colors">Confidentialité</Link>
              <span className="block text-sm text-muted-foreground">Contact</span>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <span>© 2026 Cognitive Chronicle. Tous droits réservés.</span>
          <span className="uppercase tracking-wide">Propulsé par l'Intelligence Artificielle</span>
        </div>
      </div>
    </footer>
  );
}
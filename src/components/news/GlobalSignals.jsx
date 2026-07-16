import React, { useState } from "react";

import { Globe, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiAI } from "@/api/client";

export default function GlobalSignals() {
  const [signals, setSignals] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchSignals = async () => {
    setLoading(true);
    const res = await apiAI(
      `Tu es un agrégateur d'actualités internationales. Génère 6 titres d'actualité fictifs mais réalistes provenant de différentes villes du monde (Tokyo, Paris, Dubaï, New York, São Paulo, Lagos). Chaque titre doit être en français, réaliste et actuel. Inclus la ville source et la catégorie.`,
      {
        type: "object",
        properties: {
          headlines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                city: { type: "string" },
                title: { type: "string" },
                category: { type: "string" }
              }
            }
          }
        }
      }
    );
    setSignals(res.headlines);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Signaux Globaux</span>
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={fetchSignals} disabled={loading}>
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
        </Button>
      </div>

      <div className="confidence-line" />

      {!signals && !loading && (
        <button onClick={fetchSignals} className="w-full text-center py-8 text-muted-foreground text-sm hover:text-foreground transition-colors">
          Charger les signaux internationaux
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 text-muted-foreground text-sm gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Scan des flux internationaux...
        </div>
      )}

      {signals && (
        <div className="space-y-4">
          {signals.map((s, i) => (
            <div key={i}>
              <div className="text-xs text-primary mb-1 uppercase tracking-wide">{s.city} · {s.category}</div>
              <p className="text-sm leading-snug">{s.title}</p>
              {i < signals.length - 1 && <div className="confidence-line mt-3" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
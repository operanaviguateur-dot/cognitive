import React, { useState } from "react";

import { Sparkles, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiAI } from "@/api/client";

export default function SynthesisBar({ articles }) {
  const [briefing, setBriefing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const generateBriefing = async () => {
    if (briefing) {
      setExpanded(!expanded);
      return;
    }
    setLoading(true);
    setExpanded(true);
    const titles = articles.slice(0, 10).map((a) => `- ${a.title} (${a.category})`).join("\n");
    const res = await apiAI(
      `Tu es un analyste d'actualités de haut niveau. Voici les titres des articles les plus récents:\n${titles}\n\nGénère un briefing matinal en EXACTEMENT 3 points clés, chacun en une phrase percutante. Sois précis et analytique. Réponds en français.`,
      {
        type: "object",
        properties: {
          points: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    );
    setBriefing(res.points);
    setLoading(false);
  };

  return (
    <div className="ai-halo rounded-xl p-5 md:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Synthèse IA</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={generateBriefing}
          disabled={loading}
          className="text-xs"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
          ) : expanded ? (
            <ChevronUp className="w-3.5 h-3.5 mr-1.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 mr-1.5" />
          )}
          {briefing ? (expanded ? "Réduire" : "Afficher") : "Générer le briefing"}
        </Button>
      </div>

      {expanded && briefing && (
        <div className="mt-4 space-y-3">
          {briefing.map((point, i) => (
            <div key={i} className="flex gap-3">
              <span className="text-primary text-sm font-semibold mt-0.5">{i + 1}.</span>
              <p className="text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      )}

      {expanded && loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyse des tendances en cours...
        </div>
      )}
    </div>
  );
}
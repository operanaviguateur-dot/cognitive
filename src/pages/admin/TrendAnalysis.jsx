import React, { useState } from "react";

import { Loader2, TrendingUp, Sparkles, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiAI } from "@/api/client";

export default function TrendAnalysis() {
  const [trends, setTrends] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [topicInput, setTopicInput] = useState("");
  const [topicAnalysis, setTopicAnalysis] = useState(null);
  const [analyzingTopic, setAnalyzingTopic] = useState(false);
  const [headlineGen, setHeadlineGen] = useState(null);
  const [generatingHeadlines, setGeneratingHeadlines] = useState(false);

  const fetchTrends = async () => {
    setLoadingTrends(true);
    const res = await apiAI(
      `Tu es un analyste de tendances médiatiques de pointe. Identifie les 8 sujets d'actualité les plus importants en ce moment dans le monde. Pour chacun, donne:\n- Le sujet\n- La catégorie (politique, technologie, économie, science, culture, sport, monde, environnement)\n- Un score de vélocité de 1 à 100 (à quel point le sujet gagne en traction)\n- Le sentiment dominant (positif/négatif/neutre)\n- Une prédiction sur l'évolution dans les prochaines 48h\n\nRéponds en français.`,
      {
        type: "object",
        properties: {
          trends: {
            type: "array",
            items: {
              type: "object",
              properties: {
                topic: { type: "string" },
                category: { type: "string" },
                velocity: { type: "number" },
                sentiment: { type: "string" },
                prediction: { type: "string" },
              },
            },
          },
        },
      }
    );
    setTrends(res.trends);
    setLoadingTrends(false);
  };

  const analyzeTopic = async () => {
    if (!topicInput.trim()) return;
    setAnalyzingTopic(true);
    const res = await apiAI(
      `Fais une analyse approfondie du sujet suivant: "${topicInput}"\n\nInclus:\n1. Contexte et enjeux principaux\n2. Les acteurs clés impliqués\n3. Les différentes perspectives (pour/contre/neutre)\n4. L'impact potentiel à court et long terme\n5. Les questions non résolues\n6. Score de pertinence éditoriale (1-100)\n\nRéponds en français de manière analytique et précise.`,
      {
        type: "object",
        properties: {
          context: { type: "string" },
          key_actors: { type: "array", items: { type: "string" } },
          perspectives: {
            type: "object",
            properties: {
              pro: { type: "string" },
              contra: { type: "string" },
              neutral: { type: "string" },
            },
          },
          impact: { type: "string" },
          open_questions: { type: "array", items: { type: "string" } },
          editorial_score: { type: "number" },
        },
      }
    );
    setTopicAnalysis(res);
    setAnalyzingTopic(false);
  };

  const generateHeadlines = async () => {
    setGeneratingHeadlines(true);
    const res = await apiAI(
      `Génère 6 idées de titres d'articles originaux et percutants pour un média d'actualité francophone en 2026. Chaque titre doit être sur un sujet différent, couvrant politique, tech, économie, science, culture et monde. Les titres doivent être accrocheurs, informatifs et donner envie de cliquer sans être clickbait. Ajoute pour chacun une brève description de l'angle éditorial.`,
      {
        type: "object",
        properties: {
          headlines: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: { type: "string" },
                angle: { type: "string" },
              },
            },
          },
        },
      }
    );
    setHeadlineGen(res.headlines);
    setGeneratingHeadlines(false);
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-heading text-2xl font-bold">Tendances & Intelligence</h1>
        <p className="text-muted-foreground text-sm mt-1">Détectez les signaux avant-coureurs</p>
      </div>

      {/* Trend Velocity */}
      <div className="ai-halo rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span className="font-mono-upper text-xs font-semibold">Vélocité des Tendances</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTrends} disabled={loadingTrends} className="font-mono-upper text-xs">
            {loadingTrends ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
            {trends ? "Rafraîchir" : "Scanner"}
          </Button>
        </div>

        {loadingTrends && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
            <Loader2 className="w-4 h-4 animate-spin" />
            Scan des tendances mondiales...
          </div>
        )}

        {trends && (
          <div className="space-y-4">
            {trends.map((t, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-12 text-right flex-shrink-0">
                  <span className={`font-mono text-lg font-bold ${t.velocity > 70 ? "text-red-400" : t.velocity > 40 ? "text-yellow-400" : "text-muted-foreground"}`}>
                    {t.velocity}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm">{t.topic}</span>
                    <span className="font-mono-upper text-xs text-primary">{t.category}</span>
                    <span className={`font-mono-upper text-xs ${
                      t.sentiment === "positif" ? "text-green-400" :
                      t.sentiment === "négatif" || t.sentiment === "negatif" ? "text-red-400" : "text-muted-foreground"
                    }`}>{t.sentiment}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{t.prediction}</p>
                </div>
                <div className="w-24 flex-shrink-0">
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${t.velocity > 70 ? "bg-red-400" : t.velocity > 40 ? "bg-yellow-400" : "bg-muted-foreground"}`}
                      style={{ width: `${t.velocity}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Deep Topic Analysis */}
      <div className="ai-halo rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-mono-upper text-xs font-semibold">Analyse Approfondie d'un Sujet</span>
        </div>

        <div className="flex gap-3 mb-4">
          <Input
            placeholder="Entrez un sujet à analyser en profondeur..."
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            className="flex-1 bg-background/50"
          />
          <Button onClick={analyzeTopic} disabled={analyzingTopic || !topicInput.trim()}>
            {analyzingTopic ? <Loader2 className="w-4 h-4 animate-spin" /> : "Analyser"}
          </Button>
        </div>

        {analyzingTopic && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse en profondeur...
          </div>
        )}

        {topicAnalysis && (
          <div className="space-y-5 mt-4">
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono-upper text-xs text-muted-foreground">Score éditorial</span>
              <span className="font-mono text-2xl font-bold text-primary">{topicAnalysis.editorial_score}/100</span>
            </div>

            <div>
              <h4 className="font-mono-upper text-xs font-semibold mb-2">Contexte</h4>
              <p className="text-sm leading-relaxed">{topicAnalysis.context}</p>
            </div>

            <div>
              <h4 className="font-mono-upper text-xs font-semibold mb-2">Acteurs clés</h4>
              <div className="flex flex-wrap gap-2">
                {topicAnalysis.key_actors?.map((a, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-muted text-xs">{a}</span>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {["pro", "contra", "neutral"].map((key) => (
                <div key={key} className="p-3 rounded-lg bg-background/50 border border-border">
                  <span className="font-mono-upper text-xs text-primary mb-1 block">
                    {key === "pro" ? "Pour" : key === "contra" ? "Contre" : "Neutre"}
                  </span>
                  <p className="text-xs leading-relaxed">{topicAnalysis.perspectives?.[key]}</p>
                </div>
              ))}
            </div>

            <div>
              <h4 className="font-mono-upper text-xs font-semibold mb-2">Impact</h4>
              <p className="text-sm leading-relaxed">{topicAnalysis.impact}</p>
            </div>

            <div>
              <h4 className="font-mono-upper text-xs font-semibold mb-2">Questions ouvertes</h4>
              <ul className="space-y-1">
                {topicAnalysis.open_questions?.map((q, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex gap-2">
                    <span className="text-primary">?</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Headline Generator */}
      <div className="ai-halo rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-mono-upper text-xs font-semibold">Générateur de Titres</span>
          </div>
          <Button variant="outline" size="sm" onClick={generateHeadlines} disabled={generatingHeadlines} className="font-mono-upper text-xs">
            {generatingHeadlines ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Générer des idées
          </Button>
        </div>

        {generatingHeadlines && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Création d'idées éditoriales...
          </div>
        )}

        {headlineGen && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {headlineGen.map((h, i) => (
              <div key={i} className="p-4 rounded-lg bg-background/50 border border-border hover:border-primary/30 transition-colors">
                <span className="font-mono-upper text-xs text-primary mb-1 block">{h.category}</span>
                <p className="font-heading font-semibold text-sm mb-2">{h.title}</p>
                <p className="text-xs text-muted-foreground">{h.angle}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
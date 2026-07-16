import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { FileText, Eye, TrendingUp, PenSquare, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import ArticleCard from "@/components/news/ArticleCard";
import { apiGet, apiAI } from "@/api/client";

export default function AdminDashboard() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [aiInsight, setAiInsight] = useState(null);
  const [insightLoading, setInsightLoading] = useState(false);

  useEffect(() => {
    apiGet('/api/articles', { sort: "-created_date", limit: 20 }).then((data) => {
      setArticles(data);
      setLoading(false);
    });
  }, []);

  const published = articles.filter((a) => a.status === "publie");
  const drafts = articles.filter((a) => a.status === "brouillon");
  const totalViews = articles.reduce((sum, a) => sum + (a.views_count || 0), 0);

  const generateInsight = async () => {
    setInsightLoading(true);
    const titles = articles.slice(0, 10).map((a) => `- ${a.title} (${a.category}, ${a.status})`).join("\n");
    const res = await apiAI(
      `Tu es un conseiller éditorial IA. Voici mes derniers articles:\n${titles}\n\nDonne-moi 3 recommandations stratégiques pour améliorer ma couverture éditoriale: quels sujets manquent, quel angle exploiter, quelle catégorie renforcer. Sois concis et actionnable. Réponds en français.`,
      {
        type: "object",
        properties: {
          recommendations: { type: "array", items: { type: "string" } }
        }
      }
    );
    setAiInsight(res.recommendations);
    setInsightLoading(false);
  };

  const stats = [
    { label: "Articles publiés", value: published.length, icon: FileText },
    { label: "Brouillons", value: drafts.length, icon: PenSquare },
    { label: "Vues totales", value: totalViews, icon: Eye },
    { label: "Breaking", value: articles.filter((a) => a.priority === "breaking").length, icon: TrendingUp },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre publication</p>
        </div>
        <Link to="/admin/create">
          <Button className="font-mono-upper text-xs">
            <PenSquare className="w-3.5 h-3.5 mr-1.5" />
            Nouvel Article
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono-upper text-xs text-muted-foreground">{s.label}</span>
            </div>
            <p className="font-heading text-3xl font-bold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* AI Editorial Insight */}
      <div className="ai-halo rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="font-mono-upper text-xs font-semibold">Conseiller Éditorial IA</span>
          </div>
          <Button variant="outline" size="sm" onClick={generateInsight} disabled={insightLoading} className="font-mono-upper text-xs">
            {insightLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            {aiInsight ? "Rafraîchir" : "Analyser"}
          </Button>
        </div>
        {insightLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyse éditoriale en cours...
          </div>
        )}
        {aiInsight && (
          <div className="space-y-3">
            {aiInsight.map((rec, i) => (
              <div key={i} className="flex gap-3">
                <span className="font-mono text-primary text-xs font-bold mt-0.5">0{i + 1}</span>
                <p className="text-sm leading-relaxed">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div>
          <h2 className="font-mono-upper text-xs font-semibold mb-4">Derniers articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {articles.slice(0, 6).map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
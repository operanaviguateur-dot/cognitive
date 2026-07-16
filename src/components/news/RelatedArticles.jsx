import React, { useState, useEffect } from "react";

import { Loader2, Sparkles } from "lucide-react";
import ArticleCard from "@/components/news/ArticleCard";
import { apiGet, apiAI } from "@/api/client";

export default function RelatedArticles({ article }) {
  const [related, setRelated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // First try to get articles in the same category
      let candidates = await apiGet('/api/articles', { status: "publie", category: article.category, sort: "-created_date", limit: 20 });
      // Remove current article
      candidates = candidates.filter((a) => a.id !== article.id);

      // If not enough in same category, get more from other categories
      if (candidates.length < 3) {
        const more = await apiGet('/api/articles', { status: "publie", sort: "-created_date", limit: 20 });
        const extra = more.filter((a) => a.id !== article.id && a.category !== article.category);
        candidates = [...candidates, ...extra];
      }

      // Use AI to rank by relevance based on tags and content
      let ranked = candidates.slice(0, 6);
      if (candidates.length > 3) {
        try {
          const candidateData = candidates.slice(0, 10).map((a) => ({
            id: a.id,
            title: a.title,
            tags: a.tags || [],
            category: a.category,
            summary: a.summary || "",
          }));
          const res = await apiAI(
            `Voici l'article principal:\nTitre: ${article.title}\nTags: ${(article.tags || []).join(", ")}\nCatégorie: ${article.category}\n\nEt voici des articles candidats:\n${JSON.stringify(candidateData)}\n\nClasse ces articles par pertinence (du plus pertinent au moins pertinent) en fonction de la similarité des sujets, tags et catégories. Retourne uniquement les 3 IDs les plus pertinents.`,
            {
              type: "object",
              properties: {
                ranked_ids: { type: "array", items: { type: "string" } },
              },
            }
          );
          if (res.ranked_ids && res.ranked_ids.length > 0) {
            ranked = res.ranked_ids
              .map((id) => candidates.find((a) => a.id === id))
              .filter(Boolean)
              .slice(0, 3);
            // Fill if AI returned fewer than 3
            if (ranked.length < 3) {
              const usedIds = new Set(ranked.map((a) => a.id));
              const fillers = candidates.filter((a) => !usedIds.has(a.id)).slice(0, 3 - ranked.length);
              ranked = [...ranked, ...fillers];
            }
          }
        } catch (e) {
          ranked = candidates.slice(0, 3);
        }
      }

      setRelated(ranked.slice(0, 3));
      setLoading(false);
    };
    load();
  }, [article.id]);

  if (loading) {
    return (
      <div className="mt-12 max-w-[720px] mx-auto">
        <div className="confidence-line mb-8" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" />
          L'IA analyse les articles similaires...
        </div>
      </div>
    );
  }

  if (!related || related.length === 0) return null;

  return (
    <div className="mt-12 max-w-[720px] mx-auto">
      <div className="confidence-line mb-8" />

      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="font-mono-upper text-xs font-semibold">À lire également</span>
        <span className="font-mono-upper text-xs text-muted-foreground">— Recommandé par l'IA</span>
      </div>

      <div className="space-y-6">
        {related.map((a) => (
          <ArticleCard key={a.id} article={a} variant="compact" />
        ))}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";

import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/news/Navbar";
import HeroArticle from "@/components/news/HeroArticle";
import ArticleCard from "@/components/news/ArticleCard";
import SynthesisBar from "@/components/news/SynthesisBar";
import GlobalSignals from "@/components/news/GlobalSignals";
import Footer from "@/components/news/Footer";
import { apiGet } from "@/api/client";

export default function Home() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const category = searchParams.get("cat");
  const searchQuery = searchParams.get("q");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await apiGet('/api/articles', {
        status: 'publie',
        category: category || undefined,
        sort: '-created_date',
        limit: 50,
      });

      let filtered = data;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = data.filter(
          (a) =>
            a.title?.toLowerCase().includes(q) ||
            a.subtitle?.toLowerCase().includes(q) ||
            a.content?.toLowerCase().includes(q) ||
            a.tags?.some((t) => t.toLowerCase().includes(q))
        );
      }
      setArticles(filtered);
      setLoading(false);
    };
    load();
  }, [category, searchQuery]);

  const hero = articles.find((a) => a.priority === "breaking") || articles[0];
  const rest = articles.filter((a) => a.id !== hero?.id);
  const featured = rest.slice(0, 4);
  const secondary = rest.slice(4);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        {(category || searchQuery) && (
          <div className="mb-10">
            <h2 className="font-heading text-3xl font-semibold capitalize tracking-tight">
              {searchQuery ? `Résultats : "${searchQuery}"` : category}
            </h2>
          </div>
        )}

        {articles.length === 0 ? (
          <div className="text-center py-24 text-muted-foreground">
            <p className="font-heading text-2xl mb-2">Aucun article disponible</p>
            <p className="text-sm">Revenez bientôt pour les dernières actualités.</p>
          </div>
        ) : (
          <>
            <SynthesisBar articles={articles} />

            <div className="mt-10">
              <HeroArticle article={hero} />
            </div>

            <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10">
              <div className="lg:col-span-9">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {featured.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>

                {secondary.length > 0 && (
                  <div className="mt-12">
                    <h3 className="text-xs font-semibold mb-6 uppercase tracking-wide">Plus d'actualités</h3>
                    <div className="space-y-6">
                      {secondary.map((article) => (
                        <React.Fragment key={article.id}>
                          <ArticleCard article={article} variant="compact" />
                          <div className="confidence-line" />
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="lg:col-span-3">
                <div className="sticky top-24 space-y-8">
                  <GlobalSignals />
                </div>
              </aside>
            </div>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
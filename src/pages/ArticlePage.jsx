import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

import { Loader2, ArrowLeft, Clock, Sparkles, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import Navbar from "@/components/news/Navbar";
import Footer from "@/components/news/Footer";
import CommentsSection from "@/components/news/CommentsSection";
import ShareButtons from "@/components/news/ShareButtons";
import RelatedArticles from "@/components/news/RelatedArticles";
import moment from "moment";
import { apiGet, apiPut, apiAI } from "@/api/client";

const PERSPECTIVES = [
  { key: "neutral", label: "Neutre" },
  { key: "left", label: "Progressiste" },
  { key: "right", label: "Conservateur" },
];

export default function ArticlePage() {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [perspective, setPerspective] = useState("neutral");
  const [generatingPerspectives, setGeneratingPerspectives] = useState(false);
  const [simplifiedContent, setSimplifiedContent] = useState(null);
  const [simplifying, setSimplifying] = useState(false);
  const [isSimple, setIsSimple] = useState(false);
  const [factChecking, setFactChecking] = useState(false);
  const [factChecks, setFactChecks] = useState(null);
  const [showFactChecks, setShowFactChecks] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const data = await apiGet(`/api/articles/${id}`);
      setArticle(data);
      setLoading(false);
    };
    load();
  }, [id]);

  const generatePerspectives = async () => {
    if (article.ai_perspectives?.neutral) return;
    setGeneratingPerspectives(true);
    const res = await apiAI(
      `Voici un article:\nTitre: ${article.title}\nContenu: ${article.content}\n\nRéécris cet article selon 3 perspectives différentes. Chaque version doit garder les mêmes faits mais changer l'angle éditorial:\n1. "neutral": perspective factuelle et neutre\n2. "left": perspective progressiste/gauche\n3. "right": perspective conservatrice/droite\n\nChaque version doit faire 2-3 paragraphes. Réponds en français.`,
      {
        type: "object",
        properties: {
          neutral: { type: "string" },
          left: { type: "string" },
          right: { type: "string" },
        },
      }
    );
    await apiPut(`/api/articles/${id}`, { ai_perspectives: res });
    setArticle((prev) => ({ ...prev, ai_perspectives: res }));
    setGeneratingPerspectives(false);
  };

  const simplifyContent = async () => {
    if (isSimple && simplifiedContent) {
      setIsSimple(false);
      return;
    }
    if (simplifiedContent) {
      setIsSimple(true);
      return;
    }
    setSimplifying(true);
    const res = await apiAI(
      `Simplifie ce texte pour un lecteur de niveau collège (12-14 ans). Garde les informations essentielles mais utilise un vocabulaire simple et des phrases courtes:\n\n${article.content}`,
      {
        type: "object",
        properties: { simplified: { type: "string" } },
      }
    );
    setSimplifiedContent(res.simplified);
    setIsSimple(true);
    setSimplifying(false);
  };

  const runFactCheck = async () => {
    if (factChecks) {
      setShowFactChecks(!showFactChecks);
      return;
    }
    setFactChecking(true);
    setShowFactChecks(true);
    const res = await apiAI(
      `Analyse cet article et identifie les 3 principales affirmations factuelles. Pour chacune, donne un verdict de vérification:\n\nTitre: ${article.title}\nContenu: ${article.content}\n\nPour chaque affirmation, donne: la citation exacte, ton verdict (vérifié/probable/non vérifié/contesté), et un score de confiance entre 0 et 1.`,
      {
        type: "object",
        properties: {
          checks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                claim: { type: "string" },
                verdict: { type: "string" },
                confidence: { type: "number" },
              },
            },
          },
        },
      }
    );
    setFactChecks(res.checks);
    setFactChecking(false);
  };

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

  if (!article) {
    return (
      <>
        <Navbar />
        <div className="text-center py-20">
          <p className="font-heading text-2xl">Article introuvable</p>
          <Link to="/" className="text-primary text-sm mt-4 inline-block">Retour à l'accueil</Link>
        </div>
      </>
    );
  }

  const displayContent = isSimple && simplifiedContent ? simplifiedContent :
    (perspective !== "neutral" && article.ai_perspectives?.[perspective]) ? article.ai_perspectives[perspective] : article.content;

  return (
    <>
      <Navbar />
      <article className="max-w-3xl mx-auto px-6 py-10 md:py-14">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Link>

        <div className="text-xs text-primary mb-4 uppercase tracking-wide">
          {article.category} · {moment(article.created_date).format("D MMMM YYYY")}
        </div>

        <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold leading-tight tracking-tight mb-4" style={{ letterSpacing: "-0.02em" }}>
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="text-lg text-muted-foreground mb-6 leading-relaxed">{article.subtitle}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-8">
          {article.reading_time_min && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.reading_time_min} min de lecture
            </span>
          )}
          {article.ai_sentiment && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted capitalize">
              {article.ai_sentiment}
            </span>
          )}
        </div>

        {article.image_url && (
          <div className="rounded-xl overflow-hidden mb-10 aspect-[16/9]">
            <img src={article.image_url} alt={article.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* AI Tools Bar */}
        <div className="ai-halo rounded-xl p-4 mb-10 flex flex-wrap gap-2">
          <Button
            variant={isSimple ? "default" : "outline"}
            size="sm"
            onClick={simplifyContent}
            disabled={simplifying}
            className="text-xs rounded-full"
          >
            {simplifying ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Sparkles className="w-3 h-3 mr-1.5" />}
            {isSimple ? "Version originale" : "Simplifier"}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={runFactCheck}
            disabled={factChecking}
            className="text-xs rounded-full"
          >
            {factChecking ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : <Shield className="w-3 h-3 mr-1.5" />}
            Fact-Check IA
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={generatePerspectives}
            disabled={generatingPerspectives}
            className="text-xs rounded-full"
          >
            {generatingPerspectives ? <Loader2 className="w-3 h-3 mr-1.5 animate-spin" /> : null}
            Perspectives
          </Button>
        </div>

        {/* Perspective Toggle */}
        {article.ai_perspectives?.neutral && (
          <div className="flex gap-1 mb-8 p-1 bg-muted rounded-lg w-fit">
            {PERSPECTIVES.map((p) => (
              <button
                key={p.key}
                onClick={() => setPerspective(p.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  perspective === p.key ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Fact Checks */}
        {showFactChecks && factChecks && (
          <div className="ai-halo rounded-xl p-5 mb-8 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Vérification IA des faits</span>
            </div>
            {factChecks.map((fc, i) => (
              <div key={i} className="border-l-2 border-primary/30 pl-4 py-1">
                <p className="text-sm italic mb-1">"{fc.claim}"</p>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full ${
                    fc.verdict?.toLowerCase().includes("vérifié") ? "bg-green-100 text-green-700" :
                    fc.verdict?.toLowerCase().includes("contesté") ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {fc.verdict}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Confiance: {Math.round(fc.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Article Content */}
        <div className="prose-article">
          <ReactMarkdown className="prose prose-lg max-w-none">{displayContent}</ReactMarkdown>
        </div>

        {article.tags?.length > 0 && (
          <div className="mt-12">
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => (
                <span key={tag} className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10">
          <ShareButtons article={article} />
        </div>

        <RelatedArticles article={article} />

        <CommentsSection articleId={article.id} />
      </article>
      <Footer />
    </>
  );
}
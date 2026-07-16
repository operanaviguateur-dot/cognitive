import React, { useState, useEffect } from "react";

import { useNavigate } from "react-router-dom";
import { Loader2, Sparkles, Wand2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiAI, getAdminHeaders } from "@/api/client";

const PRIORITIES = ["breaking", "haute", "normale", "basse"];

const VARIATION_STYLES = [
  { key: "viral", label: "Viral", desc: "Accrocheur, émotionnel" },
  { key: "formal", label: "Formel", desc: "Institutionnel, sérieux" },
  { key: "short", label: "Court", desc: "Bref et percutant" },
  { key: "investigative", label: "Enquête", desc: "Approfondi, analytique" },
  { key: "thread", label: "Thread", desc: "Style fil Twitter" },
];

export default function CreateArticle() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [form, setForm] = useState({
    title: "", subtitle: "", content: "", category: "politique", priority: "normale", tags: "",
  });
  const [saving, setSaving] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiVariations, setAiVariations] = useState(null);
  const [generatingVariations, setGeneratingVariations] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [aiEnriching, setAiEnriching] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiGet('/api/categories', { sort: "sort_order", limit: 100 }).then(setCategories).catch(() => {});
  }, []);

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const generateVariations = async () => {
    if (!aiPrompt.trim()) return;
    setGeneratingVariations(true);
    const res = await apiAI(
      `Tu es un rédacteur en chef d'un média de premier plan. À partir de ce sujet/prompt: "${aiPrompt}"\n\nGénère 5 variations d'article complet, chacune dans un style différent:\n1. "viral": Style viral, accrocheur, émotionnel\n2. "formal": Style formel, institutionnel, sérieux\n3. "short": Version courte et percutante (3 paragraphes max)\n4. "investigative": Style enquête approfondie avec données et analyse\n5. "thread": Style fil Twitter avec des points numérotés\n\nChaque variation doit inclure un titre et le contenu complet. Réponds en français.`,
      {
        type: "object",
        properties: {
          variations: {
            type: "array",
            items: {
              type: "object",
              properties: {
                style: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
              },
            },
          },
        },
      }
    );
    setAiVariations(res.variations);
    setGeneratingVariations(false);
  };

  const selectVariation = (v) => {
    setForm((prev) => ({ ...prev, title: v.title, content: v.content }));
    toast({ title: "Variation appliquée", description: `Style "${v.style}" sélectionné` });
  };

  const enrichWithAI = async () => {
    if (!form.content) return;
    setAiEnriching(true);
    const res = await apiAI(
      `Analyse cet article et génère:\n- Un résumé en 2 phrases\n- Le sentiment (positif/negatif/neutre)\n- Un score de confiance (0 à 1)\n- Le temps de lecture estimé en minutes\n- 5 tags pertinents\n- Une sous-titre accrocheur\n\nTitre: ${form.title}\nContenu: ${form.content}`,
      {
        type: "object",
        properties: {
          summary: { type: "string" },
          sentiment: { type: "string" },
          confidence_score: { type: "number" },
          reading_time: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
          subtitle: { type: "string" },
        },
      }
    );
    setForm((prev) => ({
      ...prev,
      subtitle: prev.subtitle || res.subtitle,
      tags: res.tags?.join(", ") || prev.tags,
    }));
    setAiEnriching(false);
    toast({ title: "Article enrichi par l'IA" });
    return res;
  };

  const handlePublish = async (status) => {
    setSaving(true);
    let enrichment = {};
    if (form.content) {
      const res = await apiAI(
        `Analyse cet article et génère un résumé, sentiment, score de confiance et temps de lecture.\nTitre: ${form.title}\nContenu: ${form.content}`,
        {
          type: "object",
          properties: {
            summary: { type: "string" },
            sentiment: { type: "string", enum: ["positif", "negatif", "neutre"] },
            confidence_score: { type: "number" },
            reading_time: { type: "number" },
          },
        }
      );
      enrichment = {
        summary: res.summary,
        ai_sentiment: res.sentiment,
        ai_confidence_score: res.confidence_score,
        reading_time_min: res.reading_time,
      };
    }

    await apiPost('/api/articles', {
      title: form.title,
      subtitle: form.subtitle,
      content: form.content,
      category: form.category,
      priority: form.priority,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
      image_url: imageUrl,
      status,
      ...enrichment,
    }, { headers: getAdminHeaders() });

    toast({ title: status === "publie" ? "Article publié !" : "Brouillon sauvegardé" });
    navigate("/admin/articles");
    setSaving(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Nouvel Article</h1>
        <p className="text-muted-foreground text-sm mt-1">Créez avec l'assistance de l'IA</p>
      </div>

      {/* AI Content Crucible */}
      <div className="ai-halo rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="font-mono-upper text-xs font-semibold">Le Creuset IA — Générez 5 variations</span>
        </div>

        <div className="flex gap-3">
          <Input
            placeholder="Décrivez votre sujet : ex. 'L'impact de l'IA sur l'emploi en France en 2026'"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            className="flex-1 bg-background/50"
          />
          <Button onClick={generateVariations} disabled={generatingVariations || !aiPrompt.trim()}>
            {generatingVariations ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Wand2 className="w-4 h-4 mr-1" />}
            Générer
          </Button>
        </div>

        {generatingVariations && (
          <div className="flex items-center gap-2 mt-4 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Le Creuset forge 5 variations...
          </div>
        )}

        {aiVariations && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
            {aiVariations.map((v, i) => {
              const style = VARIATION_STYLES.find((s) => s.key === v.style) || VARIATION_STYLES[i];
              return (
                <button
                  key={i}
                  onClick={() => selectVariation(v)}
                  className="text-left p-4 rounded-lg border border-border bg-background/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                >
                  <div className="font-mono-upper text-xs text-primary mb-1">{style?.label || v.style}</div>
                  <p className="text-xs text-muted-foreground mb-2">{style?.desc}</p>
                  <p className="text-sm font-medium line-clamp-2">{v.title}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div>
            <Label className="font-mono-upper text-xs">Titre</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Titre de l'article" className="mt-1.5 text-lg font-heading" />
          </div>
          <div>
            <Label className="font-mono-upper text-xs">Sous-titre</Label>
            <Input value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} placeholder="Sous-titre accrocheur" className="mt-1.5" />
          </div>
          <div>
            <Label className="font-mono-upper text-xs">Contenu</Label>
            <Textarea
              value={form.content}
              onChange={(e) => update("content", e.target.value)}
              placeholder="Rédigez votre article ici... (Markdown supporté)"
              className="mt-1.5 min-h-[300px] font-body"
            />
          </div>
          <div>
            <Label className="font-mono-upper text-xs">Tags (séparés par des virgules)</Label>
            <Input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="IA, France, emploi" className="mt-1.5" />
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <Label className="font-mono-upper text-xs">Catégorie</Label>
            <Select value={form.category} onValueChange={(v) => update("category", v)}>
              <SelectTrigger className="mt-1.5 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c.id} value={c.slug} className="capitalize">{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-mono-upper text-xs">Priorité</Label>
            <Select value={form.priority} onValueChange={(v) => update("priority", v)}>
              <SelectTrigger className="mt-1.5 capitalize"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="font-mono-upper text-xs">Image URL</Label>
            <Input 
              value={imageUrl} 
              onChange={(e) => setImageUrl(e.target.value)} 
              placeholder="https://example.com/image.jpg"
              className="mt-1.5"
            />
            {imageUrl && (
              <div className="mt-2 rounded-xl overflow-hidden relative group">
                <img src={imageUrl} alt="Article" className="w-full aspect-video object-cover" />
              </div>
            )}
          </div>

          <Button variant="outline" onClick={enrichWithAI} disabled={aiEnriching || !form.content} className="w-full">
            {aiEnriching ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            Enrichir avec l'IA
          </Button>

          <div className="confidence-line" />

          <div className="space-y-2">
            <Button onClick={() => handlePublish("publie")} disabled={saving || !form.title || !form.content} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}
              Publier
            </Button>
            <Button variant="outline" onClick={() => handlePublish("brouillon")} disabled={saving || !form.title} className="w-full">
              Sauvegarder en brouillon
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
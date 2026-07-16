import React, { useState, useEffect } from "react";

import { Link } from "react-router-dom";
import { Loader2, Trash2, Eye, Archive, Send, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { apiGet, apiPut, apiDelete, getAdminHeaders } from "@/api/client";

export default function ManageArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const query = filter !== "all" ? { status: filter } : {};
    const data = await apiGet('/api/articles', { ...query, sort: "-created_date", limit: 100 });
    setArticles(data);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    await apiPut(`/api/articles/${id}`, { status }, { headers: getAdminHeaders() });
    toast({ title: `Article ${status === "publie" ? "publié" : status === "archive" ? "archivé" : "en brouillon"}` });
    load();
  };

  const deleteArticle = async (id) => {
    if (!confirm("Voulez-vous vraiment supprimer cet article ?")) return;
    await apiDelete(`/api/articles/${id}`, { headers: getAdminHeaders() });
    toast({ title: "Article supprimé" });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">Articles</h1>
          <p className="text-muted-foreground text-sm mt-1">{articles.length} article(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="publie">Publiés</SelectItem>
              <SelectItem value="brouillon">Brouillons</SelectItem>
              <SelectItem value="archive">Archivés</SelectItem>
            </SelectContent>
          </Select>
          <Link to="/admin/create">
            <Button size="sm" className="font-mono-upper text-xs">
              <PenSquare className="w-3.5 h-3.5 mr-1" /> Nouveau
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : articles.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <p className="font-heading text-lg mb-2">Aucun article trouvé</p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <div key={article.id} className="flex items-center gap-4 p-4 border border-border rounded-xl bg-card hover:bg-card/80 transition-colors">
              {article.image_url && (
                <img src={article.image_url} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-mono-upper text-xs px-2 py-0.5 rounded-full ${
                    article.status === "publie" ? "bg-green-500/10 text-green-400" :
                    article.status === "archive" ? "bg-muted text-muted-foreground" :
                    "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {article.status}
                  </span>
                  <span className="font-mono-upper text-xs text-muted-foreground capitalize">{article.category}</span>
                  {article.priority === "breaking" && (
                    <span className="font-mono-upper text-xs text-red-400">BREAKING</span>
                  )}
                </div>
                <h3 className="font-heading font-semibold truncate">{article.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{moment(article.created_date).format("D MMM YYYY, HH:mm")}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link to={`/article/${article.id}`}>
                  <Button variant="ghost" size="icon" className="h-8 w-8"><Eye className="w-3.5 h-3.5" /></Button>
                </Link>
                {article.status !== "publie" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(article.id, "publie")}>
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                )}
                {article.status === "publie" && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => updateStatus(article.id, "archive")}>
                    <Archive className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteArticle(article.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
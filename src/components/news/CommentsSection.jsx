import React, { useState } from "react";

import { Loader2, Send, MessageCircle, Sparkles, ThumbsUp, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import moment from "moment";
import { apiGet, apiPost, apiPut, apiAI } from "@/api/client";

export default function CommentsSection({ articleId }) {
  const [comments, setComments] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadComments = async () => {
    setLoading(true);
    const data = await apiGet('/api/comments', { article_id: articleId, sort: "-created_date", limit: 100 });
    setComments(data);
    setLoading(false);
  };

  React.useEffect(() => {
    loadComments();
  }, [articleId]);

  const submit = async () => {
    if (!authorName.trim() || !content.trim()) return;
    setSubmitting(true);
    // Analyze sentiment with AI
    let sentiment = null;
    try {
      const res = await apiAI(
        `Analyse le sentiment de ce commentaire et réponds avec "positif", "negatif", ou "neutre". Ne réponds qu'avec un seul mot.\n\n"${content}"`,
        {
          type: "object",
          properties: {
            sentiment: { type: "string", enum: ["positif", "negatif", "neutre"] },
          },
        }
      );
      sentiment = res.sentiment;
    } catch (e) {
      // sentiment analysis is optional
    }

    await apiPost('/api/comments', {
      article_id: articleId,
      author_name: authorName.trim(),
      content: content.trim(),
      ai_sentiment: sentiment,
    });

    setContent("");
    setSubmitting(false);
    toast({ title: "Commentaire publié" });
    loadComments();
  };

  const likeComment = (id) => {
    // Visual feedback only
    toast({ title: "Merci pour votre retour !" });
  };

  const flagComment = async (comment) => {
    await apiPut(`/api/comments/${comment.id}`, { is_flagged: true });
    toast({ title: "Commentaire signalé", description: "Un modérateur va l'examiner." });
    loadComments();
  };

  const sentimentColor = (s) =>
    s === "positif" ? "bg-green-500/10 text-green-600" :
    s === "negatif" ? "bg-red-500/10 text-red-600" :
    "bg-muted text-muted-foreground";

  return (
    <div className="mt-12">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-4 h-4 text-primary" />
        <h3 className="font-heading text-xl font-semibold">Discussion</h3>
        {comments && comments.length > 0 && (
          <span className="text-xs text-muted-foreground ml-1">
            {comments.length} commentaire{comments.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* New Comment Form */}
      <div className="ai-halo rounded-xl p-5 mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-primary">L'IA analyse le sentiment de chaque commentaire</span>
        </div>
        <Input
          placeholder="Votre nom"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="mb-3 bg-background/50"
        />
        <Textarea
          placeholder="Partagez votre avis sur cet article..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-3 min-h-[100px] bg-background/50"
        />
        <Button
          onClick={submit}
          disabled={submitting || !authorName.trim() || !content.trim()}
          className="text-xs rounded-full"
        >
          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : <Send className="w-3.5 h-3.5 mr-1.5" />}
          Publier
        </Button>
      </div>

      {/* Comments List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : !comments || comments.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          <MessageCircle className="w-8 h-8 mx-auto mb-3 opacity-40" />
          <p className="text-sm">Soyez le premier à commenter cet article.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {comments.map((comment) => (
            <div key={comment.id} className="border border-border rounded-xl p-5 bg-card">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs text-primary font-medium">
                      {comment.author_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-sm">{comment.author_name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {moment(comment.created_date).fromNow()}
                </span>
              </div>

              {comment.ai_sentiment && (
                <span className={`inline-block text-xs px-2.5 py-1 rounded-full mb-3 ${sentimentColor(comment.ai_sentiment)}`}>
                  {comment.ai_sentiment}
                </span>
              )}

              <p className="text-sm leading-relaxed mb-3">{comment.content}</p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => likeComment(comment.id)}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  J'aime
                </button>
                {!comment.is_flagged && (
                  <button
                    onClick={() => flagComment(comment)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Flag className="w-3.5 h-3.5" />
                    Signaler
                  </button>
                )}
                {comment.is_flagged && (
                  <span className="text-xs text-destructive">Signalé</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
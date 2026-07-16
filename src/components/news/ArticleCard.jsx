import React from "react";
import { Link } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import moment from "moment";

export default function ArticleCard({ article, variant = "default" }) {
  const isCompact = variant === "compact";

  return (
    <Link to={`/article/${article.id}`} className="group block">
      <div className={`${isCompact ? "flex gap-4" : ""}`}>
        <div className={`relative overflow-hidden rounded-lg ${isCompact ? "w-20 h-20 flex-shrink-0" : "aspect-[3/2] mb-4"}`}>
          {article.image_url ? (
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <span className="text-muted-foreground text-xs">CC</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground mb-1.5 uppercase tracking-wide">
            {article.category} · {moment(article.created_date).fromNow()}
          </div>

          <h3 className={`font-heading font-semibold leading-snug tracking-tight group-hover:text-primary transition-colors ${isCompact ? "text-sm line-clamp-2" : "text-lg line-clamp-3"}`} style={{ letterSpacing: "-0.01em" }}>
            {article.title}
          </h3>

          {!isCompact && article.summary && (
            <p className="text-muted-foreground text-sm mt-2 line-clamp-2 leading-relaxed">
              {article.summary}
            </p>
          )}

          {!isCompact && (
            <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
              {article.priority === "breaking" && (
                <span className="inline-flex items-center gap-1 text-primary font-medium">
                  <TrendingUp className="w-3 h-3" />
                  Breaking
                </span>
              )}
              {article.reading_time_min && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.reading_time_min} min
                </span>
              )}
              {article.ai_confidence_score != null && (
                <span className="text-xs text-muted-foreground">
                  IA · {Math.round(article.ai_confidence_score * 100)}%
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
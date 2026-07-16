import React from "react";
import { Link } from "react-router-dom";
import { Clock, TrendingUp } from "lucide-react";
import moment from "moment";

export default function HeroArticle({ article }) {
  if (!article) return null;

  return (
    <Link to={`/article/${article.id}`} className="block group">
      <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden">
        <img
          src={article.image_url}
          alt={article.title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          {article.priority === "breaking" && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium mb-4">
              <TrendingUp className="w-3 h-3" />
              BREAKING
            </div>
          )}
          
          <div className="text-xs text-white/60 mb-3 uppercase tracking-wide">
            {article.category} · {moment(article.created_date).fromNow()}
          </div>
          
          <h1 className="font-heading text-2xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight max-w-3xl" style={{ letterSpacing: "-0.02em" }}>
            {article.title}
          </h1>
          
          {article.subtitle && (
            <p className="text-white/70 text-base md:text-lg mt-3 max-w-2xl font-light leading-relaxed">
              {article.subtitle}
            </p>
          )}
          
          <div className="flex items-center gap-4 mt-4 text-white/50 text-sm">
            {article.reading_time_min && (
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.reading_time_min} min
              </span>
            )}
            {article.ai_sentiment && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 capitalize">
                {article.ai_sentiment}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
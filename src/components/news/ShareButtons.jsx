import React from "react";
import { Linkedin, Twitter, Share2, Link as LinkIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export default function ShareButtons({ article }) {
  const [copied, setCopied] = React.useState(false);
  const { toast } = useToast();

  const articleUrl = `${window.location.origin}/article/${article.id}`;
  const shareTitle = encodeURIComponent(article.title);
  const shareUrl = encodeURIComponent(articleUrl);

  const shareLinkedIn = () => {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      "_blank",
      "width=600,height=600"
    );
  };

  const shareTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${shareTitle}&url=${shareUrl}`,
      "_blank",
      "width=600,height=600"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(articleUrl);
    setCopied(true);
    toast({ title: "Lien copié dans le presse-papier" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <Share2 className="w-4 h-4 text-muted-foreground" />
        <span className="font-mono-upper text-xs text-muted-foreground">Partager</span>
      </div>
      <div className="confidence-line flex-1 min-w-[20px]" />
      <Button
        variant="outline"
        size="sm"
        onClick={shareTwitter}
        className="font-mono-upper text-xs"
      >
        <Twitter className="w-3.5 h-3.5 mr-1.5" />
        Twitter
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={shareLinkedIn}
        className="font-mono-upper text-xs"
      >
        <Linkedin className="w-3.5 h-3.5 mr-1.5" />
        LinkedIn
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={copyLink}
        className="font-mono-upper text-xs"
      >
        {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-green-500" /> : <LinkIcon className="w-3.5 h-3.5 mr-1.5" />}
        {copied ? "Copié" : "Copier le lien"}
      </Button>
    </div>
  );
}
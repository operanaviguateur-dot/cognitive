import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Search, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiGet } from "@/api/client";

import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiGet('/api/categories', { sort: "sort_order", limit: 20 })
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center">
            <span className="font-heading text-lg font-semibold tracking-tight">
              Cognitive Chronicle
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" />
              Accueil
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={`/?cat=${c.slug}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {c.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <button
              className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>

            <button
              className="md:hidden p-2 text-muted-foreground"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form onSubmit={handleSearch} className="pb-4 flex gap-2">
            <Input
              autoFocus
              placeholder="Rechercher un article..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 rounded-full"
            />
            <Button type="submit" size="sm" className="rounded-full">
              <Search className="w-4 h-4" />
            </Button>
          </form>
        )}
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          <Link
            to="/"
            className="block text-sm text-muted-foreground"
            onClick={() => setMobileOpen(false)}
          >
            Accueil
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/?cat=${c.slug}`}
              className="block text-sm text-muted-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
import React, { useState, useEffect } from "react";

import { Plus, Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { apiGet, apiPost, apiPut, apiDelete, getAdminHeaders } from "@/api/client";

const slugify = (str) =>
  str
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function AdminSettings() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    const data = await apiGet('/api/categories', { sort: "sort_order", limit: 100 });
    setCategories(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addCategory = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setAdding(true);
    try {
      await apiPost('/api/categories', {
        name: newName.trim(),
        slug: slugify(newName),
        sort_order: categories.length,
      }, { headers: getAdminHeaders() });
      setNewName("");
      toast({ title: "Catégorie ajoutée" });
      load();
    } catch {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter la catégorie",
        variant: "destructive",
      });
    }
    setAdding(false);
  };

  const startEdit = (c) => {
    setEditId(c.id);
    setEditName(c.name);
  };

  const cancelEdit = () => {
    setEditId(null);
    setEditName("");
  };

  const saveEdit = async (c) => {
    if (!editName.trim()) return;
    await apiPut(`/api/categories/${c.id}`, {
      name: editName.trim(),
      slug: slugify(editName),
    }, { headers: getAdminHeaders() });
    toast({ title: "Catégorie modifiée" });
    cancelEdit();
    load();
  };

  const deleteCategory = async (c) => {
    if (!confirm(`Supprimer la catégorie « ${c.name} » ?`)) return;
    await apiDelete(`/api/categories/${c.id}`, { headers: getAdminHeaders() });
    toast({ title: "Catégorie supprimée" });
    load();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Paramètres</h1>
        <p className="text-muted-foreground text-sm mt-1">Gérez vos catégories</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-mono-upper text-xs font-semibold mb-4">Ajouter une catégorie</h2>
        <form onSubmit={addCategory} className="flex gap-3">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom de la catégorie (ex. Sport)"
            className="flex-1"
          />
          <Button type="submit" disabled={adding || !newName.trim()}>
            {adding ? (
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
            ) : (
              <Plus className="w-4 h-4 mr-1" />
            )}
            Ajouter
          </Button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-mono-upper text-xs font-semibold mb-4">Catégories existantes</h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">
            Aucune catégorie. Ajoutez-en une ci-dessus.
          </p>
        ) : (
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-background/50"
              >
                {editId === c.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => saveEdit(c)}
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={cancelEdit}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{c.name}</span>
                    <span className="font-mono text-xs text-muted-foreground">
                      /{c.slug}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => startEdit(c)}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive"
                      onClick={() => deleteCategory(c)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
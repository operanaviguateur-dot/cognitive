import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/news/Navbar";
import AdminLayout from "@/components/admin/AdminLayout";

const ADMIN_CODE = "u1Rd49dgU4";
const STORAGE_KEY = "chronicle_admin_access";
const CODE_KEY = "chronicle_admin_code"; // read by getAdminHeaders() in client.js

export default function AdminGate() {
  const [checking, setChecking] = useState(true);
  const [granted, setGranted] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setGranted(sessionStorage.getItem(STORAGE_KEY) === "true");
    setChecking(false);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (code.trim() === ADMIN_CODE) {
      sessionStorage.setItem(STORAGE_KEY, "true");
      sessionStorage.setItem(CODE_KEY, code.trim()); // needed for X-Admin-Code header
      setGranted(true);
      setError("");
    } else {
      setError("Code incorrect. Accès refusé.");
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!granted) {
    return (
      <>
        <Navbar />
        <div className="min-h-[80vh] flex items-center justify-center px-6">
          <div className="w-full max-w-sm">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-14 h-14 rounded-full border border-border flex items-center justify-center mb-5">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              <h1 className="font-heading text-2xl font-semibold tracking-tight">
                Espace réservé
              </h1>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                Cette zone est privée. Saisissez le code d'accès pour continuer.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="password"
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Code d'accès"
                className="text-center tracking-widest"
              />
              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
              <Button type="submit" className="w-full rounded-full">
                Déverrouiller
              </Button>
            </form>
          </div>
        </div>
      </>
    );
  }

  return <AdminLayout />;
}
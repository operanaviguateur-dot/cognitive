import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, PenSquare, FileText, TrendingUp, Zap, ArrowLeft, Settings } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: PenSquare, label: "Nouvel Article", path: "/admin/create" },
  { icon: FileText, label: "Articles", path: "/admin/articles" },
  { icon: TrendingUp, label: "Tendances IA", path: "/admin/trends" },
  { icon: Settings, label: "Paramètres", path: "/admin/settings" },
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      <div className="p-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-sidebar-primary" />
          <span className="font-heading text-lg font-bold text-sidebar-foreground">Command Center</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-2">
        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour au site
        </Link>
        <div className="px-3 text-sidebar-foreground">
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
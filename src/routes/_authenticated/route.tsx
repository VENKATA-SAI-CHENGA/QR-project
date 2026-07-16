import { createFileRoute, Outlet, redirect, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { QrCode, LayoutDashboard, Plus, User as UserIcon, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const path = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/qr/new", label: "New QR", icon: Plus },
    { to: "/profile", label: "Profile", icon: UserIcon },
  ] as const;

  return (
    <div className="min-h-screen flex">
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar hidden md:flex flex-col">
        <Link to="/dashboard" className="flex items-center gap-2 p-6">
          <div className="w-9 h-9 rounded-lg btn-neon flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">QRFlux</span>
        </Link>
        <nav className="flex-1 px-3 space-y-1">
          {nav.map((n) => {
            const active = path === n.to || (n.to === "/dashboard" && path.startsWith("/qr/"));
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <n.icon className="w-4 h-4" /> {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3">
          <Button variant="ghost" className="w-full justify-start" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign out
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden border-b border-border p-4 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg btn-neon flex items-center justify-center">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="font-display font-bold">QRFlux</span>
          </Link>
          <div className="flex gap-1">
            <Link to="/qr/new"><Button size="sm" variant="ghost"><Plus className="w-4 h-4" /></Button></Link>
            <Link to="/profile"><Button size="sm" variant="ghost"><UserIcon className="w-4 h-4" /></Button></Link>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="w-4 h-4" /></Button>
          </div>
        </header>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
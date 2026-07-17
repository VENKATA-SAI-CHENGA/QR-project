import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, QrCode as QrIcon, ExternalLink, MousePointerClick, Zap, TrendingUp } from "lucide-react";
import { useState } from "react";
import { QR_TYPES, type QRType } from "@/lib/qr-types";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — QRFlux" }] }),
  component: Dashboard,
});

function Dashboard() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused" | QRType>("all");

  const { data: qrs = [], isLoading } = useQuery({
    queryKey: ["qr_codes"],
    queryFn: async () => {
      const {
  data: { user },
} = await supabase.auth.getUser();

if (!user) throw new Error("Not authenticated");

const { data, error } = await supabase
  .from("qr_codes")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error) throw error;

return data;
    },
  });

  const filtered = qrs.filter((q) => {
    if (search && !q.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "active" && !q.is_active) return false;
    if (filter === "paused" && q.is_active) return false;
    if (filter !== "all" && filter !== "active" && filter !== "paused" && q.type !== filter) return false;
    return true;
  });

  const totalScans = qrs.reduce((s, q) => s + (q.scan_count || 0), 0);
  const activeCount = qrs.filter((q) => q.is_active).length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage all your QR codes in one place</p>
        </div>
        <Link to="/qr/new">
          <Button className="btn-neon btn-neon-hover"><Plus className="w-4 h-4 mr-2" /> Create QR</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard icon={QrIcon} label="Total QR codes" value={qrs.length} />
        <StatCard icon={Zap} label="Active" value={activeCount} accent />
        <StatCard icon={TrendingUp} label="Total scans" value={totalScans} />
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filter} onValueChange={(v) => setFilter(v as never)}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="active">Active only</SelectItem>
            <SelectItem value="paused">Paused only</SelectItem>
            {QR_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-muted-foreground">Loading…</div>
      ) : filtered.length === 0 ? (
        <Card className="glass p-12 text-center">
          <QrIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg mb-1">{qrs.length === 0 ? "No QR codes yet" : "No matches"}</h3>
          <p className="text-muted-foreground mb-4">
            {qrs.length === 0 ? "Create your first dynamic QR code to get started." : "Try a different search or filter."}
          </p>
          {qrs.length === 0 && (
            <Link to="/qr/new"><Button className="btn-neon btn-neon-hover"><Plus className="w-4 h-4 mr-2" />Create QR</Button></Link>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((q) => {
            const typeLabel = QR_TYPES.find((t) => t.value === q.type)?.label ?? q.type;
            return (
              <Link key={q.id} to="/qr/$id" params={{ id: q.id }}>
                <Card className="glass p-5 h-full hover:border-primary/50 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{q.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeLabel}</p>
                    </div>
                    <Badge variant={q.is_active ? "default" : "secondary"} className={q.is_active ? "bg-primary/20 text-primary border-primary/30" : ""}>
                      {q.is_active ? "Active" : "Paused"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><MousePointerClick className="w-3.5 h-3.5" /> {q.scan_count} scans</span>
                    {q.is_dynamic && <span className="flex items-center gap-1"><ExternalLink className="w-3.5 h-3.5" />/r/{q.slug}</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof Plus; label: string; value: number; accent?: boolean }) {
  return (
    <Card className="glass p-5">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent ? "btn-neon" : "bg-secondary"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <div className="text-2xl font-bold">{value.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </Card>
  );
}
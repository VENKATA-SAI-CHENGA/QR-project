import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QRTypeFields } from "@/components/qr-form";
import { QRPreview, downloadQR } from "@/components/qr-preview";
import { buildStaticPayload, type QRType, QR_TYPES } from "@/lib/qr-types";
import { toast } from "sonner";
import { ArrowLeft, Download, Trash2, Loader2, Copy } from "lucide-react";
import { format, subDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export const Route = createFileRoute("/_authenticated/qr/$id")({
  head: () => ({ meta: [{ title: "QR code — QRFlux" }] }),
  component: QRDetail,
});

function QRDetail() {
  const { id } = useParams({ from: "/_authenticated/qr/$id" });
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: qr, isLoading } = useQuery({
    queryKey: ["qr_codes", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("qr_codes").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  const [name, setName] = useState("");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [targetUrl, setTargetUrl] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [fg, setFg] = useState("#0A0A0F");
  const [bg, setBg] = useState("#FFFFFF");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!qr) return;
    setName(qr.name);
    setContent((qr.content as Record<string, unknown>) || {});
    setTargetUrl(qr.target_url || "");
    setIsDynamic(qr.is_dynamic);
    setIsActive(qr.is_active);
    setFg(qr.fg_color);
    setBg(qr.bg_color);
  }, [qr]);

  const previewValue = useMemo(() => {
    if (!qr) return "";
    if (isDynamic && ["url", "multilink", "vcard"].includes(qr.type)) {
      return `${typeof window !== "undefined" ? window.location.origin : ""}/r/${qr.slug}`;
    }
    return buildStaticPayload(qr.type as QRType, content, targetUrl);
  }, [qr, content, targetUrl, isDynamic]);

  async function save() {
    if (!qr) return;
    setSaving(true);
    const { error } = await supabase
      .from("qr_codes")
      .update({ name, content: content as never, target_url: targetUrl || null, is_dynamic: isDynamic, is_active: isActive, fg_color: fg, bg_color: bg })
      .eq("id", qr.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["qr_codes"] });
  }

  async function remove() {
    if (!qr || !confirm("Delete this QR code? Analytics will be lost.")) return;
    const { error } = await supabase.from("qr_codes").delete().eq("id", qr.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["qr_codes"] });
    navigate({ to: "/dashboard" });
  }

  function copyLink() {
    if (!qr) return;
    navigator.clipboard.writeText(`${window.location.origin}/r/${qr.slug}`);
    toast.success("Link copied");
  }

  if (isLoading || !qr) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mb-4"><ArrowLeft className="w-4 h-4" /> Back</Link>
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">{qr.name}</h1>
          <p className="text-muted-foreground text-sm">{QR_TYPES.find((t) => t.value === qr.type)?.label} · {qr.scan_count} scans</p>
        </div>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={remove}><Trash2 className="w-4 h-4 mr-2" />Delete</Button>
          <Button className="btn-neon btn-neon-hover" size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save changes"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="edit">
        <TabsList>
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="download">Download</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="space-y-6">
              <Card className="glass p-6 space-y-4">
                <div>
                  <Label className="mb-1.5 block text-sm">Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/40">
                  <div>
                    <Label>Active</Label>
                    <p className="text-xs text-muted-foreground">Paused QRs stop redirecting</p>
                  </div>
                  <Switch checked={isActive} onCheckedChange={setIsActive} />
                </div>
                {qr.is_dynamic && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Short link:</span>
                    <code className="px-2 py-1 rounded bg-secondary">{typeof window !== "undefined" ? window.location.origin : ""}/r/{qr.slug}</code>
                    <Button variant="ghost" size="icon" onClick={copyLink}><Copy className="w-4 h-4" /></Button>
                  </div>
                )}
              </Card>

              <Card className="glass p-6">
                <h2 className="font-semibold mb-4">Content</h2>
                <QRTypeFields
                  type={qr.type as QRType}
                  content={content}
                  targetUrl={targetUrl}
                  isDynamic={isDynamic}
                  onContent={setContent}
                  onTarget={setTargetUrl}
                  onDynamic={setIsDynamic}
                />
              </Card>

              <Card className="glass p-6">
                <h2 className="font-semibold mb-4">Customization</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-1.5 block text-sm">Foreground</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={fg} onChange={(e) => setFg(e.target.value)} className="w-12 h-10 rounded border border-border bg-transparent" />
                      <Input value={fg} onChange={(e) => setFg(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <Label className="mb-1.5 block text-sm">Background</Label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-12 h-10 rounded border border-border bg-transparent" />
                      <Input value={bg} onChange={(e) => setBg(e.target.value)} />
                    </div>
                  </div>
                </div>
              </Card>
            </div>
            <div className="lg:sticky lg:top-6 self-start">
              <Card className="glass p-6 text-center">
                <h2 className="font-semibold mb-4">Preview</h2>
                {previewValue && <QRPreview value={previewValue} fg={fg} bg={bg} size={220} />}
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AnalyticsPanel qrId={qr.id} totalScans={qr.scan_count} />
        </TabsContent>

        <TabsContent value="download" className="mt-6">
          <Card className="glass p-8 text-center max-w-md mx-auto">
            {previewValue && <QRPreview value={previewValue} fg={fg} bg={bg} size={260} />}
            <div className="flex gap-2 justify-center mt-6">
              <Button variant="outline" onClick={() => downloadQR(previewValue, fg, bg, qr.name || "qrcode", "png")}>
                <Download className="w-4 h-4 mr-2" /> PNG
              </Button>
              <Button variant="outline" onClick={() => downloadQR(previewValue, fg, bg, qr.name || "qrcode", "svg")}>
                <Download className="w-4 h-4 mr-2" /> SVG
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AnalyticsPanel({ qrId, totalScans }: { qrId: string; totalScans: number }) {
  const { data: scans = [] } = useQuery({
    queryKey: ["qr_scans", qrId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("qr_scans")
        .select("scanned_at, user_agent, referer")
        .eq("qr_code_id", qrId)
        .gte("scanned_at", subDays(new Date(), 30).toISOString())
        .order("scanned_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data;
    },
  });

  const chartData = useMemo(() => {
    const days = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), 29 - i), "yyyy-MM-dd"));
    const counts = new Map<string, number>(days.map((d) => [d, 0]));
    scans.forEach((s) => {
      const d = format(new Date(s.scanned_at), "yyyy-MM-dd");
      counts.set(d, (counts.get(d) ?? 0) + 1);
    });
    return days.map((d) => ({ date: format(new Date(d), "MMM d"), scans: counts.get(d) ?? 0 }));
  }, [scans]);

  const last7 = scans.filter((s) => new Date(s.scanned_at) > subDays(new Date(), 7)).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass p-5"><div className="text-2xl font-bold">{totalScans}</div><div className="text-xs text-muted-foreground">Total scans</div></Card>
        <Card className="glass p-5"><div className="text-2xl font-bold">{last7}</div><div className="text-xs text-muted-foreground">Last 7 days</div></Card>
        <Card className="glass p-5"><div className="text-2xl font-bold">{scans.length}</div><div className="text-xs text-muted-foreground">Last 30 days</div></Card>
      </div>
      <Card className="glass p-6">
        <h3 className="font-semibold mb-4">Scans over time (30 days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="oklch(1 0 0 / 0.08)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="oklch(0.72 0.03 275)" fontSize={11} />
              <YAxis stroke="oklch(0.72 0.03 275)" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "oklch(0.17 0.025 275)", border: "1px solid oklch(1 0 0 / 0.1)", borderRadius: 8 }} />
              <Line type="monotone" dataKey="scans" stroke="oklch(0.65 0.24 295)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
      <Card className="glass p-6">
        <h3 className="font-semibold mb-4">Recent scans</h3>
        {scans.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No scans yet. Share your QR code to start collecting data.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-auto">
            {scans.slice(0, 50).map((s, i) => (
              <div key={i} className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span className="text-muted-foreground truncate">{s.user_agent?.slice(0, 60) || "Unknown device"}</span>
                <span className="text-xs text-muted-foreground shrink-0 ml-2">{format(new Date(s.scanned_at), "MMM d, HH:mm")}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
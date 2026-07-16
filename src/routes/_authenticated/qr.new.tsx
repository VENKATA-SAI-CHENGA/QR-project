import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { nanoid } from "nanoid";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QR_TYPES, type QRType, buildStaticPayload } from "@/lib/qr-types";
import { QRTypeFields } from "@/components/qr-form";
import { QRPreview } from "@/components/qr-preview";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/qr/new")({
  head: () => ({ meta: [{ title: "Create QR — QRFlux" }] }),
  component: NewQR,
});

function NewQR() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [type, setType] = useState<QRType>("url");
  const [content, setContent] = useState<Record<string, unknown>>({});
  const [targetUrl, setTargetUrl] = useState("");
  const [isDynamic, setIsDynamic] = useState(true);
  const [fgColor, setFg] = useState("#0A0A0F");
  const [bgColor, setBg] = useState("#FFFFFF");
  const [saving, setSaving] = useState(false);

  const slug = useSlug();
  const previewValue =
    isDynamic && ["url", "multilink", "vcard"].includes(type)
      ? `${typeof window !== "undefined" ? window.location.origin : ""}/r/${slug}`
      : buildStaticPayload(type, content, targetUrl);

  async function save() {
    if (!name.trim()) return toast.error("Give your QR a name");
    setSaving(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return toast.error("Not signed in");
    const dynamic = isDynamic && ["url", "multilink", "vcard"].includes(type);
    const { data, error } = await supabase.from("qr_codes").insert({
      user_id: userRes.user.id,
      slug,
      name,
      type,
      is_dynamic: dynamic,
      target_url: targetUrl || null,
      content: content as never,
      fg_color: fgColor,
      bg_color: bgColor,
    }).select().single();
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("QR code created");
    navigate({ to: "/qr/$id", params: { id: data.id } });
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Create QR Code</h1>
      <p className="text-muted-foreground mb-8">Choose a type, customize, and share.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          <Card className="glass p-6 space-y-4">
            <div>
              <Label className="mb-1.5 block text-sm">Name</Label>
              <Input placeholder="Product landing Q4" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label className="mb-1.5 block text-sm">Type</Label>
              <Select value={type} onValueChange={(v) => { setType(v as QRType); setContent({}); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {QR_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <div>
                        <div className="font-medium">{t.label}</div>
                        <div className="text-xs text-muted-foreground">{t.desc}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </Card>

          <Card className="glass p-6">
            <h2 className="font-semibold mb-4">Content</h2>
            <QRTypeFields
              type={type}
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
                  <input type="color" value={fgColor} onChange={(e) => setFg(e.target.value)} className="w-12 h-10 rounded border border-border bg-transparent" />
                  <Input value={fgColor} onChange={(e) => setFg(e.target.value)} />
                </div>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm">Background</Label>
                <div className="flex items-center gap-2">
                  <input type="color" value={bgColor} onChange={(e) => setBg(e.target.value)} className="w-12 h-10 rounded border border-border bg-transparent" />
                  <Input value={bgColor} onChange={(e) => setBg(e.target.value)} />
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 self-start space-y-4">
          <Card className="glass p-6 text-center">
            <h2 className="font-semibold mb-4">Preview</h2>
            {previewValue ? (
              <QRPreview value={previewValue} fg={fgColor} bg={bgColor} size={220} />
            ) : (
              <div className="w-[220px] h-[220px] mx-auto rounded-xl border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                Fill in the details
              </div>
            )}
          </Card>
          <Button className="w-full btn-neon btn-neon-hover" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save QR code"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function useSlug() {
  const [s] = useState(() => nanoid(8).toLowerCase().replace(/[_-]/g, "a"));
  return s;
}
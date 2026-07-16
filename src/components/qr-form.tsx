import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Trash2, Plus } from "lucide-react";
import type { QRType, QRContent } from "@/lib/qr-types";

interface Props {
  type: QRType;
  content: QRContent;
  targetUrl: string;
  isDynamic: boolean;
  onContent: (c: QRContent) => void;
  onTarget: (v: string) => void;
  onDynamic: (v: boolean) => void;
}

export function QRTypeFields({ type, content, targetUrl, isDynamic, onContent, onTarget, onDynamic }: Props) {
  const c = content as Record<string, string>;
  const set = (k: string, v: unknown) => onContent({ ...content, [k]: v });

  const dynamicToggle = ["url", "multilink", "vcard"].includes(type) && (
    <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-secondary/40">
      <div>
        <Label className="text-sm">Dynamic QR</Label>
        <p className="text-xs text-muted-foreground">Edit destination anytime without reprinting</p>
      </div>
      <Switch checked={isDynamic} onCheckedChange={onDynamic} />
    </div>
  );

  return (
    <div className="space-y-4">
      {dynamicToggle}
      {type === "url" && (
        <Field label="Destination URL">
          <Input placeholder="https://example.com" value={targetUrl} onChange={(e) => onTarget(e.target.value)} />
        </Field>
      )}
      {type === "text" && (
        <Field label="Text content">
          <Textarea rows={4} value={c.text || ""} onChange={(e) => set("text", e.target.value)} />
        </Field>
      )}
      {type === "wifi" && (
        <>
          <Field label="Network name (SSID)"><Input value={c.ssid || ""} onChange={(e) => set("ssid", e.target.value)} /></Field>
          <Field label="Password"><Input value={c.password || ""} onChange={(e) => set("password", e.target.value)} /></Field>
          <Field label="Security"><Input placeholder="WPA / WEP / nopass" value={c.auth || "WPA"} onChange={(e) => set("auth", e.target.value)} /></Field>
        </>
      )}
      {type === "vcard" && (
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name"><Input value={c.firstName || ""} onChange={(e) => set("firstName", e.target.value)} /></Field>
          <Field label="Last name"><Input value={c.lastName || ""} onChange={(e) => set("lastName", e.target.value)} /></Field>
          <Field label="Company"><Input value={c.org || ""} onChange={(e) => set("org", e.target.value)} /></Field>
          <Field label="Title"><Input value={c.title || ""} onChange={(e) => set("title", e.target.value)} /></Field>
          <Field label="Phone"><Input value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Email"><Input type="email" value={c.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Website" className="col-span-2"><Input value={c.website || ""} onChange={(e) => set("website", e.target.value)} /></Field>
          <Field label="Address" className="col-span-2"><Input value={c.address || ""} onChange={(e) => set("address", e.target.value)} /></Field>
          <Field label="Bio / tagline" className="col-span-2"><Textarea rows={2} value={c.bio || ""} onChange={(e) => set("bio", e.target.value)} /></Field>
        </div>
      )}
      {type === "email" && (
        <>
          <Field label="To email"><Input type="email" value={c.email || ""} onChange={(e) => set("email", e.target.value)} /></Field>
          <Field label="Subject"><Input value={c.subject || ""} onChange={(e) => set("subject", e.target.value)} /></Field>
          <Field label="Body"><Textarea rows={3} value={c.body || ""} onChange={(e) => set("body", e.target.value)} /></Field>
        </>
      )}
      {type === "sms" && (
        <>
          <Field label="Phone number"><Input value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Message"><Textarea rows={3} value={c.message || ""} onChange={(e) => set("message", e.target.value)} /></Field>
        </>
      )}
      {type === "phone" && (
        <Field label="Phone number"><Input placeholder="+1 555 555 5555" value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
      )}
      {type === "whatsapp" && (
        <>
          <Field label="Phone (with country code)"><Input placeholder="+15551234567" value={c.phone || ""} onChange={(e) => set("phone", e.target.value)} /></Field>
          <Field label="Pre-filled message (optional)"><Textarea rows={2} value={c.message || ""} onChange={(e) => set("message", e.target.value)} /></Field>
        </>
      )}
      {type === "upi" && (
        <>
          <Field label="UPI ID (VPA)"><Input placeholder="name@bank" value={c.vpa || ""} onChange={(e) => set("vpa", e.target.value)} /></Field>
          <Field label="Payee name"><Input value={c.name || ""} onChange={(e) => set("name", e.target.value)} /></Field>
          <Field label="Amount (optional)"><Input type="number" value={c.amount || ""} onChange={(e) => set("amount", e.target.value)} /></Field>
        </>
      )}
      {type === "maps" && (
        <>
          <Field label="Place / query"><Input placeholder="Eiffel Tower, Paris" value={c.query || ""} onChange={(e) => set("query", e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Latitude (optional)"><Input value={c.lat || ""} onChange={(e) => set("lat", e.target.value)} /></Field>
            <Field label="Longitude (optional)"><Input value={c.lng || ""} onChange={(e) => set("lng", e.target.value)} /></Field>
          </div>
        </>
      )}
      {type === "multilink" && <MultiLinkEditor content={content} onContent={onContent} />}
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      {children}
    </div>
  );
}

function MultiLinkEditor({ content, onContent }: { content: QRContent; onContent: (c: QRContent) => void }) {
  const c = content as { title?: string; description?: string; links?: { label: string; url: string }[] };
  const links = c.links || [];
  return (
    <div className="space-y-4">
      <Field label="Page title"><Input value={c.title || ""} onChange={(e) => onContent({ ...content, title: e.target.value })} /></Field>
      <Field label="Description"><Textarea rows={2} value={c.description || ""} onChange={(e) => onContent({ ...content, description: e.target.value })} /></Field>
      <div>
        <Label className="mb-1.5 block text-sm">Links</Label>
        <div className="space-y-2">
          {links.map((l, i) => (
            <div key={i} className="flex gap-2">
              <Input placeholder="Label" value={l.label} onChange={(e) => {
                const next = [...links]; next[i] = { ...l, label: e.target.value };
                onContent({ ...content, links: next });
              }} />
              <Input placeholder="https://…" value={l.url} onChange={(e) => {
                const next = [...links]; next[i] = { ...l, url: e.target.value };
                onContent({ ...content, links: next });
              }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => onContent({ ...content, links: links.filter((_, j) => j !== i) })}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => onContent({ ...content, links: [...links, { label: "", url: "" }] })}>
          <Plus className="w-3.5 h-3.5 mr-1" /> Add link
        </Button>
      </div>
    </div>
  );
}
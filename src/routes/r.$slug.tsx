import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { resolveDynamicTarget, type QRType, type QRContent } from "@/lib/qr-types";
import { Card } from "@/components/ui/card";
import { ExternalLink, Mail, Phone, Globe, MapPin } from "lucide-react";

export const Route = createFileRoute("/r/$slug")({
  ssr: false,
  head: () => ({ meta: [{ title: "Redirecting… — QRFlux" }, { name: "robots", content: "noindex" }] }),
  loader: async ({ params }) => {
    const { data, error } = await supabase
      .from("qr_codes")
      .select("id, type, content, target_url, is_active, name")
      .eq("slug", params.slug)
      .maybeSingle();
    if (error || !data || !data.is_active) throw notFound();
    return data;
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center p-6 text-center">
      <div>
        <h1 className="text-2xl font-bold mb-2">Link not found</h1>
        <p className="text-muted-foreground">This QR code is inactive or does not exist.</p>
      </div>
    </div>
  ),
  component: RedirectPage,
});

function RedirectPage() {
  const data = Route.useLoaderData();

  useEffect(() => {
    supabase.from("qr_scans").insert({
      qr_code_id: data.id,
      user_agent: navigator.userAgent,
      referer: document.referrer || null,
    }).then(() => {});
    supabase.rpc("increment_scan_count", { qr_id: data.id }).then(() => {});

    if (data.type !== "multilink" && data.type !== "vcard") {
      const target = resolveDynamicTarget(data.type as QRType, data.content as QRContent, data.target_url);
      if (target) window.location.replace(target);
    }
  }, [data]);

  if (data.type === "multilink") return <MultiLinkPage data={data} />;
  if (data.type === "vcard") return <VCardPage data={data} />;
  return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      Redirecting…
    </div>
  );
}

type Data = ReturnType<typeof Route.useLoaderData>;

function MultiLinkPage({ data }: { data: Data }) {
  const c = (data.content as { title?: string; description?: string; links?: { label: string; url: string }[] }) || {};
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl btn-neon flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{c.title || data.name}</h1>
        {c.description && <p className="text-muted-foreground mb-8">{c.description}</p>}
        <div className="space-y-3">
          {(c.links || []).filter((l) => l.url).map((l, i) => (
            <a key={i} href={l.url} target="_blank" rel="noopener noreferrer">
              <Card className="glass p-4 hover:border-primary/50 transition-colors flex items-center justify-between">
                <span className="font-medium">{l.label || l.url}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </Card>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function VCardPage({ data }: { data: Data }) {
  const c = (data.content as Record<string, string>) || {};
  const full = [c.firstName, c.lastName].filter(Boolean).join(" ") || data.name;
  return (
    <div className="min-h-screen py-16 px-4">
      <div className="max-w-md mx-auto">
        <Card className="glass p-8 text-center">
          {c.avatarUrl && <img src={c.avatarUrl} alt={full} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />}
          <h1 className="text-2xl font-bold">{full}</h1>
          {c.title && <p className="text-muted-foreground">{c.title}{c.org ? ` · ${c.org}` : ""}</p>}
          {c.bio && <p className="text-sm text-muted-foreground mt-4">{c.bio}</p>}
          <div className="grid gap-2 mt-6 text-left">
            {c.email && <ContactRow icon={Mail} label={c.email} href={`mailto:${c.email}`} />}
            {c.phone && <ContactRow icon={Phone} label={c.phone} href={`tel:${c.phone}`} />}
            {c.website && <ContactRow icon={Globe} label={c.website} href={c.website.startsWith("http") ? c.website : `https://${c.website}`} />}
            {c.address && <ContactRow icon={MapPin} label={c.address} href={`https://maps.google.com/?q=${encodeURIComponent(c.address)}`} />}
          </div>
          <a href={buildVCardDataUrl(c, full)} download={`${full.replace(/\s+/g, "_")}.vcf`}>
            <button className="btn-neon btn-neon-hover w-full mt-6 py-2.5 rounded-lg font-medium">Save contact</button>
          </a>
        </Card>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, href }: { icon: typeof Mail; label: string; href: string }) {
  return (
    <a href={href} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <Icon className="w-4 h-4 text-primary" />
      <span className="text-sm truncate">{label}</span>
    </a>
  );
}

function buildVCardDataUrl(c: Record<string, string>, full: string): string {
  const vcf = [
    "BEGIN:VCARD", "VERSION:3.0",
    `FN:${full}`,
    `N:${c.lastName || ""};${c.firstName || ""}`,
    c.org && `ORG:${c.org}`,
    c.title && `TITLE:${c.title}`,
    c.phone && `TEL:${c.phone}`,
    c.email && `EMAIL:${c.email}`,
    c.website && `URL:${c.website}`,
    c.address && `ADR:;;${c.address}`,
    "END:VCARD",
  ].filter(Boolean).join("\n");
  return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcf)}`;
}
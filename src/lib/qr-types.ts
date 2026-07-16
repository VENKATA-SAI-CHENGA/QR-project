export type QRType =
  | "url"
  | "text"
  | "wifi"
  | "vcard"
  | "email"
  | "sms"
  | "phone"
  | "whatsapp"
  | "upi"
  | "maps"
  | "multilink";

export const QR_TYPES: { value: QRType; label: string; desc: string }[] = [
  { value: "url", label: "Website URL", desc: "Redirect to any web page" },
  { value: "multilink", label: "Multi-Link", desc: "One QR, many links (like a bio page)" },
  { value: "vcard", label: "Digital Business Card", desc: "Share contact details as a page" },
  { value: "whatsapp", label: "WhatsApp", desc: "Open a WhatsApp chat" },
  { value: "phone", label: "Phone Call", desc: "Dial a phone number" },
  { value: "sms", label: "SMS", desc: "Pre-filled text message" },
  { value: "email", label: "Email", desc: "Compose an email" },
  { value: "wifi", label: "Wi-Fi", desc: "Join a Wi-Fi network" },
  { value: "upi", label: "UPI Payment", desc: "Pay via UPI (India)" },
  { value: "maps", label: "Google Maps", desc: "Open a location" },
  { value: "text", label: "Plain Text", desc: "Display any text" },
];

export type QRContent = Record<string, unknown>;

/** Build the raw payload for STATIC QRs (encoded directly into the image). */
export function buildStaticPayload(type: QRType, content: QRContent, targetUrl?: string | null): string {
  const c = content as Record<string, string>;
  switch (type) {
    case "url":
      return targetUrl || c.url || "";
    case "text":
      return c.text || "";
    case "wifi":
      return `WIFI:T:${c.auth || "WPA"};S:${escapeMecard(c.ssid)};P:${escapeMecard(c.password)};H:${c.hidden === "true" ? "true" : "false"};;`;
    case "vcard":
      return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `N:${c.lastName || ""};${c.firstName || ""}`,
        `FN:${[c.firstName, c.lastName].filter(Boolean).join(" ")}`,
        c.org ? `ORG:${c.org}` : "",
        c.title ? `TITLE:${c.title}` : "",
        c.phone ? `TEL:${c.phone}` : "",
        c.email ? `EMAIL:${c.email}` : "",
        c.website ? `URL:${c.website}` : "",
        c.address ? `ADR:;;${c.address}` : "",
        "END:VCARD",
      ].filter(Boolean).join("\n");
    case "email":
      return `mailto:${c.email || ""}?subject=${encodeURIComponent(c.subject || "")}&body=${encodeURIComponent(c.body || "")}`;
    case "sms":
      return `SMSTO:${c.phone || ""}:${c.message || ""}`;
    case "phone":
      return `tel:${c.phone || ""}`;
    case "whatsapp":
      return `https://wa.me/${(c.phone || "").replace(/\D/g, "")}${c.message ? `?text=${encodeURIComponent(c.message)}` : ""}`;
    case "upi":
      return `upi://pay?pa=${encodeURIComponent(c.vpa || "")}&pn=${encodeURIComponent(c.name || "")}${c.amount ? `&am=${encodeURIComponent(c.amount)}` : ""}&cu=${c.currency || "INR"}`;
    case "maps":
      if (c.lat && c.lng) return `https://maps.google.com/?q=${c.lat},${c.lng}`;
      return `https://maps.google.com/?q=${encodeURIComponent(c.query || "")}`;
    case "multilink":
      return targetUrl || "";
    default:
      return "";
  }
}

function escapeMecard(v?: string): string {
  return (v || "").replace(/([\\;,:"])/g, "\\$1");
}

/** Compute the destination URL for dynamic redirects (server-side). */
export function resolveDynamicTarget(type: QRType, content: QRContent, targetUrl?: string | null): string | null {
  const payload = buildStaticPayload(type, content, targetUrl);
  if (!payload) return null;
  if (/^https?:\/\//i.test(payload) || /^(tel|mailto|sms|upi|smsto|wifi):/i.test(payload)) {
    return payload;
  }
  return null;
}
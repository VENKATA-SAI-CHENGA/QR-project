import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface Props {
  value: string;
  fg?: string;
  bg?: string;
  size?: number;
  className?: string;
}

export function QRPreview({ value, fg = "#0A0A0F", bg = "#FFFFFF", size = 256, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current || !value) return;
    QRCode.toCanvas(ref.current, value, {
      width: size,
      margin: 2,
      color: { dark: fg, light: bg },
      errorCorrectionLevel: "H",
    }).catch(() => {});
  }, [value, fg, bg, size]);
  return (
    <div className={className} style={{ background: bg, padding: 12, borderRadius: 16, display: "inline-block" }}>
      <canvas ref={ref} width={size} height={size} />
    </div>
  );
}

export async function downloadQR(value: string, fg: string, bg: string, name: string, format: "png" | "svg") {
  if (format === "svg") {
    const svg = await QRCode.toString(value, { type: "svg", color: { dark: fg, light: bg }, margin: 2, errorCorrectionLevel: "H" });
    triggerDownload(new Blob([svg], { type: "image/svg+xml" }), `${name}.svg`);
  } else {
    const url = await QRCode.toDataURL(value, { color: { dark: fg, light: bg }, margin: 2, width: 1024, errorCorrectionLevel: "H" });
    const res = await fetch(url);
    triggerDownload(await res.blob(), `${name}.png`);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
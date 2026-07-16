import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QRPreview } from "@/components/qr-preview";
import { QrCode, Zap, BarChart3, Palette, Link2, Smartphone, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen">
      <header className="max-w-6xl mx-auto flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg btn-neon flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl">QRFlux</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/auth"><Button size="sm" className="btn-neon btn-neon-hover">Get started</Button></Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-16 pb-24 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full glass px-3 py-1 text-xs mb-6">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Unified QR Management Platform
          </div>
          <h1 className="text-5xl md:text-6xl font-bold leading-[1.05] mb-6">
            One QR code,<br />
            <span className="text-gradient">every destination.</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg">
            Create dynamic QR codes for websites, WhatsApp, UPI, Wi-Fi, business cards and more.
            Customize the look, track every scan, and update destinations without reprinting.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" className="btn-neon btn-neon-hover">
                Start free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline">See features</Button>
            </a>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="glow-primary rounded-3xl p-6 glass">
            <QRPreview value="https://qrflux.app" fg="#0A0A0F" bg="#FFFFFF" size={260} />
            <p className="text-center mt-4 text-sm text-muted-foreground">Scan me →</p>
          </div>
        </div>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold mb-3">Everything you need in one QR</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Static or dynamic, styled to your brand, with real-time analytics baked in.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          <Feature icon={Link2} title="11 QR types" desc="URL, multi-link, vCard, WhatsApp, UPI, Wi-Fi, SMS, email, phone, maps, plain text." />
          <Feature icon={Zap} title="Dynamic redirects" desc="Change where a QR points without reprinting. Perfect for campaigns and packaging." />
          <Feature icon={BarChart3} title="Live analytics" desc="Track every scan with time-series charts, referrer and device data." />
          <Feature icon={Palette} title="Full customization" desc="Choose colors, sizes and download as PNG or SVG at any resolution." />
          <Feature icon={Smartphone} title="Multi-link bio pages" desc="One QR opens a hosted landing page with all your links." />
          <Feature icon={QrCode} title="Digital business cards" desc="Share contact details as a beautiful page — one tap to save." />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <Card className="glass p-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to build your first QR?</h2>
          <p className="text-muted-foreground mb-8">Free forever for individuals. No credit card required.</p>
          <Link to="/auth">
            <Button size="lg" className="btn-neon btn-neon-hover">Create your account <ArrowRight className="w-4 h-4 ml-2" /></Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} QRFlux — Unified QR management platform.
      </footer>
    </div>
  );
}

function Feature({ icon: Icon, title, desc }: { icon: typeof QrCode; title: string; desc: string }) {
  return (
    <Card className="glass p-6">
      <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center mb-4">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="font-semibold mb-1.5">{title}</h3>
      <p className="text-sm text-muted-foreground">{desc}</p>
    </Card>
  );
}

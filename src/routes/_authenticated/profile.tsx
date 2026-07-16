import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — QRFlux" }] }),
  component: Profile,
});

function Profile() {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return null;
      const { data } = await supabase.from("profiles").select("*").eq("id", userRes.user.id).maybeSingle();
      return { ...data, email: userRes.user.email };
    },
  });

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.full_name || "");
      setAvatar(profile.avatar_url || "");
    }
  }, [profile]);

  async function save() {
    setBusy(true);
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) return;
    const { error } = await supabase.from("profiles").upsert({
      id: userRes.user.id,
      full_name: name,
      avatar_url: avatar || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  }

  return (
    <div className="p-6 md:p-10 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-1">Profile</h1>
      <p className="text-muted-foreground mb-8">Manage your account details</p>

      <Card className="glass p-6 space-y-4">
        <div>
          <Label>Email</Label>
          <Input value={profile?.email || ""} disabled />
        </div>
        <div>
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label>Avatar URL</Label>
          <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://…" />
        </div>
        <div className="pt-2">
          <Button className="btn-neon btn-neon-hover" onClick={save} disabled={busy}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
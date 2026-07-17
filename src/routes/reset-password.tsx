import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully.");

    navigate({ to: "/auth" });
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="glass p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2">
          Reset Password
        </h1>

        <p className="text-muted-foreground mb-6">
          Enter your new password.
        </p>

        <Label htmlFor="password">New Password</Label>

        <Input
          id="password"
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <Button
          className="w-full mt-6 btn-neon"
          onClick={updatePassword}
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </Button>
      </Card>
    </div>
  );
}
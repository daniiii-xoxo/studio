"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@studio/database";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { Lock } from "lucide-react";
import { LandingNav } from "@/components/landing/landing-nav";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Manually capture the recovery access_token from the URL hash
    // just in case the browser client does not automatically hydrate it.
    if (typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        }).catch(err => console.error("Session Set Error:", err));
      }
    }
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast({ variant: "destructive", title: "Error", description: "Passwords do not match." });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      toast({ title: "Success", description: "Your password has been successfully updated." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message || "Could not update password.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 pt-20">
      {/* Floating Capsule Header */}
      <LandingNav currentPath="/auth/update-password" />

      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cog-bg.png"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />
        {/* Overlay for better card visibility */}
        <div className="absolute inset-0 bg-black/30" />
        {/* Vignette effect - dark shadow around edges */}
        <div className="absolute inset-0 shadow-[inset_0_0_120px_60px_rgba(0,0,0,0.5)]" />
      </div>

      <Card className="relative z-10 mx-auto max-w-[470px] w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.9),0_0_80px_rgba(0, 0, 0, 0.9)] backdrop-blur-xl bg-black/15 border border-black/20 dark:bg-black/10 dark:border-black/10 animate-in fade-in zoom-in-95 slide-in-from-bottom-6 duration-700 ease-out">
        <CardHeader className="space-y-2.5 text-center pt-7 pb-3 px-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 backdrop-blur-md mb-2 shadow-inner border border-white/20">
            <Lock className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="font-headline text-2xl text-white">Update Password</CardTitle>
          <CardDescription className="text-white/90 text-sm">
            Enter your new password below to regain access to your account.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-7">
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-2 text-left">
              <Label htmlFor="password" className="text-white">New Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                minLength={6}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus-visible:ring-white/30"
              />
            </div>
            <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 mt-2 font-semibold h-11" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

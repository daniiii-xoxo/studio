"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@studio/database";
import { getWorkerByEmail } from "@/actions/db";
import { LoaderCircle } from "lucide-react";

const SUPER_ADMIN_EMAILS = new Set(["admin@system.com", "pacleb@gmail.com"]);

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("Exchange error:", error);
          }
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const user = session.user;
          const email = user.email?.trim().toLowerCase();

          if (!email) {
            await supabase.auth.signOut();
            router.replace("/login?error=no_email");
            return;
          }

          // Check if user is whitelisted super admin
          const isSuperAdmin = SUPER_ADMIN_EMAILS.has(email);

          // Check if user has an existing worker account registered by Ministry Head / Admin
          const existingWorker = await getWorkerByEmail(email);

          if (!existingWorker && !isSuperAdmin) {
            // Unregistered user -> Disallow login and revoke session
            await supabase.auth.signOut();
            router.replace(`/login?error=unregistered&email=${encodeURIComponent(email)}`);
            return;
          }

          // Allowed! Registered worker or admin
          router.replace("/dashboard");
          return;
        }
      } catch (err) {
        console.error("Auth callback error:", err);
      }
      
      router.replace("/login");
    };

    handleAuth();
  }, [router]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Verifying authorized access...</p>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { LoaderCircle, Eye, EyeOff } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  Button,
  Input,
  Label,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { getWorkerEmail } from "@/actions/legacy-auth";
import { LandingNav } from "@/components/landing/landing-nav";

export default function LoginPage() {
  const [mode, setMode] = useState<"email" | "worker">("email");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Reset Password state
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);

  const { user, isUserLoading } = useAuthStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsGoogleSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.message || "Failed to initiate Google sign-in.",
      });
      setIsGoogleSigningIn(false);
    }
  };

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const error = params.get("error");
      const emailParam = params.get("email");

      if (error === "unregistered") {
        toast({
          variant: "destructive",
          title: "Account Not Registered",
          description: emailParam
            ? `The Google account (${emailParam}) is not yet registered. Please contact your Ministry Head or Administrator to create your account first.`
            : "This Google account is not yet registered. Please contact your Ministry Head or Administrator to create your account first.",
        });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [toast]);

  // Reset identifier when switching modes
  const handleModeSwitch = (newMode: "email" | "worker") => {
    setMode(newMode);
    setIdentifier("");
    setPassword("");
  };

  const handleSignIn = async () => {
    if (!identifier || !password) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: `Please enter your ${mode === "email" ? "email" : "Worker ID"} and password.`,
      });
      return;
    }

    setIsSigningIn(true);
    try {
      let loginEmail = identifier;

      if (mode === "worker") {
        const result = await getWorkerEmail(identifier);
        if (!result.success || !result.email) {
          throw new Error(result.error || "Worker ID not found.");
        }
        loginEmail = result.email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password,
      });

      if (error) throw error;
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.message,
      });
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email.",
      });
      return;
    }
    setIsResetting(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast({
        title: "Reset Email Sent",
        description: `Instructions sent to ${resetEmail}`,
      });
      setIsResetDialogOpen(false);
      setResetEmail("");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4 pt-20">
      {/* Floating Capsule Header */}
      <LandingNav currentPath="/login" />

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

      <Card className="relative z-10 mx-auto max-w-md w-full shadow-[0_8px_32px_0_rgba(0,0,0,0.9),0_0_80px_rgba(0, 0, 0, 0.9)] backdrop-blur-xl bg-black/10 border border-black/20 dark:bg-black/5 dark:border-black/10">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center items-center">
            <Image src="/church-logo.png" alt="COG Logo" width={80} height={80} className="rounded-sm drop-shadow-[0_4px_8px_rgba(0, 0, 0, 0.9)]" />
          </div>
          <CardTitle className="font-headline text-2xl text-white">COG App</CardTitle>
          <CardDescription className="text-white/90">
            {mode === "email" ? "Enter your email and password" : "Enter your Worker ID and password"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={mode === "email" ? "default" : "outline"}
                onClick={() => handleModeSwitch("email")}
                disabled={isSigningIn}
              >
                Email Login
              </Button>
              <Button
                type="button"
                variant={mode === "worker" ? "default" : "outline"}
                onClick={() => handleModeSwitch("worker")}
                disabled={isSigningIn}
              >
                Worker ID Login
              </Button>
            </div>

            {/* Identifier */}
            <div className="grid gap-2">
              <Label htmlFor="identifier" className="text-white">{mode === "email" ? "Email" : "Worker ID"}</Label>
              <Input
                id="identifier"
                type={mode === "email" ? "email" : "text"}
                placeholder={mode === "email" ? "m@example.com" : "e.g. 01042"}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={isSigningIn}
                onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
              />
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <div className="flex items-center">
                <Label htmlFor="password" className="text-white">Password</Label>
                {mode === "email" && (
                  <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                    <DialogTrigger asChild>
                      <button
                        type="button"
                        className="ml-auto inline-block text-sm underline text-white/90 hover:text-white transition-colors"
                      >
                        Forgot password?
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Reset Password</DialogTitle>
                        <DialogDescription>Enter your email for reset instructions.</DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-2 py-4">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          placeholder="m@example.com"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          disabled={isResetting}
                        />
                      </div>
                      <DialogFooter>
                        <Button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResetting}
                          className="w-full"
                        >
                          {isResetting && <LoaderCircle className="h-4 w-4 animate-spin mr-2" />}
                          Send Reset Link
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSigningIn}
                  onKeyDown={(e) => e.key === "Enter" && handleSignIn()}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button onClick={handleSignIn} className="w-full" disabled={isSigningIn || isGoogleSigningIn}>
              {isSigningIn ? <LoaderCircle className="animate-spin" /> : "Login"}
            </Button>

            {/* Divider */}
            <div className="relative my-1 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/20" />
              </div>
              <span className="relative bg-black/40 px-2.5 py-0.5 rounded-full text-[11px] font-medium uppercase tracking-wider text-white/70 backdrop-blur-md">
                Or continue with
              </span>
            </div>

            {/* Google Sign-in Button */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn || isGoogleSigningIn}
              className="w-full bg-white text-gray-900 hover:bg-gray-100 hover:text-gray-900 border-none font-medium h-10 gap-2.5 shadow-sm transition-all"
            >
              {isGoogleSigningIn ? (
                <LoaderCircle className="h-4 w-4 animate-spin text-gray-700" />
              ) : (
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              {isGoogleSigningIn ? "Connecting to Google..." : "Sign in with Google"}
            </Button>
          </div>


        </CardContent>
      </Card>
    </div>
  );
}

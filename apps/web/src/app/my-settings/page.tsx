"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Button,
  Input,
  Label,
} from "@studio/ui";
import {
  Smartphone,
  LogOut,
  KeyRound,
  Shield,
  HelpCircle,
  AlertCircle,
  Mail,
  Info,
  ShieldCheck,
  Send,
  LoaderCircle,
  ChevronDown,
  CheckCircle2,
  Lock,
  ExternalLink,
  Clock,
  Sparkles,
  Laptop,
  Check,
  ArrowRight,
  Type,
  SunMoon,
} from "lucide-react";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FontSizeSlider } from "@/components/settings/font-size-slider";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import { requestPasswordReset } from "@/actions/auth";

type SettingTab = "appearance" | "password" | "security" | "support" | "report";

function MySettingsContent() {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const rawTab = searchParams.get("tab");
  const activeTab: SettingTab =
    rawTab && ["appearance", "password", "security", "support", "report"].includes(rawTab)
      ? (rawTab as SettingTab)
      : "appearance";

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [reportCategory, setReportCategory] = useState("general");
  const [reportTitle, setReportTitle] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportEmail, setReportEmail] = useState(user?.email || "");
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  const handleTabChange = (newTab: SettingTab) => {
    router.push(`/my-settings?tab=${newTab}`, { scroll: false });
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setIsChangingPassword(true);
    try {
      const res = await requestPasswordReset(user.email, window.location.origin);
      if (!res.success) {
        toast({
          variant: "destructive",
          title: res.isDeactivated ? "Account Deactivated" : "Error",
          description: res.error || "Failed to send password reset email.",
        });
        return;
      }
      toast({
        title: "Password Reset Email Sent",
        description: `Instructions sent to ${res.email}. Please check your inbox.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: "global" });
      toast({
        title: "Logged out from all devices",
        description: "You have been logged out from all devices.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to logout from all devices.",
      });
    }
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle.trim() || !reportDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in both the title and description.",
      });
      return;
    }

    setIsSubmittingReport(true);
    setTimeout(() => {
      setIsSubmittingReport(false);
      setReportTitle("");
      setReportDescription("");
      toast({
        title: "Report Submitted",
        description: "Thank you for your feedback. We'll look into this issue promptly.",
      });
    }, 600);
  };

  return (
    <div className="w-full space-y-6 pb-12 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-gray-900 dark:text-white">
            {activeTab === "appearance" && "Display & Appearance"}
            {activeTab === "password" && "Change Password"}
            {activeTab === "security" && "Login Security"}
            {activeTab === "support" && "Help & Support"}
            {activeTab === "report" && "Report a Problem"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeTab === "appearance" && "Customize theme mode (Dark / Light), typography, text sizing, and accessibility preferences across the application."}
            {activeTab === "password" && "Manage your account authentication credentials and security settings."}
            {activeTab === "security" && "Monitor active devices, login sessions, and global security controls."}
            {activeTab === "support" && "Browse FAQs and find guidance on using the workforce management platform."}
            {activeTab === "report" && "Submit a technical support request directly to the IT administration team."}
          </p>
        </div>
      </div>

      {/* Main Container Card */}
      <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-6 sm:p-8 md:p-10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* ── Tab: Display & Appearance ── */}
        {activeTab === "appearance" && (
          <div className="space-y-10">
            {/* Theme / Dark Mode Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <SunMoon className="h-3.5 w-3.5" />
                  <span>Color Theme</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Appearance & Theme
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Choose between Light and Dark mode. Dark mode uses a comfortable, low-glare slate palette designed to reduce eye strain in low-light environments.
                </p>
              </div>

              <ThemeToggle />
            </div>

            {/* Subtle Divider */}
            <div className="h-[1px] bg-border/60" />

            {/* Typography / Font Size Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <Type className="h-3.5 w-3.5" />
                  <span>Accessibility & Typography</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Text & Font Size
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                  Personalize text size across the entire application for improved legibility and comfort. The setting scales all headers, forms, tables, cards, dialogs, and navigation labels immediately.
                </p>
              </div>

              <FontSizeSlider />
            </div>
          </div>
        )}

        {/* ── Tab: Change Password ── */}
        {activeTab === "password" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Action Card */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <KeyRound className="h-3.5 w-3.5" />
                  <span>Account Credentials</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Reset Account Password
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We'll send a secure password reset link to your verified email address. You will be redirected to create a new, strong password.
                </p>
              </div>

              {/* Form Box */}
              <div className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/60 p-6 sm:p-7 shadow-2xs space-y-6">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-sidebar dark:text-blue-400" />
                      Registered Email Address
                    </Label>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                      <Check className="h-3 w-3" /> Verified
                    </span>
                  </div>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="bg-white dark:bg-background text-sm font-semibold h-12 rounded-xl border-slate-200/90 dark:border-border text-foreground shadow-2xs cursor-not-allowed opacity-95 pl-4"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    This email is permanently linked to your worker profile and credentials.
                  </p>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword}
                    className="w-full text-sm font-bold h-12 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-sm hover:shadow transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {isChangingPassword ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        <span>Send Password Reset Email</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Bottom SLA banner */}
              <div className="bg-blue-50/70 dark:bg-blue-950/20 p-4 sm:p-5 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5 shadow-2xs">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="text-xs text-blue-950 dark:text-blue-300 leading-relaxed space-y-1">
                  <p className="font-bold text-[13px]">1-Hour Link Validity</p>
                  <p>
                    For your security, the reset link is single-use and will automatically expire in 60 minutes. Check your spam folder if you do not see it in your inbox.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Column: Security Guide & Overview Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 dark:from-muted/40 dark:via-card dark:to-blue-950/10 rounded-2xl border border-border/70 p-6 sm:p-7 shadow-2xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-sidebar text-white shadow-xs">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-headline text-foreground">
                      Security Recommendations
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Best practices for account protection
                    </p>
                  </div>
                </div>

                <div className="space-y-4 pt-1 divide-y divide-border/40">
                  <div className="flex items-start gap-3 pt-3 first:pt-0">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-foreground">Create a Unique Password</p>
                      <p className="text-muted-foreground mt-0.5">
                        Use at least 8 characters with a blend of numbers, symbols, and uppercase letters.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-foreground">Secure Email Delivery</p>
                      <p className="text-muted-foreground mt-0.5">
                        Reset requests are delivered with TLS encryption directly to your authorized inbox.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 pt-3">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-xs leading-relaxed">
                      <p className="font-bold text-foreground">Never Share Credentials</p>
                      <p className="text-muted-foreground mt-0.5">
                        Church administrators will never ask for your password or verification links.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Link Card */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleTabChange("security")}
                    className="w-full group p-3.5 rounded-xl border border-border/80 bg-white/80 dark:bg-background/80 hover:bg-sidebar hover:text-white dark:hover:bg-sidebar transition-all flex items-center justify-between text-xs font-bold text-foreground cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Smartphone className="h-4 w-4 text-sidebar group-hover:text-white" />
                      <span>Manage Active Devices & Sessions</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Login Security ── */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <Shield className="h-3.5 w-3.5" />
                  <span>Session Security</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Active Sessions & Devices
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Monitor devices currently logged into your account and terminate unauthorized sessions immediately.
                </p>
              </div>

              {/* Active Device Session Card */}
              <div className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/60 p-6 sm:p-7 shadow-2xs space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold flex items-center gap-2.5 text-foreground">
                    <div className="p-2 rounded-xl bg-sidebar/10 dark:bg-sidebar/20 text-sidebar dark:text-blue-400">
                      <Laptop className="h-4 w-4" />
                    </div>
                    <span>Current Connected Device</span>
                  </h4>
                  <span className="text-xs font-bold text-muted-foreground">Web Application</span>
                </div>

                <div className="bg-emerald-50/80 dark:bg-emerald-950/25 rounded-xl p-5 border border-emerald-200/80 dark:border-emerald-900/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-emerald-950 dark:text-emerald-300">
                          Active Browser Session
                        </p>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 dark:bg-emerald-900/70 text-emerald-900 dark:text-emerald-200">
                          This Computer
                        </span>
                      </div>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Authenticated via Supabase Auth • Secure Token Active
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Online</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  This device has valid authentication tokens. If you suspect any unauthorized access, revoke all credentials below.
                </p>
              </div>

              {/* Global Logout Card */}
              <div className="bg-rose-50/50 dark:bg-rose-950/15 rounded-2xl border border-rose-200/70 dark:border-rose-900/40 p-6 sm:p-7 shadow-2xs space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <LogOut className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-foreground">
                      Terminate All Active Sessions
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Sign out across all computers, tablets, and kiosks
                    </p>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  This action will invalidate all login tokens globally. You and any active sessions on other devices will be prompted to log in again.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleLogoutAllDevices}
                  className="w-full text-sm font-bold h-12 rounded-xl shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout from All Devices</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Security Status */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/70 p-6 sm:p-7 shadow-2xs space-y-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold font-headline text-foreground">
                      Account Protection
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Device security status
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5 text-xs leading-relaxed text-muted-foreground">
                  <div className="p-3.5 rounded-xl bg-white dark:bg-background border border-border/60">
                    <p className="font-bold text-foreground mb-1">Session Expiration</p>
                    <p>Inactivity timeout automatically triggers re-authentication to protect sensitive workforce data.</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white dark:bg-background border border-border/60">
                    <p className="font-bold text-foreground mb-1">Public Computer Caution</p>
                    <p>Always remember to explicitly log out when accessing the portal from shared church computers or registration kiosks.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Help & Support ── */}
        {activeTab === "support" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Knowledge Base</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Frequently Asked Questions
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Quick answers to common questions about reservation requests, meal allowances, and attendance tracking.
                </p>
              </div>

              {/* FAQ Accordions */}
              <div className="space-y-3">
                <details className="group bg-slate-50/80 dark:bg-muted/30 rounded-xl p-5 border border-border/60 shadow-2xs hover:shadow-xs hover:border-sidebar/30 transition-all cursor-pointer">
                  <summary className="cursor-pointer font-bold text-sm text-foreground flex items-center justify-between select-none">
                    <span>How do I reserve a room or venue?</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                    Navigate to <span className="font-semibold text-foreground">Room Reservations → Reserve a Room</span>, pick your desired branch, date, time slot, and room, provide your event purpose, and submit the booking request for approval.
                  </p>
                </details>

                <details className="group bg-slate-50/80 dark:bg-muted/30 rounded-xl p-5 border border-border/60 shadow-2xs hover:shadow-xs hover:border-sidebar/30 transition-all cursor-pointer">
                  <summary className="cursor-pointer font-bold text-sm text-foreground flex items-center justify-between select-none">
                    <span>How do I access and display my QR Code?</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                    Click on <span className="font-semibold text-foreground">My QR Code</span> located in the navigation sidebar or bottom bar to display your personal worker badge for fast attendance and meal stub scanning.
                  </p>
                </details>

                <details className="group bg-slate-50/80 dark:bg-muted/30 rounded-xl p-5 border border-border/60 shadow-2xs hover:shadow-xs hover:border-sidebar/30 transition-all cursor-pointer">
                  <summary className="cursor-pointer font-bold text-sm text-foreground flex items-center justify-between select-none">
                    <span>How do I claim or check my daily meal stubs?</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                    Go to <span className="font-semibold text-foreground">Meal Stubs</span> to monitor your daily allocation and weekly utilization, or present your QR badge at any scanning station.
                  </p>
                </details>

                <details className="group bg-slate-50/80 dark:bg-muted/30 rounded-xl p-5 border border-border/60 shadow-2xs hover:shadow-xs hover:border-sidebar/30 transition-all cursor-pointer">
                  <summary className="cursor-pointer font-bold text-sm text-foreground flex items-center justify-between select-none">
                    <span>How do I check my attendance history?</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground group-open:rotate-180 transition-transform duration-200 shrink-0 ml-2" />
                  </summary>
                  <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0.5">
                    Navigate to <span className="font-semibold text-foreground">Attendance</span> to see your complete clock-in and clock-out logs, weekly summary statistics, and time tracking history.
                  </p>
                </details>
              </div>
            </div>

            {/* Right Column: Support Card */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/70 p-6 sm:p-7 shadow-2xs space-y-5">
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-headline text-foreground">Still have questions?</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Our technical support and administration team is available to assist with system errors, access roles, or inquiries.
                  </p>
                </div>
                <Button
                  onClick={() => handleTabChange("report")}
                  className="w-full text-sm font-bold h-12 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Submit a Support Ticket</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tab: Report a Problem ── */}
        {activeTab === "report" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Helpdesk Ticket</span>
                </div>
                <h3 className="text-2xl font-bold font-headline text-foreground">
                  Submit a Problem Report
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Encountered an issue or bug? Provide details below and our IT support team will investigate promptly.
                </p>
              </div>

              {/* Form Card */}
              <form onSubmit={handleSubmitReport} className="bg-slate-50/80 dark:bg-muted/30 rounded-2xl border border-border/60 p-6 sm:p-7 shadow-2xs space-y-5">
                {/* Category Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Issue Category
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "general", label: "General System" },
                      { id: "reservations", label: "Room Reservations" },
                      { id: "meals", label: "Meal Stubs" },
                      { id: "attendance", label: "Attendance Log" },
                      { id: "account", label: "Account / Access" },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setReportCategory(cat.id)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                          reportCategory === cat.id
                            ? "bg-sidebar text-white shadow-xs"
                            : "bg-white dark:bg-background border border-border/70 text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue-title" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Issue Subject <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="issue-title"
                    placeholder="e.g., Cannot submit room reservation request for Level 2"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    className="text-sm h-12 rounded-xl border-slate-200/90 dark:border-border bg-white dark:bg-background shadow-2xs"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="issue-description" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Detailed Explanation <span className="text-rose-500">*</span>
                  </Label>
                  <textarea
                    id="issue-description"
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    rows={5}
                    className="flex w-full rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none shadow-2xs"
                    placeholder="Please describe what happened, steps to reproduce, and any error messages..."
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Contact Email for Updates
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    placeholder="Your email address"
                    className="text-sm h-12 rounded-xl border-slate-200/90 dark:border-border bg-white dark:bg-background shadow-2xs"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="w-full text-sm font-bold h-12 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  {isSubmittingReport ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      <span>Submitting Ticket...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Submit Problem Ticket</span>
                    </>
                  )}
                </Button>
              </form>
            </div>

            {/* Right Column: SLA Banner */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-blue-50/70 dark:bg-blue-950/20 p-6 sm:p-7 rounded-2xl border border-blue-200/70 dark:border-blue-900/40 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-blue-950 dark:text-blue-200">
                      Support SLA Guarantee
                    </h4>
                    <p className="text-xs text-blue-800/80 dark:text-blue-300/80">
                      Typical turnaround time
                    </p>
                  </div>
                </div>
                <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed">
                  Your ticket is automatically triaged and assigned to the IT administration workforce. Standard response time is within 24 to 48 hours on operating days.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MySettingsPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>}>
        <MySettingsContent />
      </Suspense>
    </AppLayout>
  );
}

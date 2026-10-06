"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Settings, ArrowLeft, Save, LoaderCircle, Building2, SlidersHorizontal, Ticket, SunMoon } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/settings/theme-toggle";

// ── Toggle switch ──────────────────────────────────────────────────────────────
function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={cn(
        "relative w-11 h-6 rounded-full transition-colors shrink-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-sidebar/20",
        value ? "bg-sidebar dark:bg-sky-600" : "bg-muted-foreground/25"
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200",
          value ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

// ── Field ──────────────────────────────────────────────────────────────────────
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ── Toggle Row ─────────────────────────────────────────────────────────────────
function ToggleRow({ label, desc, value, onChange }: { label: string; desc: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="p-3 sm:px-4 rounded-xl border border-border/60 bg-muted/[0.12] flex items-center justify-between gap-4 hover:border-sidebar/40 hover:bg-muted/[0.22] transition-all group shadow-2xs">
      <div className="min-w-0">
        <p className="text-xs sm:text-sm font-semibold text-foreground">{label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

const SETTINGS_KEY = "cog_general_settings";

interface GeneralSettings {
  appName: string;
  supportEmail: string;
  timezone: string;
  defaultLanguage: string;
  emailNotifications: boolean;
  maintenanceMode: boolean;
  auditLogging: boolean;
  weeklyPoolSize: string;
  restrictedDays: string;
  autoRollover: boolean;
}

const defaults: GeneralSettings = {
  appName: "Church of God Dasmariñas",
  supportEmail: "",
  timezone: "Asia/Manila",
  defaultLanguage: "English",
  emailNotifications: true,
  maintenanceMode: false,
  auditLogging: true,
  weeklyPoolSize: "1200",
  restrictedDays: "",
  autoRollover: false,
};

export default function GeneralSettingsPage() {
  const { canManageRoles, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GeneralSettings>(defaults);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) setSettings({ ...defaults, ...JSON.parse(stored) });
    } catch {}
  }, []);

  const set = <K extends keyof GeneralSettings>(key: K, value: GeneralSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      await new Promise(r => setTimeout(r, 400)); // simulate async
      toast({ title: "Settings saved", description: "Your changes have been applied." });
    } catch {
      toast({ variant: "destructive", title: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    try {
      const stored = localStorage.getItem(SETTINGS_KEY);
      setSettings(stored ? { ...defaults, ...JSON.parse(stored) } : defaults);
    } catch {
      setSettings(defaults);
    }
  };

  if (roleLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              General
            </h1>
            <p className="text-sm text-muted-foreground">
              Application name, system preferences and global defaults.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Application Settings */}
          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between h-full">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-headline text-foreground">Application Settings</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Core identity shown across the app.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 flex-1">
              <Field label="Application Name" hint="Displayed in the title bar.">
                <input
                  value={settings.appName}
                  onChange={e => set("appName", e.target.value)}
                  className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                />
              </Field>
              <Field label="Support Email">
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={e => set("supportEmail", e.target.value)}
                  placeholder="support@church.org"
                  className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                />
              </Field>
              <Field label="Timezone" hint="Used for all logs & schedules.">
                <input
                  value={settings.timezone}
                  onChange={e => set("timezone", e.target.value)}
                  className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                />
              </Field>
              <Field label="Default Language">
                <input
                  value={settings.defaultLanguage}
                  onChange={e => set("defaultLanguage", e.target.value)}
                  className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                />
              </Field>
            </div>
          </div>

          {/* System Preferences */}
          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between h-full">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                <SlidersHorizontal className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-headline text-foreground">System Preferences</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Behaviour of background tasks and notifications.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5 flex flex-col gap-2.5 flex-1 justify-center">
              <ToggleRow label="Email Notifications" desc="Send digests for important events." value={settings.emailNotifications} onChange={v => set("emailNotifications", v)} />
              <ToggleRow label="Maintenance mode" desc="Temporarily disable member access." value={settings.maintenanceMode} onChange={v => set("maintenanceMode", v)} />
              <ToggleRow label="Audit Logging" desc="Record every change to the audit trail." value={settings.auditLogging} onChange={v => set("auditLogging", v)} />
            </div>
          </div>

          {/* Theme & Display */}
          <div id="appearance" className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                <SunMoon className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-headline text-foreground">Theme & Display</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Global appearance and dark mode toggle.</p>
              </div>
            </div>
            <div className="p-5 sm:p-7 space-y-4">
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Color Theme</h3>
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* Meal Stub Allocation — full width */}
          <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between">
            <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                <Ticket className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-headline text-foreground">Meal Stub Allocation</h2>
                <p className="text-[11px] text-muted-foreground mt-0.5">Defaults applied when distributing stubs.</p>
              </div>
            </div>
            <div className="p-4 sm:p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Field label="Weekly Pool Size" hint="Total stubs available each week.">
                  <input
                    type="number"
                    value={settings.weeklyPoolSize}
                    onChange={e => set("weeklyPoolSize", e.target.value)}
                    className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                  />
                </Field>
                <Field label="Restricted Days">
                  <input
                    value={settings.restrictedDays}
                    onChange={e => set("restrictedDays", e.target.value)}
                    placeholder="e.g. Saturday"
                    className="h-9 text-xs sm:text-sm rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground w-full"
                  />
                </Field>
              </div>
              <ToggleRow label="Auto-rollover unused stubs" desc="Carry remaining stubs to next week." value={settings.autoRollover} onChange={v => set("autoRollover", v)} />
            </div>

            {/* Footer actions */}
            <div className="p-4 sm:p-5 flex items-center justify-end gap-3 border-t border-border/60 bg-muted/[0.08]">
              <button
                type="button"
                onClick={handleCancel}
                className="h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shadow-2xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="h-9 px-4 flex items-center gap-2 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
              >
                {saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                <span>Save Changes</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

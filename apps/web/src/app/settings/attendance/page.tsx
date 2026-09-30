"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Clock, ArrowLeft, Save, LoaderCircle, CheckCircle2, AlertTriangle, RotateCcw, ShieldCheck, Sparkles, Activity } from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAttendanceSettings } from "@/hooks/use-attendance-settings";
import { DEFAULT_ATTENDANCE_SETTINGS, type AttendanceShiftSettings } from "@/lib/attendance-config";
import { Button, Badge } from "@studio/ui";

function formatTime12(time24: string) {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    let h = parseInt(hStr, 10) || 0;
    const m = mStr || "00";
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

function addMinutesToTime(time24: string, minutesToAdd: number) {
    if (!time24) return "";
    const [hStr, mStr] = time24.split(":");
    const totalMins = (parseInt(hStr, 10) || 0) * 60 + (parseInt(mStr, 10) || 0) + minutesToAdd;
    let h = Math.floor(totalMins / 60) % 24;
    const m = String(totalMins % 60).padStart(2, "0");
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
}

export default function AttendanceSettingsPage() {
    const { canManageRoles, isLoading: roleLoading } = useUserRole();
    const { settings, isLoading, updateSettings, isSaving } = useAttendanceSettings();
    const { toast } = useToast();

    const [form, setForm] = useState<AttendanceShiftSettings>(DEFAULT_ATTENDANCE_SETTINGS);

    useEffect(() => {
        if (settings) {
            setForm({
                shiftStartTime: settings.shiftStartTime || "09:00",
                gracePeriodMinutes: typeof settings.gracePeriodMinutes === "number" ? settings.gracePeriodMinutes : 15,
                shiftEndTime: settings.shiftEndTime || "17:00",
                cooldownMinutes: typeof settings.cooldownMinutes === "number" ? settings.cooldownMinutes : 5,
            });
        }
    }, [settings]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await updateSettings(form);
            toast({
                title: "Settings Saved!",
                description: `Shift hours updated to ${formatTime12(form.shiftStartTime)} – ${formatTime12(form.shiftEndTime)}.`,
            });
        } catch {
            toast({
                variant: "destructive",
                title: "Save Failed",
                description: "Could not save attendance shift settings.",
            });
        }
    };

    const handleResetDefaults = () => {
        setForm(DEFAULT_ATTENDANCE_SETTINGS);
        toast({
            title: "Reset to Defaults",
            description: "Form values restored to 9:00 AM – 5:00 PM standard schedule. Click 'Save Changes' to apply.",
        });
    };

    if (roleLoading || isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center py-24">
                    <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                </div>
            </AppLayout>
        );
    }

    const graceLimitFormatted = addMinutesToTime(form.shiftStartTime, Number(form.gracePeriodMinutes) || 0);
    const startFormatted = formatTime12(form.shiftStartTime);
    const endFormatted = formatTime12(form.shiftEndTime);

    return (
        <AppLayout>
            <div className="space-y-6 pb-12 w-full">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
                            Attendance & Shift Schedule
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Configure work shift hours, grace period thresholds, and kiosk cooldown rules.
                        </p>
                    </div>
                    <Link
                        href="/settings"
                        className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Link>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Shift Config Form */}
                    <div className="lg:col-span-2 bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between h-full">
                        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                                    <Clock className="h-4 w-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-bold font-headline text-foreground">Shift & Clock Rules</h2>
                                    <p className="text-[11px] text-muted-foreground mt-0.5">Adjust shift parameters applied to all QR scanner kiosks.</p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetDefaults}
                                className="text-xs font-semibold text-foreground bg-white dark:bg-card hover:bg-muted/40 border border-border/60 rounded-xl flex items-center gap-1.5 h-8 px-3 shadow-2xs transition-colors cursor-pointer shrink-0"
                            >
                                <RotateCcw className="h-3.5 w-3.5 text-muted-foreground" /> Reset Defaults
                            </Button>
                        </div>

                        <div className="p-4 sm:p-5 space-y-4 flex-1">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Shift Start */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-primary" /> Shift Start Time (Time In)
                                    </label>
                                    <input
                                        type="time"
                                        value={form.shiftStartTime}
                                        onChange={(e) => setForm((prev) => ({ ...prev, shiftStartTime: e.target.value }))}
                                        required
                                        className="h-9 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 text-xs sm:text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Official start of work. Displays as <strong>{startFormatted}</strong>.
                                    </p>
                                </div>

                                {/* Grace Period */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Grace Period (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="120"
                                        value={form.gracePeriodMinutes}
                                        onChange={(e) => setForm((prev) => ({ ...prev, gracePeriodMinutes: parseInt(e.target.value, 10) || 0 }))}
                                        required
                                        className="h-9 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 text-xs sm:text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Late mark is waived until <strong>{graceLimitFormatted}</strong>.
                                    </p>
                                </div>

                                {/* Shift End */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5 text-blue-500" /> Shift End Time (Time Out)
                                    </label>
                                    <input
                                        type="time"
                                        value={form.shiftEndTime}
                                        onChange={(e) => setForm((prev) => ({ ...prev, shiftEndTime: e.target.value }))}
                                        required
                                        className="h-9 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 text-xs sm:text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Official dismissal time. Displays as <strong>{endFormatted}</strong>.
                                    </p>
                                </div>

                                {/* Cooldown Buffer */}
                                <div className="flex flex-col gap-1.5 min-w-0">
                                    <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Cooldown Buffer (Minutes)
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="60"
                                        value={form.cooldownMinutes}
                                        onChange={(e) => setForm((prev) => ({ ...prev, cooldownMinutes: parseInt(e.target.value, 10) || 1 }))}
                                        required
                                        className="h-9 w-full rounded-xl border border-border/70 bg-muted/[0.15] focus:bg-background px-3 text-xs sm:text-sm font-mono focus:border-sidebar/60 focus:ring-2 focus:ring-sidebar/20 transition-all text-foreground"
                                    />
                                    <p className="text-[11px] text-muted-foreground">
                                        Minimum wait between Time In and Time Out to prevent double scans.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="p-4 sm:p-5 flex items-center justify-end gap-3 border-t border-border/60 bg-muted/[0.08]">
                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="h-9 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-60"
                            >
                                {isSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                <span>{isSaving ? "Saving..." : "Save Changes"}</span>
                            </Button>
                        </div>
                    </div>

                    {/* Live Rule Summary Card */}
                    <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden flex flex-col justify-between h-full">
                        <div className="p-4 sm:p-5 border-b border-border/60 bg-muted/[0.12] flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                                <Activity className="h-4 w-4" />
                            </div>
                            <div>
                                <h2 className="text-sm font-bold font-headline text-foreground">Live Rule Summary</h2>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Automated kiosk scan evaluation logic</p>
                            </div>
                        </div>

                        <div className="p-4 sm:p-5 space-y-3.5 flex-1 flex flex-col justify-between">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                How the automatic QR scanner kiosk will evaluate scans with the current configuration:
                            </p>

                            <div className="space-y-3 text-xs flex-1">
                                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 flex items-start gap-2.5 shadow-2xs">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-emerald-900 dark:text-emerald-200">Time In — On Time</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            Scans on or before <strong>{graceLimitFormatted}</strong> ({form.gracePeriodMinutes}m grace).
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex items-start gap-2.5 shadow-2xs">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-900 dark:text-amber-200">Time In — Late</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            Scans after <strong>{graceLimitFormatted}</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/60 flex items-start gap-2.5 shadow-2xs">
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-blue-900 dark:text-blue-200">Time Out — Shift Completed</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            Scans <strong>{endFormatted}</strong> onwards.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 flex items-start gap-2.5 shadow-2xs">
                                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-amber-900 dark:text-amber-200">Time Out — Undertime</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            Scans before <strong>{endFormatted}</strong>.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-3 rounded-xl bg-muted/60 border border-border/50 flex items-start gap-2.5 shadow-2xs">
                                    <ShieldCheck className="h-4 w-4 text-sidebar dark:text-sky-400 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-bold text-foreground">Anti-Double Scan Cooldown</p>
                                        <p className="text-muted-foreground mt-0.5">
                                            Protects for <strong>{form.cooldownMinutes} minutes</strong> after Time In before allowing Time Out.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}

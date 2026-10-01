"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useAuthStore } from "@studio/store";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@studio/ui";
import {
  QrCode,
  RefreshCw,
  Printer,
  Download,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  User,
  Building,
  CalendarDays,
  UtensilsCrossed,
  Key,
  Info,
  Shield,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/layout/app-layout";
import { useUserRole } from "@/hooks/use-user-role";
import { useMinistries } from "@/hooks/use-ministries";
import { updateWorker as updateWorkerSql } from "@/actions/db";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function MyQRCodePage() {
  const { user } = useAuthStore();
  const { workerProfile, allRoles, isSuperAdmin, isLoading: roleLoading } = useUserRole();
  const { ministries } = useMinistries();
  const { toast } = useToast();

  const isUUID = (str?: string | null) =>
    str ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim()) : false;

  const roleName = isSuperAdmin
    ? "Administrator"
    : (workerProfile as any)?.role?.name ||
      (workerProfile as any)?.roles?.[0]?.role?.name ||
      allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name ||
      (!isUUID(workerProfile?.roleId) && workerProfile?.roleId) ||
      (workerProfile as any)?.role ||
      "General Member";

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isConfirmRegenOpen, setIsConfirmRegenOpen] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);

  const activeUserId = workerProfile?.id || user?.uid || "";
  const activeToken =
    localToken ?? workerProfile?.qrToken ?? activeUserId ?? "";
  const combinedData = activeToken
    ? `COG_USER:${activeUserId}:${activeToken}`
    : "";
  const combinedQrUrl = combinedData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(
        combinedData
      )}`
    : "";

  const userMinistry = ministries.find(
    (m) =>
      m.id === workerProfile?.majorMinistryId ||
      m.id === workerProfile?.minorMinistryId
  );

  const refreshCodes = async () => {
    if (!workerProfile?.id) return;
    setIsRegenerating(true);
    try {
      const newToken =
        Math.random().toString(36).slice(2) + Date.now().toString(36);

      await (updateWorkerSql as any)(workerProfile.id, { qrToken: newToken });

      setLocalToken(newToken);
      setIsConfirmRegenOpen(false);
      toast({
        title: "QR Code regenerated",
        description: "Your identification token has been securely updated.",
      });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Regeneration failed",
        description: "Could not update your QR token. Please try again.",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    if (!combinedQrUrl) return;
    try {
      const response = await fetch(combinedQrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `COG-Pass-${workerProfile?.workerId || "my-qr"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({
        title: "QR Code Downloaded",
        description: "Your digital pass QR code has been saved as an image.",
      });
    } catch {
      window.open(combinedQrUrl, "_blank");
    }
  };

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section (Room Reservations Style) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-gray-900 dark:text-white">
              My QR Code
            </h1>
            <p className="text-sm text-muted-foreground">
              Official digital identification pass for attendance logging, meal stub claims, and venue access.
            </p>
          </div>

          {/* Top Actions Controls */}
          <div className="flex flex-wrap items-center gap-2.5 print:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span>Print Pass</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
              <span>Download QR</span>
            </Button>
          </div>
        </div>

        {/* Main Card Container with Entrance Animation */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 md:p-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Main Grid: Digital Pass & Credential Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Digital Pass Badge Card */}
            <div className="lg:col-span-6 flex justify-center w-full">
              <div className="w-full max-w-md bg-slate-50/70 dark:bg-muted/20 border border-slate-200/80 dark:border-border/80 rounded-2xl p-6 sm:p-7 text-center space-y-5 shadow-xs relative overflow-hidden">
                {/* Decorative Subtle Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sidebar via-primary to-sidebar" />

                {/* Identification Header */}
                <div className="space-y-1.5 pt-1">
                  <div className="bg-primary/10 dark:bg-primary/20 text-primary p-2.5 rounded-xl mx-auto w-fit border border-primary/20 shadow-xs flex items-center justify-center">
                    <QrCode className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-headline font-bold text-gray-900 dark:text-white tracking-tight">
                      COG App Identification
                    </h2>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mt-0.5">
                      Church Operations & Governance
                    </p>
                  </div>
                </div>

                {/* QR Code Container */}
                <div className="flex justify-center">
                  {combinedQrUrl ? (
                    <div className="bg-white dark:bg-card p-4 sm:p-5 rounded-2xl shadow-xs border border-slate-200/90 dark:border-border inline-block overflow-hidden max-w-[270px] sm:max-w-[300px] w-full aspect-square">
                      <Image
                        key={activeToken}
                        src={combinedQrUrl}
                        alt="Unified Digital QR Pass"
                        width={300}
                        height={300}
                        unoptimized
                        className="rounded-lg w-full h-full object-contain"
                      />
                    </div>
                  ) : (
                    <div className="h-60 w-60 flex items-center justify-center">
                      <RefreshCw className="h-9 w-9 animate-spin text-primary/40" />
                    </div>
                  )}
                </div>

                {/* User Profile Summary */}
                <div className="space-y-2 border-t border-slate-200/70 dark:border-border/60 pt-4">
                  <h3 className="text-lg font-bold font-headline text-gray-900 dark:text-white">
                    {workerProfile?.firstName || user?.name || "System"}{" "}
                    {workerProfile?.lastName || "User"}
                  </h3>
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Badge className="bg-sidebar text-white hover:bg-sidebar/90 text-[11px] font-semibold px-2.5 py-0.5 rounded-md capitalize">
                      {roleName}
                    </Badge>
                    {workerProfile?.workerId && (
                      <span className="text-xs font-mono text-muted-foreground bg-white dark:bg-card border border-slate-200/80 dark:border-border px-2 py-0.5 rounded-md shadow-2xs">
                        {workerProfile.workerId}
                      </span>
                    )}
                  </div>

                  {/* Regenerate Button directly below role badge */}
                  <div className="pt-1.5 flex justify-center print:hidden">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setIsConfirmRegenOpen(true)}
                      disabled={isRegenerating}
                      className="h-8 px-4 text-xs font-semibold rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    >
                      <RefreshCw
                        className={cn(
                          "h-3.5 w-3.5",
                          isRegenerating && "animate-spin"
                        )}
                      />
                      <span>Regenerate QR</span>
                    </Button>
                  </div>
                </div>

                {/* Authorized Ecosystem Pills */}
                <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-1">
                  <div className="p-2.5 bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border/60 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-2xs">
                    <span>📅</span> Attendance
                  </div>
                  <div className="p-2.5 bg-white dark:bg-card rounded-xl border border-slate-200/80 dark:border-border/60 flex items-center justify-center gap-1.5 text-slate-700 dark:text-slate-300 shadow-2xs">
                    <span>🍽️</span> Meal Stubs
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Information Cards & Credentials */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <h3 className="text-base font-bold font-headline text-foreground">
                    Credential Overview
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Your unique credentials and assignments recognized across the system.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0 -mt-0.5 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Active Pass
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-50/70 dark:bg-muted/30 p-4 rounded-xl border border-slate-200/70 dark:border-border/60 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>Full Name</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {workerProfile?.firstName || user?.name || "System"}{" "}
                    {workerProfile?.lastName || "User"}
                  </p>
                </div>

                <div className="bg-slate-50/70 dark:bg-muted/30 p-4 rounded-xl border border-slate-200/70 dark:border-border/60 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span>Assigned Role</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {roleName}
                  </p>
                </div>

                <div className="bg-slate-50/70 dark:bg-muted/30 p-4 rounded-xl border border-slate-200/70 dark:border-border/60 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                    <Building className="h-3.5 w-3.5 text-primary" />
                    <span>Ministry / Department</span>
                  </div>
                  <p className="text-sm font-semibold text-foreground">
                    {userMinistry?.name || "Church Administration"}
                  </p>
                </div>

                <div className="bg-slate-50/70 dark:bg-muted/30 p-4 rounded-xl border border-slate-200/70 dark:border-border/60 space-y-1 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
                    <Key className="h-3.5 w-3.5 text-primary" />
                    <span>Worker Identifier</span>
                  </div>
                  <p className="text-sm font-mono font-semibold text-foreground">
                    {workerProfile?.workerId || (workerProfile?.biometricsId ? `W-${String(workerProfile.biometricsId).padStart(4, "0")}` : "Not Assigned")}
                  </p>
                </div>
              </div>

              {/* Info Callout Box (Room Reservations Style) */}
              <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-xl border border-blue-200/70 dark:border-blue-900/40 space-y-1.5 shadow-2xs">
                <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold text-xs">
                  <Info className="h-3.5 w-3.5 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>How to use your QR code</span>
                </div>
                <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300/90">
                  Present this QR code on your mobile screen or printed pass when checking into events, claiming meal stubs, or verifying your identity at church service desks.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center text-xs text-muted-foreground opacity-60 uppercase tracking-widest pt-2 font-semibold">
          Property of Church Operations and Governance &bull; Official Digital Identification
        </div>
      </div>

      {/* Confirmation Dialog for Regenerating QR Code */}
      <Dialog open={isConfirmRegenOpen} onOpenChange={setIsConfirmRegenOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center shadow-card-dark border border-border/60">
          {/* Top Circular Badge Icon */}
          <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 bg-primary/10 text-primary border border-primary/20 shadow-2xs">
            <RefreshCw className={cn("h-6 w-6 text-primary", isRegenerating && "animate-spin")} />
          </div>

          <DialogHeader className="space-y-1">
            <DialogTitle className="text-base font-bold text-center text-foreground font-headline">
              Regenerate QR Identification?
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-muted-foreground mt-1 leading-relaxed">
              Regenerating your QR token will immediately invalidate your current QR code and any previously printed identification cards. You will need to use or print the new QR code.
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <DialogFooter className="flex flex-row gap-2.5 sm:justify-center mt-5">
            <Button
              type="button"
              variant="outline"
              disabled={isRegenerating}
              className="flex-1 rounded-xl text-xs h-9 font-semibold cursor-pointer border-slate-200 dark:border-border hover:bg-slate-50 dark:hover:bg-muted text-foreground shadow-2xs"
              onClick={() => setIsConfirmRegenOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isRegenerating}
              className="flex-1 rounded-xl text-xs h-9 font-bold cursor-pointer bg-sidebar hover:bg-sidebar/90 text-white shadow-xs transition-all active:scale-[0.99] inline-flex items-center justify-center gap-1.5"
              onClick={refreshCodes}
            >
              {isRegenerating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Yes, Regenerate</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Stylesheet */}
      <style jsx global>{`
        @media print {
          .sidebar-container,
          header,
          nav,
          button,
          .print\\:hidden {
            display: none !important;
          }
          body {
            background-color: white !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          .animate-in {
            animation: none !important;
          }
        }
      `}</style>
    </AppLayout>
  );
}


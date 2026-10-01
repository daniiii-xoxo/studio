"use client";

import React, { useMemo, useState, useCallback, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import {
  LoaderCircle, ShieldAlert, Search, Download, Upload,
  RefreshCw, CheckCircle2, Clock, QrCode, SlidersHorizontal,
  LogIn, LogOut, MoreHorizontal, Users, XCircle, AlertCircle, RotateCcw, X, ScanLine,
} from "lucide-react";
import { useAuthStore } from "@studio/store";
import { format, differenceInMinutes, startOfWeek } from "date-fns";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAttendance } from "@/hooks/use-attendance";
import { useWorkers } from "@/hooks/use-workers";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import {
  Card, CardHeader, CardTitle, CardDescription,
  DropdownMenu, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@studio/ui";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="w-7 h-7 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
      {init}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const lower = role.toLowerCase();
  if (lower.includes("admin"))
    return <span className="inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 whitespace-nowrap">{role}</span>;
  if (lower.includes("head") || lower.includes("pastor") || lower.includes("ministry"))
    return <span className="inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">{role}</span>;
  return <span className="inline-flex px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300 border border-slate-200 dark:border-border whitespace-nowrap">{role}</span>;
}

function StatCard({ label, value, sub, icon: Icon, accentColor, iconClass, iconBgClass }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; accentColor: string;
  iconClass: string; iconBgClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-border shadow-xs bg-white dark:bg-card h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-3">
              <span className="text-4xl font-black tracking-tight font-headline text-foreground leading-none">{value}</span>
            </div>
            {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function pairSessions(records: any[]) {
  const sorted = [...records].sort((a, b) => {
    const da = a.time instanceof Date ? a.time : new Date(a.time);
    const db = b.time instanceof Date ? b.time : new Date(b.time);
    return da.getTime() - db.getTime();
  });
  const sessions: { date: Date; timeIn: Date; timeOut: Date | null; totalMinutes: number | null; isLate: boolean }[] = [];
  const ins: Date[] = [];
  for (const r of sorted) {
    const t = r.time instanceof Date ? r.time : new Date(r.time);
    if (r.type === "Clock In") {
      ins.push(t);
    } else if (r.type === "Clock Out" && ins.length > 0) {
      const tin = ins.shift()!;
      sessions.push({ date: tin, timeIn: tin, timeOut: t, totalMinutes: differenceInMinutes(t, tin), isLate: tin.getHours() > 8 || (tin.getHours() === 8 && tin.getMinutes() > 30) });
    }
  }
  for (const tin of ins) {
    sessions.push({ date: tin, timeIn: tin, timeOut: null, totalMinutes: null, isLate: tin.getHours() > 8 || (tin.getHours() === 8 && tin.getMinutes() > 30) });
  }
  return sessions.sort((a, b) => b.date.getTime() - a.date.getTime());
}

function formatHours(mins: number | null) {
  if (mins === null) return "—";
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m > 0 ? `${h}.${Math.round((m / 60) * 10)}h` : `${h}h`;
}

function StatusPill({ isLate, hasOut }: { isLate: boolean; hasOut: boolean }) {
  if (!hasOut) return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" /> Active</span>;
  if (isLate) return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" /> Late</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Present</span>;
}

function AttendanceStatusBadge({ status }: { status: "timed-in" | "timed-out" | "not-yet" }) {
  if (status === "timed-in") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Timed In</span>;
  if (status === "timed-out") return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300 border border-slate-200 dark:border-border"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Timed Out</span>;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Not Yet Timed In</span>;
}

// ── Main Content ──────────────────────────────────────────────────────────────
function AttendanceContent() {
  const { user } = useAuthStore();
  const { canViewAttendance, workerProfile, isLoading: isRoleLoading, isMinistryHead, canManageWorkers, canOperateScanner } = useUserRole();
  const { toast } = useToast();
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [localToken, setLocalToken] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "personal") as "personal" | "manual" | "records";

  // Manual tab state
  const [assignSearch, setAssignSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Records tab state
  const [recordsSearch, setRecordsSearch] = useState("");
  const [recordsMinistryFilter, setRecordsMinistryFilter] = useState("all");
  const [recordsRoleFilter, setRecordsRoleFilter] = useState("all");
  const [recordsStatusFilter, setRecordsStatusFilter] = useState("all");
  const [recordsRange, setRecordsRange] = useState<"today" | "yesterday" | "this-week" | "this-month" | "all-time">("today");

  const isAssigner = isMinistryHead || canManageWorkers || canOperateScanner;

  const { workers: allWorkers } = useWorkers({ enabled: isAssigner, limit: 999999 });
  const { createAttendanceRecord } = useAttendance({ enabled: false });
  const { roles } = useRoles();
  const { ministries } = useMinistries();

  const todayStart = useMemo(() => new Date(new Date().setHours(0, 0, 0, 0)), []);
  const { createMealStub, mealStubs: assignedStubs } = useMealStubs({ dateFrom: todayStart, enabled: isAssigner });
  const { updateWorker: updateWorkerSql } = useWorkers();

  const { attendanceRecords: todayAttendance } = useAttendance(
    isAssigner ? { dateFrom: todayStart } : { enabled: false }
  );

  const weekStart = useMemo(() => startOfWeek(new Date(), { weekStartsOn: 1 }), []);
  const { attendanceRecords: allAttendance, isLoading: attendanceLoading } = useAttendance(
    workerProfile?.id ? { workerProfileId: workerProfile.id, dateFrom: weekStart } : { enabled: false }
  );

  // Records tab date range
  const recordsDateFrom = useMemo(() => {
    const now = new Date();
    if (recordsRange === "today") { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }
    if (recordsRange === "yesterday") { const d = new Date(); d.setDate(d.getDate() - 1); d.setHours(0, 0, 0, 0); return d; }
    if (recordsRange === "this-week") return startOfWeek(new Date(), { weekStartsOn: 1 });
    if (recordsRange === "this-month") { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; }
    return undefined;
  }, [recordsRange]);

  const { attendanceRecords: allRecords, isLoading: recordsLoading } = useAttendance(
    activeTab === "records" && isAssigner ? { dateFrom: recordsDateFrom } : { enabled: false }
  );

  const isLoading = attendanceLoading || isRoleLoading;

  const activeToken = localToken ?? workerProfile?.qrToken ?? workerProfile?.id ?? "";
  const qrData = workerProfile?.id ? `COG_USER:${workerProfile.id}:${activeToken}` : "";
  const userQrCodeUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=230x230&data=${encodeURIComponent(qrData)}&bgcolor=ffffff&color=000000&margin=8`
    : "";

  const handleRegenerateQR = useCallback(async () => {
    if (!workerProfile?.id) return;
    setIsRegenerating(true);
    try {
      const newToken = generateToken();
      await updateWorkerSql({ id: workerProfile.id, data: { qrToken: newToken } });
      setLocalToken(newToken);
      toast({ title: "QR Code Regenerated", description: "Your old QR is now invalid." });
    } catch { toast({ variant: "destructive", title: "Failed to regenerate QR" }); }
    finally { setIsRegenerating(false); }
  }, [workerProfile?.id, updateWorkerSql, toast]);

  const sessions = useMemo(() => pairSessions(allAttendance || []), [allAttendance]);
  const presentCount = sessions.filter(s => s.timeOut !== null).length;
  const lateCount = sessions.filter(s => s.isLate && s.timeOut !== null).length;

  const workerStatusMap = useMemo(() => {
    const map: Record<string, { status: "timed-in" | "timed-out" | "not-yet"; lastTime: Date | null; lastType: string | null }> = {};
    if (!todayAttendance) return map;
    const sorted = [...todayAttendance].sort((a, b) => {
      const da = a.time instanceof Date ? a.time : new Date(a.time);
      const db = b.time instanceof Date ? b.time : new Date(b.time);
      return da.getTime() - db.getTime();
    });
    for (const r of sorted) {
      const t = r.time instanceof Date ? r.time : new Date(r.time);
      map[r.workerProfileId] = { status: r.type === "Clock In" ? "timed-in" : "timed-out", lastTime: t, lastType: r.type };
    }
    return map;
  }, [todayAttendance]);

  const manualStatusCounts = useMemo(() => {
    let timedIn = 0, timedOut = 0, notYet = 0;
    for (const w of allWorkers || []) {
      const st = workerStatusMap[w.id]?.status ?? "not-yet";
      if (st === "timed-in") timedIn++;
      else if (st === "timed-out") timedOut++;
      else notYet++;
    }
    return {
      all: (allWorkers || []).length,
      "timed-in": timedIn,
      "timed-out": timedOut,
      "not-yet": notYet,
    };
  }, [allWorkers, workerStatusMap]);

  const fmtId = (id: string | null | undefined) => {
    if (!id) return "—";
    const n = parseInt(id, 10);
    return isNaN(n) ? id : `COG-${String(n).padStart(4, "0")}`;
  };

  const getRoleName = (w: any) => {
    if (w.roles?.length > 0) return w.roles[0]?.role?.name || w.roles[0]?.roleId || "Worker";
    return (roles as any[]).find(r => r.id === w.roleId)?.name || "Worker";
  };

  const filteredWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      const wId = fmtId(w.workerId).toLowerCase();
      const q = assignSearch.trim().toLowerCase();
      if (q && !name.includes(q) && !wId.includes(q)) return false;
      if (ministryFilter !== "all" && w.majorMinistryId !== ministryFilter) return false;
      if (roleFilter !== "all") {
        const rn = getRoleName(w).toLowerCase();
        if (!rn.includes(roleFilter.toLowerCase())) return false;
      }
      const ws = workerStatusMap[w.id];
      const cs = ws?.status ?? "not-yet";
      if (statusFilter !== "all" && cs !== statusFilter) return false;
      return true;
    });
  }, [allWorkers, assignSearch, ministryFilter, roleFilter, statusFilter, workerStatusMap]);

  // Records tab: build rows
  const recordRows = useMemo(() => {
    const workerRecordsMap: Record<string, any[]> = {};
    for (const r of (allRecords || [])) {
      if (!workerRecordsMap[r.workerProfileId]) workerRecordsMap[r.workerProfileId] = [];
      workerRecordsMap[r.workerProfileId].push(r);
    }
    const rows: { worker: any; date: Date; timeIn: Date | null; timeOut: Date | null; hours: number | null; status: "present" | "late" | "absent" | "incomplete" }[] = [];
    for (const [wId, recs] of Object.entries(workerRecordsMap)) {
      const w = allWorkers?.find(x => x.id === wId);
      if (!w) continue;
      const dayMap: Record<string, any[]> = {};
      for (const r of recs) {
        const t = r.time instanceof Date ? r.time : new Date(r.time);
        const day = format(t, "yyyy-MM-dd");
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push({ ...r, _t: t });
      }
      for (const [day, dayRecs] of Object.entries(dayMap)) {
        const sorted = dayRecs.sort((a, b) => a._t.getTime() - b._t.getTime());
        const inRec = sorted.find(r => r.type === "Clock In");
        const outRec = [...sorted].reverse().find(r => r.type === "Clock Out");
        const timeIn = inRec ? inRec._t as Date : null;
        const timeOut = outRec ? outRec._t as Date : null;
        const hours = timeIn && timeOut ? differenceInMinutes(timeOut, timeIn) : null;
        let status: "present" | "late" | "absent" | "incomplete" = "absent";
        if (!timeIn) status = "absent";
        else if (!timeOut) status = "incomplete";
        else if (timeIn.getHours() > 8 || (timeIn.getHours() === 8 && timeIn.getMinutes() > 30)) status = "late";
        else status = "present";
        rows.push({ worker: w, date: new Date(day), timeIn, timeOut, hours, status });
      }
    }
    return rows.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [allRecords, allWorkers]);

  const baseFilteredRecordRows = useMemo(() => {
    return recordRows.filter(r => {
      const name = `${r.worker.firstName} ${r.worker.lastName}`.toLowerCase();
      const wId = fmtId(r.worker.workerId).toLowerCase();
      const q = recordsSearch.trim().toLowerCase();
      if (q && !name.includes(q) && !wId.includes(q)) return false;
      if (recordsMinistryFilter !== "all" && r.worker.majorMinistryId !== recordsMinistryFilter) return false;
      if (recordsRoleFilter !== "all") {
        const rn = getRoleName(r.worker).toLowerCase();
        if (!rn.includes(recordsRoleFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [recordRows, recordsSearch, recordsMinistryFilter, recordsRoleFilter]);

  const recordStats = useMemo(() => ({
    total: baseFilteredRecordRows.length,
    present: baseFilteredRecordRows.filter(r => r.status === "present").length,
    late: baseFilteredRecordRows.filter(r => r.status === "late").length,
    absent: baseFilteredRecordRows.filter(r => r.status === "absent").length,
    incomplete: baseFilteredRecordRows.filter(r => r.status === "incomplete").length,
  }), [baseFilteredRecordRows]);

  const filteredRecordRows = useMemo(() => {
    if (recordsStatusFilter === "all") return baseFilteredRecordRows;
    return baseFilteredRecordRows.filter(r => r.status === recordsStatusFilter);
  }, [baseFilteredRecordRows, recordsStatusFilter]);

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canViewAttendance) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">Scan, monitor, and manage attendance across every ministry — in one workforce command center.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0 sm:self-end">
            <Link href="/attendance/scanner">
              <button className="h-10 px-4 flex items-center gap-2 rounded-2xl border border-border/80 bg-white dark:bg-card hover:bg-muted/40 text-foreground text-xs font-bold shadow-xs transition-colors cursor-pointer">
                <ScanLine className="h-4 w-4 text-primary" /> Scanner Kiosk
              </button>
            </Link>
            {(activeTab === "manual" || activeTab === "records") && (
              <button className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer">
                <Download className="h-4 w-4 text-white" /> Export
              </button>
            )}
          </div>
        </div>

        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* ── Personal Log ── */}
        {activeTab === "personal" && (
          <div className="flex flex-col gap-6 w-full">
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="PRESENT COUNT"
                value={presentCount}
                sub="this week"
                icon={CheckCircle2}
                accentColor="bg-emerald-500"
                iconClass="text-emerald-600"
                iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
              <StatCard
                label="LATE COUNT"
                value={lateCount}
                sub="this week"
                icon={Clock}
                accentColor="bg-amber-500"
                iconClass="text-amber-600"
                iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              />
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
              <div className="space-y-0.5">
                <h3 className="text-base font-bold text-foreground font-headline">This week&apos;s personal log</h3>
                <p className="text-xs text-muted-foreground">Recent attendance history.</p>
              </div>

              {/* Inner Table Container */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col">

                {/* Mobile card view */}
                <div className="md:hidden divide-y divide-border/30">
                  {sessions.length === 0 ? (
                    <div className="py-14 text-center text-xs font-medium text-muted-foreground">No records this week.</div>
                  ) : sessions.map((s, i) => (
                    <div key={i} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground">{format(s.date, "EEE, MMM d, yyyy")}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          In: <strong className="text-foreground">{format(s.timeIn, "h:mm a")}</strong>
                          {" · "}
                          Out: <strong className="text-foreground">{s.timeOut ? format(s.timeOut, "h:mm a") : "—"}</strong>
                          {" · "}
                          {formatHours(s.totalMinutes)}
                        </p>
                      </div>
                      <StatusPill isLate={s.isLate} hasOut={s.timeOut !== null} />
                    </div>
                  ))}
                </div>

                {/* Desktop table view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-sidebar">
                      <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                        <th className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[25%]">DATE</th>
                        <th className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[20%]">TIME IN</th>
                        <th className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[20%]">TIME OUT</th>
                        <th className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[18%]">TOTAL HOURS</th>
                        <th className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-center w-[17%]">STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-14 text-center text-xs font-medium text-muted-foreground">No records this week.</td>
                        </tr>
                      ) : (
                        sessions.map((s, i) => (
                          <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-gray-50/60 dark:hover:bg-muted/30 transition-colors">
                            <td className="py-4 px-6 font-bold text-xs text-foreground whitespace-nowrap align-middle">{format(s.date, "EEE, MMM d, yyyy")}</td>
                            <td className="py-4 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap align-middle">{format(s.timeIn, "h:mm a")}</td>
                            <td className="py-4 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap align-middle">{s.timeOut ? format(s.timeOut, "h:mm a") : "—"}</td>
                            <td className="py-4 px-6 text-xs text-muted-foreground font-medium whitespace-nowrap align-middle">{formatHours(s.totalMinutes)}</td>
                            <td className="py-4 px-6 text-center align-middle whitespace-nowrap"><StatusPill isLate={s.isLate} hasOut={s.timeOut !== null} /></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Manual Attendance ── */}
        {activeTab === "manual" && isAssigner && (
          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
            {/* Top Controls Row */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Left: Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search ID, worker name..."
                  value={assignSearch}
                  onChange={e => setAssignSearch(e.target.value)}
                  className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
                />
                {assignSearch && (
                  <button
                    type="button"
                    onClick={() => setAssignSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right: Ministries, Roles, and Status Filter Tabs */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <Select value={ministryFilter} onValueChange={setMinistryFilter}>
                  <SelectTrigger className="h-10 w-[145px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                    <SelectValue placeholder="All Ministries" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                    {(ministries as any[]).map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="h-10 w-[130px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Roles</SelectItem>
                    {(roles as any[]).map(r => (
                      <SelectItem key={r.id} value={r.name} className="text-xs font-medium cursor-pointer">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status Filter Dropdown */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                    {[
                      { id: "all", label: "All Statuses", count: manualStatusCounts.all },
                      { id: "timed-in", label: "Timed In", count: manualStatusCounts["timed-in"] },
                      { id: "timed-out", label: "Timed Out", count: manualStatusCounts["timed-out"] },
                      { id: "not-yet", label: "Not Yet Timed In", count: manualStatusCounts["not-yet"] },
                    ].map(tab => (
                      <SelectItem key={tab.id} value={tab.id} className="text-xs font-medium cursor-pointer">
                        {tab.label} ({tab.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table */}
            <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">

              {/* ── Mobile card view ── */}
              <div className="md:hidden divide-y divide-border/30">
                {filteredWorkers.length === 0 ? (
                  <div className="py-14 text-center text-xs font-medium text-muted-foreground">No workers found.</div>
                ) : filteredWorkers.map(w => {
                  const ws = workerStatusMap[w.id];
                  const currentStatus = ws?.status ?? "not-yet";
                  const lastTime = ws?.lastTime ? format(ws.lastTime, "h:mm a") : null;
                  const lastType = ws?.lastType;
                  const ministry = (ministries as any[]).find(m => m.id === w.majorMinistryId);
                  const roleName = getRoleName(w);
                  return (
                    <div key={w.id} className="p-4 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <WorkerInitials name={`${w.firstName} ${w.lastName}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-foreground leading-tight truncate">{w.firstName} {w.lastName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{ministry?.name || "—"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <RoleBadge role={roleName} />
                          <AttendanceStatusBadge status={currentStatus} />
                          {lastTime && (
                            <span className="text-[10px] text-muted-foreground font-medium">
                              {lastType === "Clock In" ? "In" : "Out"} · {lastTime}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await createAttendanceRecord({ workerProfileId: w.id, type: "Clock In" });
                            const hasStub = assignedStubs?.some((s: any) => { const sd = s.date instanceof Date ? s.date : new Date(s.date); return s.workerId === w.id && sd >= todayStart; });
                            if (!hasStub) { try { await createMealStub({ workerId: w.id, workerName: `${w.firstName} ${w.lastName}`, status: "Issued", assignedBy: workerProfile?.id || user?.id, assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || "System"), stubType: "daily" }); } catch {} }
                            toast({ title: "Timed In", description: `${w.firstName} ${w.lastName}` });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                        >
                          <LogIn className="h-3 w-3" /> In
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await createAttendanceRecord({ workerProfileId: w.id, type: "Clock Out" });
                            toast({ title: "Timed Out", description: `${w.firstName} ${w.lastName}` });
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"
                        >
                          <LogOut className="h-3 w-3" /> Out
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Desktop table view ── */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-sidebar">
                    <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                      {["Worker", "Worker ID", "Role", "Ministry", "Current Status", "Last Activity", "Actions"].map(h => (
                        <th key={h} className={cn("px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap", h === "Actions" ? "text-center w-20" : "text-left")}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredWorkers.length === 0 ? (
                      <tr><td colSpan={7} className="py-14 text-center text-xs font-medium text-muted-foreground">No workers found.</td></tr>
                    ) : filteredWorkers.map(w => {
                      const ws = workerStatusMap[w.id];
                      const currentStatus = ws?.status ?? "not-yet";
                      const lastTime = ws?.lastTime ? format(ws.lastTime, "h:mm a") : null;
                      const lastType = ws?.lastType;
                      const ministry = (ministries as any[]).find(m => m.id === w.majorMinistryId);
                      const roleName = getRoleName(w);
                      return (
                        <tr key={w.id} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5 align-middle">
                            <div className="flex items-center gap-2.5">
                              <WorkerInitials name={`${w.firstName} ${w.lastName}`} />
                              <span className="text-xs font-semibold text-foreground whitespace-nowrap">{w.firstName} {w.lastName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground align-middle whitespace-nowrap">{fmtId(w.workerId)}</td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                            <RoleBadge role={roleName} />
                          </td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{ministry?.name || "—"}</td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap"><AttendanceStatusBadge status={currentStatus} /></td>
                          <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">
                            {lastTime ? `${lastType === "Clock In" ? "In" : "Out"} · ${lastTime}` : "——"}
                          </td>
                          <td className="px-4 py-3.5 align-middle whitespace-nowrap text-center">
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button
                                    type="button"
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border border-border bg-popover">
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      await createAttendanceRecord({ workerProfileId: w.id, type: "Clock In" });
                                      const hasStub = assignedStubs?.some((s: any) => { const sd = s.date instanceof Date ? s.date : new Date(s.date); return s.workerId === w.id && sd >= todayStart; });
                                      if (!hasStub) { try { await createMealStub({ workerId: w.id, workerName: `${w.firstName} ${w.lastName}`, status: "Issued", assignedBy: workerProfile?.id || user?.id, assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || "System"), stubType: "daily" }); } catch {} }
                                      toast({ title: "Timed In", description: `${w.firstName} ${w.lastName}` });
                                    }}
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <LogIn className="h-3.5 w-3.5 mr-2" /> Time In
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={async () => {
                                      await createAttendanceRecord({ workerProfileId: w.id, type: "Clock Out" });
                                      toast({ title: "Timed Out", description: `${w.firstName} ${w.lastName}` });
                                    }}
                                    className="cursor-pointer text-xs font-medium"
                                  >
                                    <LogOut className="h-3.5 w-3.5 mr-2" /> Time Out
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── Attendance Records ── */}
        {activeTab === "records" && isAssigner && (
          <div className="flex flex-col gap-6">
            {/* Stat Cards with top accent stripes (matching Workers page) */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <StatCard
                label="TOTAL TODAY"
                value={recordStats.total}
                sub="records"
                icon={Users}
                accentColor="bg-sidebar"
                iconClass="text-sidebar"
                iconBgClass="bg-sidebar/10"
              />
              <StatCard
                label="PRESENT"
                value={recordStats.present}
                sub="on time"
                icon={CheckCircle2}
                accentColor="bg-emerald-500"
                iconClass="text-emerald-600"
                iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
              <StatCard
                label="LATE"
                value={recordStats.late}
                sub="after 8:30"
                icon={Clock}
                accentColor="bg-amber-500"
                iconClass="text-amber-600"
                iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              />
              <StatCard
                label="ABSENT"
                value={recordStats.absent}
                sub="no time in"
                icon={XCircle}
                accentColor="bg-red-500"
                iconClass="text-red-600"
                iconBgClass="bg-red-50 dark:bg-red-950/40"
              />
              <StatCard
                label="INCOMPLETE"
                value={recordStats.incomplete}
                sub="missing time out"
                icon={AlertCircle}
                accentColor="bg-blue-500"
                iconClass="text-blue-600"
                iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              />
            </div>

            {/* Main Unified Table & Controls Container (Matching Room Reservations & Workers) */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
              {/* Top Controls Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Search */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search ID, worker name..."
                    value={recordsSearch}
                    onChange={e => setRecordsSearch(e.target.value)}
                    className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
                  />
                  {recordsSearch && (
                    <button
                      type="button"
                      onClick={() => setRecordsSearch("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Right Controls: Ministry + Role + Range + Status Dropdown */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Ministry */}
                  <Select value={recordsMinistryFilter} onValueChange={setRecordsMinistryFilter}>
                    <SelectTrigger className="h-10 w-[140px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                      <SelectValue placeholder="All Ministries" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                      <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                      {(ministries as any[]).map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Role */}
                  <Select value={recordsRoleFilter} onValueChange={setRecordsRoleFilter}>
                    <SelectTrigger className="h-10 w-[125px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                      <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Roles</SelectItem>
                      {(roles as any[]).map(r => (
                        <SelectItem key={r.id} value={r.name} className="text-xs font-medium cursor-pointer">{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Range */}
                  <Select value={recordsRange} onValueChange={(val: any) => setRecordsRange(val)}>
                    <SelectTrigger className="h-10 w-[125px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                      <SelectValue placeholder="Range" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                      <SelectItem value="today" className="text-xs font-medium cursor-pointer">Today</SelectItem>
                      <SelectItem value="yesterday" className="text-xs font-medium cursor-pointer">Yesterday</SelectItem>
                      <SelectItem value="this-week" className="text-xs font-medium cursor-pointer">This week</SelectItem>
                      <SelectItem value="this-month" className="text-xs font-medium cursor-pointer">This month</SelectItem>
                      <SelectItem value="all-time" className="text-xs font-medium cursor-pointer">All time</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Status */}
                  <Select value={recordsStatusFilter} onValueChange={setRecordsStatusFilter}>
                    <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                      {[
                        { id: "all", label: "All Statuses", count: recordStats.total },
                        { id: "present", label: "Present", count: recordStats.present },
                        { id: "late", label: "Late", count: recordStats.late },
                        { id: "absent", label: "Absent", count: recordStats.absent },
                        { id: "incomplete", label: "Incomplete", count: recordStats.incomplete },
                      ].map(tab => (
                        <SelectItem key={tab.id} value={tab.id} className="text-xs font-medium cursor-pointer">
                          {tab.label} ({tab.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Table Container */}
              <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">

                {/* ── Mobile card view ── */}
                <div className="md:hidden divide-y divide-border/30">
                  {recordsLoading ? (
                    <div className="py-12 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-sidebar" /></div>
                  ) : filteredRecordRows.length === 0 ? (
                    <div className="py-14 text-center text-xs font-medium text-muted-foreground">No records found.</div>
                  ) : filteredRecordRows.map((row, i) => {
                    const ministry = (ministries as any[]).find(m => m.id === row.worker.majorMinistryId);
                    return (
                      <div key={i} className="p-4 flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground leading-tight truncate">{row.worker.firstName} {row.worker.lastName}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{ministry?.name || "—"} · {format(row.date, "MMM d, yyyy")}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                            <span>In: <strong className="text-foreground">{row.timeIn ? format(row.timeIn, "h:mm a") : "——"}</strong></span>
                            <span>Out: <strong className="text-foreground">{row.timeOut ? format(row.timeOut, "h:mm a") : "——"}</strong></span>
                            <span>{formatHours(row.hours)}</span>
                            {row.status === "present"    && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Present</span>}
                            {row.status === "late"       && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">Late</span>}
                            {row.status === "absent"     && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">Absent</span>}
                            {row.status === "incomplete" && <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">Incomplete</span>}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              await createAttendanceRecord({ workerProfileId: row.worker.id, type: "Clock In" });
                              const hasStub = assignedStubs?.some((s: any) => { const sd = s.date instanceof Date ? s.date : new Date(s.date); return s.workerId === row.worker.id && sd >= todayStart; });
                              if (!hasStub) { try { await createMealStub({ workerId: row.worker.id, workerName: `${row.worker.firstName} ${row.worker.lastName}`, status: "Issued", assignedBy: workerProfile?.id || user?.id, assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || "System"), stubType: "daily" }); } catch {} }
                              toast({ title: "Timed In", description: `${row.worker.firstName} ${row.worker.lastName}` });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-emerald-700 transition-colors"
                          >
                            <LogIn className="h-3 w-3" /> In
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await createAttendanceRecord({ workerProfileId: row.worker.id, type: "Clock Out" });
                              toast({ title: "Timed Out", description: `${row.worker.firstName} ${row.worker.lastName}` });
                            }}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold flex items-center gap-1 hover:bg-blue-700 transition-colors"
                          >
                            <LogOut className="h-3 w-3" /> Out
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── Desktop table view ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-sidebar">
                      <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                        {["Worker", "Worker ID", "Role", "Ministry", "Date", "Time In", "Time Out", "Hours", "Status", "Actions"].map(h => (
                          <th key={h} className={cn("px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap", h === "Actions" ? "text-center w-20" : "text-left")}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {recordsLoading ? (
                        <tr><td colSpan={10} className="py-12 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-sidebar" /></td></tr>
                      ) : filteredRecordRows.length === 0 ? (
                        <tr><td colSpan={10} className="py-14 text-center text-xs font-medium text-muted-foreground">No records found.</td></tr>
                      ) : filteredRecordRows.map((row, i) => {
                        const ministry = (ministries as any[]).find(m => m.id === row.worker.majorMinistryId);
                        return (
                          <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3.5 align-middle">
                              <div className="flex items-center gap-2.5">
                                <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                                <span className="text-xs font-semibold text-foreground whitespace-nowrap">{row.worker.firstName} {row.worker.lastName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground align-middle whitespace-nowrap">{fmtId(row.worker.workerId)}</td>
                            <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                              <RoleBadge role={getRoleName(row.worker)} />
                            </td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{ministry?.name || "—"}</td>
                            <td className="px-4 py-3.5 text-xs font-semibold text-foreground align-middle whitespace-nowrap">{format(row.date, "EEE, MMM d, yyyy")}</td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{row.timeIn ? format(row.timeIn, "h:mm a") : "——"}</td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{row.timeOut ? format(row.timeOut, "h:mm a") : "——"}</td>
                            <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{formatHours(row.hours)}</td>
                            <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                              {row.status === "present"    && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Present</span>}
                              {row.status === "late"       && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Late</span>}
                              {row.status === "absent"     && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Absent</span>}
                              {row.status === "incomplete" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Incomplete</span>}
                            </td>
                            <td className="px-4 py-3.5 align-middle whitespace-nowrap text-center">
                              <div className="flex items-center justify-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-lg border border-border bg-popover">
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        await createAttendanceRecord({ workerProfileId: row.worker.id, type: "Clock In" });
                                        const hasStub = assignedStubs?.some((s: any) => { const sd = s.date instanceof Date ? s.date : new Date(s.date); return s.workerId === row.worker.id && sd >= todayStart; });
                                        if (!hasStub) { try { await createMealStub({ workerId: row.worker.id, workerName: `${row.worker.firstName} ${row.worker.lastName}`, status: "Issued", assignedBy: workerProfile?.id || user?.id, assignedByName: workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.email || "System"), stubType: "daily" }); } catch {} }
                                        toast({ title: "Timed In", description: `${row.worker.firstName} ${row.worker.lastName}` });
                                      }}
                                      className="cursor-pointer text-xs font-medium"
                                    >
                                      <LogIn className="h-3.5 w-3.5 mr-2" /> Time In
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={async () => {
                                        await createAttendanceRecord({ workerProfileId: row.worker.id, type: "Clock Out" });
                                        toast({ title: "Timed Out", description: `${row.worker.firstName} ${row.worker.lastName}` });
                                      }}
                                      className="cursor-pointer text-xs font-medium"
                                    >
                                      <LogOut className="h-3.5 w-3.5 mr-2" /> Time Out
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Table Footer */}
              <div className="flex items-center justify-between pt-4 text-xs text-muted-foreground">
                <span>Showing <strong className="text-foreground">{filteredRecordRows.length}</strong> record{filteredRecordRows.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function AttendancePage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex justify-center items-center py-24">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      }
    >
      <AttendanceContent />
    </Suspense>
  );
}

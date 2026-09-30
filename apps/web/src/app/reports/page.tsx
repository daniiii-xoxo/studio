"use client";

import React, { useState, useMemo, useCallback, Suspense } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { useSearchParams } from "next/navigation";
import {
  LoaderCircle, Download, Users, UtensilsCrossed,
  CalendarCheck, CheckCircle2, Clock, XCircle, TrendingUp,
  Search, ChevronLeft, ChevronRight, X, AlertCircle,
  Building2,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import {
  format, startOfDay, startOfWeek,
  startOfMonth, endOfMonth, isSunday,
  differenceInMinutes,
} from "date-fns";
import type { Worker } from "@studio/types";
import { cn, toJsDate } from "@/lib/utils";
import {
  getAttendanceRecords, getBookings,
  getMealStubs, getMinistries, getRooms, getWorkers,
} from "@/actions/db";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@studio/ui";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────
function exportCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const csvContent = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return (
    <span className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
      {init}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === "present" || s === "approved" || s === "claimed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        <span className="capitalize">{status}</span>
      </span>
    );
  }
  if (s === "late" || s.startsWith("pending") || s === "issued" || s === "unclaimed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        <span className="capitalize">{status === "issued" ? "Unclaimed" : status}</span>
      </span>
    );
  }
  if (s === "absent" || s === "rejected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        <span className="capitalize">{status}</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
      <span className="capitalize">{status}</span>
    </span>
  );
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

const ITEMS_PER_PAGE = 8;

const fmtId = (id: string | null | undefined) => {
  if (!id) return "—";
  const num = parseInt(id, 10);
  return isNaN(num) ? id : `COG-${String(num).padStart(4, "0")}`;
};

// ── Attendance Tab ────────────────────────────────────────────────────────────
function AttendanceTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance-report-month"],
    queryFn: () => getAttendanceRecords({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [range, setRange] = useState<"today" | "this-week" | "this-month" | "all-time">("this-month");
  const [page, setPage] = useState(1);

  // Ministry distribution chart
  const ministryChartData = useMemo(() => {
    if (!attendance || !workers || !ministries) return [];
    const counts: Record<string, number> = {};
    for (const rec of attendance) {
      if (rec.type !== "Clock In") continue;
      const w = workers.find(x => x.id === rec.workerProfileId);
      if (!w) continue;
      const min = (ministries as any[]).find(m => m.id === w.majorMinistryId);
      if (min) counts[min.name] = (counts[min.name] || 0) + 1;
    }
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [attendance, workers, ministries]);

  // Stats
  const totalTimeIns = useMemo(() => attendance?.filter(a => a.type === "Clock In").length ?? 0, [attendance]);
  const totalTimeOuts = useMemo(() => attendance?.filter(a => a.type === "Clock Out").length ?? 0, [attendance]);
  const uniqueWorkers = useMemo(() => new Set(attendance?.map(a => a.workerProfileId)).size ?? 0, [attendance]);
  const avgRate = useMemo(() => {
    if (!workers?.length) return "0%";
    const pct = Math.round((uniqueWorkers / workers.length) * 100);
    return `${pct}%`;
  }, [uniqueWorkers, workers]);

  // Build per-worker per-day rows
  const rows = useMemo(() => {
    if (!attendance || !workers) return [];
    const workerMap: Record<string, any[]> = {};
    for (const r of attendance) {
      if (!workerMap[r.workerProfileId]) workerMap[r.workerProfileId] = [];
      workerMap[r.workerProfileId].push({ ...r, _t: toJsDate(r.time) });
    }
    const result: any[] = [];
    for (const [wId, recs] of Object.entries(workerMap)) {
      const w = workers.find(x => x.id === wId);
      if (!w) continue;
      const dayMap: Record<string, any[]> = {};
      for (const r of recs) {
        const day = format(r._t, "yyyy-MM-dd");
        if (!dayMap[day]) dayMap[day] = [];
        dayMap[day].push(r);
      }
      for (const [day, dayRecs] of Object.entries(dayMap)) {
        const sorted = dayRecs.sort((a, b) => a._t.getTime() - b._t.getTime());
        const inRec = sorted.find(r => r.type === "Clock In");
        const outRec = [...sorted].reverse().find(r => r.type === "Clock Out");
        const timeIn = inRec ? inRec._t : null;
        const timeOut = outRec ? outRec._t : null;
        const hours = timeIn && timeOut ? differenceInMinutes(timeOut, timeIn) : null;
        let status = "absent";
        if (!timeIn) status = "absent";
        else if (!timeOut) status = "incomplete";
        else if (timeIn.getHours() > 8 || (timeIn.getHours() === 8 && timeIn.getMinutes() > 30)) status = "late";
        else status = "present";
        result.push({ worker: w, date: new Date(day), timeIn, timeOut, hours, status });
      }
    }
    return result.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [attendance, workers]);

  // Filter based on range
  const rangeFilteredRows = useMemo(() => {
    const today = startOfDay(new Date());
    const week = startOfWeek(new Date(), { weekStartsOn: 1 });
    return rows.filter(r => {
      if (range === "today") return r.date >= today;
      if (range === "this-week") return r.date >= week;
      return true;
    });
  }, [rows, range]);

  // Tab counts
  const tabCounts = useMemo(() => {
    return {
      all: rangeFilteredRows.length,
      present: rangeFilteredRows.filter(r => r.status === "present").length,
      late: rangeFilteredRows.filter(r => r.status === "late").length,
      absent: rangeFilteredRows.filter(r => r.status === "absent").length,
      incomplete: rangeFilteredRows.filter(r => r.status === "incomplete").length,
    };
  }, [rangeFilteredRows]);

  const filteredRows = useMemo(() => {
    return rangeFilteredRows.filter(r => {
      const name = `${r.worker.firstName} ${r.worker.lastName}`.toLowerCase();
      const q = search.trim().toLowerCase();
      if (q && !name.includes(q) && !fmtId(r.worker.workerId).toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all" && r.worker.majorMinistryId !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && r.worker.employmentType !== workerTypeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      return true;
    });
  }, [rangeFilteredRows, search, ministryFilter, workerTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredRows.length / ITEMS_PER_PAGE) || 1;
  const paginatedRows = filteredRows.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv(`attendance-report.csv`,
      ["Worker", "Worker ID", "Ministry", "Date", "Time In", "Time Out", "Hours", "Status"],
      filteredRows.map(r => [
        `${r.worker.firstName} ${r.worker.lastName}`,
        fmtId(r.worker.workerId),
        (ministries as any[])?.find(m => m.id === r.worker.majorMinistryId)?.name || "—",
        format(r.date, "MMM d, yyyy"),
        r.timeIn ? format(r.timeIn, "H:mm") : "—",
        r.timeOut ? format(r.timeOut, "H:mm") : "—",
        r.hours != null ? `${Math.floor(r.hours / 60)}h ${r.hours % 60}m` : "—",
        r.status,
      ])
    );
  };

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Time Ins"
          value={totalTimeIns}
          sub="this month"
          icon={CheckCircle2}
          accentColor="bg-sidebar"
          iconClass="text-sidebar"
          iconBgClass="bg-sidebar/10"
        />
        <StatCard
          label="Total Time Outs"
          value={totalTimeOuts}
          sub="this month"
          icon={XCircle}
          accentColor="bg-emerald-500"
          iconClass="text-emerald-600"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Unique Workers"
          value={uniqueWorkers}
          sub="who clocked in"
          icon={Users}
          accentColor="bg-orange-400"
          iconClass="text-orange-500"
          iconBgClass="bg-orange-50 dark:bg-orange-950/40"
        />
        <StatCard
          label="Avg. Attendance Rate"
          value={avgRate}
          sub="of total workforce"
          icon={TrendingUp}
          accentColor="bg-blue-500"
          iconClass="text-blue-600"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Ministry Distribution Chart */}
      {ministryChartData.length > 0 && (
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-6">
          <h2 className="text-base font-bold text-foreground font-headline mb-0.5">Attendance by Ministry</h2>
          <p className="text-xs text-muted-foreground mb-5">Logs per ministry this month.</p>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ministryChartData} margin={{ top: 4, right: 4, left: -20, bottom: 5 }} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis
                  dataKey="name"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#6b7280" }}
                  interval={0}
                />
                <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#9ca3af" }} />
                <Tooltip
                  contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }}
                  cursor={{ fill: "rgba(17,46,126,0.06)" }}
                />
                <Bar dataKey="count" name="Clock Ins" fill="#112e7e" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Main Table & Unified Controls Container */}
      <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 sm:p-6 overflow-hidden">
        {/* Top Controls Row: Search + Ministry + Worker Type + Range + Export */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] sm:min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search worker or ID..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Ministry */}
          <Select value={ministryFilter} onValueChange={v => { setMinistryFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[150px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
              <SelectValue placeholder="All Ministries" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
              <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
              {(ministries as any[] || []).map(m => (
                <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Worker Type */}
          <Select value={workerTypeFilter} onValueChange={v => { setWorkerTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[130px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
              <SelectValue placeholder="Worker Type" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
              <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Types</SelectItem>
              <SelectItem value="Full-Time" className="text-xs font-medium cursor-pointer">Full-Time</SelectItem>
              <SelectItem value="Part-Time" className="text-xs font-medium cursor-pointer">Part-Time</SelectItem>
              <SelectItem value="Volunteer" className="text-xs font-medium cursor-pointer">Volunteer</SelectItem>
              <SelectItem value="On-Call" className="text-xs font-medium cursor-pointer">On-Call</SelectItem>
            </SelectContent>
          </Select>

          {/* Status Filter Dropdown */}
          <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
            <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
              <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Statuses ({tabCounts.all})</SelectItem>
              <SelectItem value="present" className="text-xs font-medium cursor-pointer">Present ({tabCounts.present})</SelectItem>
              <SelectItem value="late" className="text-xs font-medium cursor-pointer">Late ({tabCounts.late})</SelectItem>
              <SelectItem value="absent" className="text-xs font-medium cursor-pointer">Absent ({tabCounts.absent})</SelectItem>
              <SelectItem value="incomplete" className="text-xs font-medium cursor-pointer">Incomplete ({tabCounts.incomplete})</SelectItem>
            </SelectContent>
          </Select>

          {/* Range */}
          <Select value={range} onValueChange={(v: any) => { setRange(v); setPage(1); }}>
            <SelectTrigger className="h-10 w-[125px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
              <SelectItem value="today" className="text-xs font-medium cursor-pointer">Today</SelectItem>
              <SelectItem value="this-week" className="text-xs font-medium cursor-pointer">This Week</SelectItem>
              <SelectItem value="this-month" className="text-xs font-medium cursor-pointer">This Month</SelectItem>
              <SelectItem value="all-time" className="text-xs font-medium cursor-pointer">All Time</SelectItem>
            </SelectContent>
          </Select>

          {/* Export CSV */}
          <button
            onClick={handleExport}
            className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>

        {/* Table Container */}
        <div className="border border-gray-200/80 dark:border-border rounded-2xl mt-5 overflow-hidden">
          {/* Mobile list view */}
          <div className="md:hidden divide-y divide-border/30">
            {paginatedRows.length === 0 ? (
              <div className="py-14 text-center text-xs font-medium text-muted-foreground">No attendance records found.</div>
            ) : paginatedRows.map((row, i) => {
              const ministry = (ministries as any[] || []).find(m => m.id === row.worker.majorMinistryId);
              return (
                <div key={i} className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-foreground truncate">{row.worker.firstName} {row.worker.lastName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{ministry?.name || "—"}</p>
                      </div>
                    </div>
                    <StatusBadge status={row.status} />
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1 font-mono text-[11px]">{format(row.date, "MMM d, yyyy")}</p>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-[10px] mb-0.5">Time In</p>
                        <p className="text-foreground font-mono">{row.timeIn ? format(row.timeIn, "H:mm") : "——"}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-[10px] mb-0.5">Time Out</p>
                        <p className="text-foreground font-mono">{row.timeOut ? format(row.timeOut, "H:mm") : "——"}</p>
                      </div>
                      <div>
                        <p className="font-semibold uppercase tracking-wider text-[10px] mb-0.5">Hours</p>
                        <p className="text-foreground font-mono">{row.hours != null ? `${(row.hours / 60).toFixed(1)}h` : "——"}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table view */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-sidebar">
                <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                  {["Worker", "Worker ID", "Ministry", "Time In", "Time Out", "Total Hours", "Date", "Status"].map(h => (
                    <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedRows.length === 0 ? (
                  <tr><td colSpan={8} className="py-14 text-center text-xs font-medium text-muted-foreground">No attendance records found.</td></tr>
                ) : paginatedRows.map((row, i) => {
                  const ministry = (ministries as any[] || []).find(m => m.id === row.worker.majorMinistryId);
                  return (
                    <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={`${row.worker.firstName} ${row.worker.lastName}`} />
                          <div>
                            <span className="text-xs font-semibold text-foreground leading-tight block">{row.worker.firstName} {row.worker.lastName}</span>
                            <span className="text-[11px] text-muted-foreground truncate block">{row.worker.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground align-middle whitespace-nowrap">
                        {fmtId(row.worker.workerId)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">
                        {ministry?.name || "—"}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground font-medium align-middle whitespace-nowrap">
                        {row.timeIn ? format(row.timeIn, "H:mm") : "——"}
                      </td>
                      <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground font-medium align-middle whitespace-nowrap">
                        {row.timeOut ? format(row.timeOut, "H:mm") : "——"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-foreground font-medium align-middle whitespace-nowrap">
                        {row.hours != null ? `${(row.hours / 60).toFixed(1)}h` : "——"}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">
                        {format(row.date, "MMM d, yyyy")}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <StatusBadge status={row.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-2 py-4 mt-2 flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground font-medium">
            Showing {filteredRows.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filteredRows.length)}` : "0"} of {filteredRows.length} records
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 5 && page > 3) {
                pageNum = page - 3 + i;
                if (pageNum + (5 - i) > totalPages) pageNum = totalPages - 4 + i;
              }
              if (pageNum <= 0 || pageNum > totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={cn(
                    "h-8 w-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer",
                    page === pageNum
                      ? "bg-sidebar text-white font-bold shadow-xs"
                      : "border border-slate-200/90 dark:border-border text-foreground hover:bg-slate-50 dark:hover:bg-muted/40"
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Meal Stub Claims Tab ──────────────────────────────────────────────────────
function MealStubClaimsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const { data: mealstubs, isLoading } = useQuery({
    queryKey: ["mealstubs-report"],
    queryFn: () => getMealStubs({ dateFrom: monthStart, dateTo: monthEnd }),
  });
  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const stats = useMemo(() => {
    if (!mealstubs) return { issued: 0, claimed: 0, unclaimed: 0, claimRate: "0%" };
    const claimed = mealstubs.filter(s => s.status === "Claimed").length;
    const unclaimed = mealstubs.length - claimed;
    return {
      issued: mealstubs.length,
      claimed,
      unclaimed,
      claimRate: mealstubs.length > 0 ? `${Math.round((claimed / mealstubs.length) * 100)}%` : "0%",
    };
  }, [mealstubs]);

  const rows = useMemo(() => {
    return (mealstubs || []).map(s => {
      const w = workers?.find(x => x.id === s.workerId);
      const min = w ? (ministries as any[] || []).find(m => m.id === w.majorMinistryId) : null;
      return { ...s, worker: w, ministry: min };
    });
  }, [mealstubs, workers, ministries]);

  const tabCounts = useMemo(() => {
    return {
      all: rows.length,
      claimed: rows.filter(r => r.status === "Claimed").length,
      unclaimed: rows.filter(r => r.status !== "Claimed").length,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(r => {
      if (q && !r.workerName.toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all" && r.ministry?.id !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && r.worker?.employmentType !== workerTypeFilter) return false;
      if (statusFilter !== "all") {
        if (statusFilter === "Claimed" && r.status !== "Claimed") return false;
        if (statusFilter === "Issued" && r.status === "Claimed") return false;
      }
      return true;
    });
  }, [rows, search, ministryFilter, workerTypeFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("mealstub-claims.csv",
      ["Worker", "Ministry", "Date Issued", "Date Claimed", "Status", "Claim Type"],
      filtered.map(s => [
        s.workerName,
        s.ministry?.name || "—",
        format(toJsDate(s.date), "MMM d, yyyy"),
        (s as any).claimedAt ? format(toJsDate((s as any).claimedAt), "MMM d, yyyy") : "——",
        s.status,
        (s as any).stubType || "Daily",
      ])
    );
  };

  // Donut chart data
  const donutData = [
    { name: "Claimed", value: stats.claimed, color: "#10b981" },
    { name: "Unclaimed", value: stats.unclaimed, color: "#f59e0b" },
  ];

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Issued"
          value={stats.issued.toLocaleString()}
          sub="this month"
          icon={UtensilsCrossed}
          accentColor="bg-sidebar"
          iconClass="text-sidebar"
          iconBgClass="bg-sidebar/10"
        />
        <StatCard
          label="Total Claimed"
          value={stats.claimed.toLocaleString()}
          sub="this month"
          icon={CheckCircle2}
          accentColor="bg-emerald-500"
          iconClass="text-emerald-600"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="Total Unclaimed"
          value={stats.unclaimed.toLocaleString()}
          sub="this month"
          icon={XCircle}
          accentColor="bg-amber-500"
          iconClass="text-amber-600"
          iconBgClass="bg-amber-50 dark:bg-amber-950/40"
        />
        <StatCard
          label="Claim Rate"
          value={stats.claimRate}
          sub="of issued stubs"
          icon={TrendingUp}
          accentColor="bg-blue-500"
          iconClass="text-blue-600"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Main Table + Donut Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Table Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 sm:p-6 overflow-hidden">
          {/* Top Controls Row: Search + Ministry + Worker Type + Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search worker..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Ministry */}
            <Select value={ministryFilter} onValueChange={v => { setMinistryFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-[140px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Ministries" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                {(ministries as any[] || []).map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Worker Type */}
            <Select value={workerTypeFilter} onValueChange={v => { setWorkerTypeFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-[125px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="Worker Type" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Types</SelectItem>
                <SelectItem value="Full-Time" className="text-xs font-medium cursor-pointer">Full-Time</SelectItem>
                <SelectItem value="Part-Time" className="text-xs font-medium cursor-pointer">Part-Time</SelectItem>
                <SelectItem value="Volunteer" className="text-xs font-medium cursor-pointer">Volunteer</SelectItem>
                <SelectItem value="On-Call" className="text-xs font-medium cursor-pointer">On-Call</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter Dropdown */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Statuses ({tabCounts.all})</SelectItem>
                <SelectItem value="Claimed" className="text-xs font-medium cursor-pointer">Claimed ({tabCounts.claimed})</SelectItem>
                <SelectItem value="Issued" className="text-xs font-medium cursor-pointer">Unclaimed ({tabCounts.unclaimed})</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <button
              onClick={handleExport}
              className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="border border-gray-200/80 dark:border-border rounded-2xl mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sidebar">
                  <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                    {["Worker", "Ministry", "Date Issued", "Date Claimed", "Status", "Claim Type"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} className="py-14 text-center text-xs font-medium text-muted-foreground">No records found.</td></tr>
                  ) : paginated.map((s, i) => (
                    <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3.5 align-middle">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={s.workerName} />
                          <span className="text-xs font-semibold text-foreground">{s.workerName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{s.ministry?.name || "—"}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{format(toJsDate(s.date), "MMM d, yyyy")}</td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">
                        {(s as any).claimedAt ? format(toJsDate((s as any).claimedAt), "MMM d, yyyy") : "——"}
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300 border border-slate-200 dark:border-border capitalize">
                          {(s as any).stubType ? ((s as any).stubType.charAt(0).toUpperCase() + (s as any).stubType.slice(1)) : "Daily"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-2 py-4 mt-2 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; }
                if (n <= 0 || n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer", page === n ? "bg-sidebar text-white font-bold shadow-xs" : "border border-slate-200/90 dark:border-border text-foreground hover:bg-slate-50 dark:hover:bg-muted/40")}>{n}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Donut Chart Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5">
          <h3 className="text-sm font-bold font-headline text-foreground mb-0.5">Claimed vs Unclaimed</h3>
          <p className="text-xs text-muted-foreground mb-4">This month ratio.</p>
          <div className="h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={donutData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={3} dataKey="value" strokeWidth={0}>
                  {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            {donutData.map(d => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Allocations Tab ───────────────────────────────────────────────────────────
function AllocationsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);

  const { data: workers, isLoading: wL } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: ministries, isLoading: mL } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: mealstubs, isLoading: msL } = useQuery({
    queryKey: ["mealstubs-alloc"],
    queryFn: () => getMealStubs({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [workerTypeFilter, setWorkerTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const getMinistry = useCallback((id: string) => (ministries as any[] || []).find(m => m.id === id), [ministries]);

  const eligibleWorkers = useMemo(() => (workers || []).filter(w => w.employmentType === "Full-Time" || w.employmentType === "On-Call" || w.employmentType === "Part-Time" || w.employmentType === "Volunteer"), [workers]);

  const getStats = useCallback((wId: string) => {
    const stubs = (mealstubs || []).filter(s => s.workerId === wId);
    const weekday = stubs.filter(s => !isSunday(toJsDate(s.date))).length;
    const sunday = stubs.filter(s => isSunday(toJsDate(s.date))).length;
    const weekdayLimit = 5;
    const sundayLimit = 2;
    const remaining = Math.max(0, (weekdayLimit - weekday) + (sundayLimit - sunday));
    return { weekday, sunday, weekdayLimit, sundayLimit, remaining };
  }, [mealstubs]);

  // Summary stats
  const totalAllocations = useMemo(() => (mealstubs || []).length, [mealstubs]);
  const fullTimeCount = useMemo(() => (workers || []).filter(w => w.employmentType === "Full-Time").length, [workers]);
  const onCallCount = useMemo(() => (workers || []).filter(w => w.employmentType === "On-Call").length, [workers]);
  const remainingAllocations = useMemo(() => {
    const maxPerWorker = 7;
    const total = eligibleWorkers.length * maxPerWorker;
    return Math.max(0, total - totalAllocations);
  }, [eligibleWorkers, totalAllocations]);

  // Allocation usage
  const weekdayUsed = useMemo(() => (mealstubs || []).filter(s => !isSunday(toJsDate(s.date))).length, [mealstubs]);
  const sundayUsed = useMemo(() => (mealstubs || []).filter(s => isSunday(toJsDate(s.date))).length, [mealstubs]);
  const weekdayMax = eligibleWorkers.length * 5;
  const sundayMax = eligibleWorkers.length * 2;
  const ftAllocated = useMemo(() => (mealstubs || []).filter(s => { const w = workers?.find(x => x.id === s.workerId); return w?.employmentType === "Full-Time"; }).length, [mealstubs, workers]);
  const ftMax = fullTimeCount * 7;
  const ocAllocated = useMemo(() => (mealstubs || []).filter(s => { const w = workers?.find(x => x.id === s.workerId); return w?.employmentType === "On-Call"; }).length, [mealstubs, workers]);
  const ocMax = onCallCount * 7;

  const tabCounts = useMemo(() => {
    return {
      all: eligibleWorkers.length,
      "Full-Time": eligibleWorkers.filter(w => w.employmentType === "Full-Time").length,
      "Part-Time": eligibleWorkers.filter(w => w.employmentType === "Part-Time").length,
      "Volunteer": eligibleWorkers.filter(w => w.employmentType === "Volunteer").length,
      "On-Call": eligibleWorkers.filter(w => w.employmentType === "On-Call").length,
    };
  }, [eligibleWorkers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return eligibleWorkers.filter(w => {
      const name = `${w.firstName} ${w.lastName}`.toLowerCase();
      if (q && !name.includes(q)) return false;
      if (ministryFilter !== "all" && w.majorMinistryId !== ministryFilter) return false;
      if (workerTypeFilter !== "all" && w.employmentType !== workerTypeFilter) return false;
      return true;
    });
  }, [eligibleWorkers, search, ministryFilter, workerTypeFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("allocations.csv",
      ["Worker", "Ministry", "Worker Type", "Weekday Used", "Sunday Used", "Remaining"],
      filtered.map(w => {
        const s = getStats(w.id);
        return [`${w.firstName} ${w.lastName}`, getMinistry(w.majorMinistryId)?.name || "—", w.employmentType || "—", `${s.weekday}/${s.weekdayLimit}`, `${s.sunday}/${s.sundayLimit}`, s.remaining];
      })
    );
  };

  if (wL || mL || msL) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  function UsageBar({ label, used, max, color }: { label: string; used: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min(100, Math.round((used / max) * 100)) : 0;
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">{label}</span>
          <span className="text-xs text-muted-foreground font-mono">{used.toLocaleString()} / {max.toLocaleString()}</span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Allocations" value={totalAllocations.toLocaleString()} sub="this month" icon={UtensilsCrossed} accentColor="bg-sidebar" iconClass="text-sidebar" iconBgClass="bg-sidebar/10" />
        <StatCard label="Full-Time Workers" value={fullTimeCount.toLocaleString()} sub="eligible" icon={CheckCircle2} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatCard label="On-Call Workers" value={onCallCount.toLocaleString()} sub="eligible" icon={Users} accentColor="bg-orange-400" iconClass="text-orange-500" iconBgClass="bg-orange-50 dark:bg-orange-950/40" />
        <StatCard label="Remaining Allocations" value={remainingAllocations.toLocaleString()} sub="available" icon={TrendingUp} accentColor="bg-blue-500" iconClass="text-blue-600" iconBgClass="bg-blue-50 dark:bg-blue-950/40" />
      </div>

      {/* Main Table + Usage Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Table Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 sm:p-6 overflow-hidden">
          {/* Top Controls Row: Search + Ministry + Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search worker..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Ministry */}
            <Select value={ministryFilter} onValueChange={v => { setMinistryFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-[145px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Ministries" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                {(ministries as any[] || []).map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Worker Type Filter */}
            <Select value={workerTypeFilter} onValueChange={(val) => { setWorkerTypeFilter(val); setPage(1); }}>
              <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Types ({tabCounts.all})</SelectItem>
                <SelectItem value="Full-Time" className="text-xs font-medium cursor-pointer">Full-Time ({tabCounts["Full-Time"]})</SelectItem>
                <SelectItem value="Part-Time" className="text-xs font-medium cursor-pointer">Part-Time ({tabCounts["Part-Time"]})</SelectItem>
                <SelectItem value="Volunteer" className="text-xs font-medium cursor-pointer">Volunteer ({tabCounts["Volunteer"]})</SelectItem>
                <SelectItem value="On-Call" className="text-xs font-medium cursor-pointer">On-Call ({tabCounts["On-Call"]})</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <button
              onClick={handleExport}
              className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="border border-gray-200/80 dark:border-border rounded-2xl mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sidebar">
                  <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                    {["Worker", "Ministry", "Worker Type", "Weekday Used", "Sunday Used", "Remaining"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={6} className="py-14 text-center text-xs font-medium text-muted-foreground">No workers found.</td></tr>
                  ) : paginated.map((worker, i) => {
                    const s = getStats(worker.id);
                    const min = getMinistry(worker.majorMinistryId);
                    return (
                      <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <WorkerInitials name={`${worker.firstName} ${worker.lastName}`} />
                            <span className="text-xs font-semibold text-foreground">{worker.firstName} {worker.lastName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{min?.name || "—"}</td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300 border border-slate-200 dark:border-border">{worker.employmentType || "—"}</span>
                        </td>
                        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground font-medium align-middle whitespace-nowrap">{s.weekday}/{s.weekdayLimit}</td>
                        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground font-medium align-middle whitespace-nowrap">{s.sunday}/{s.sundayLimit}</td>
                        <td className="px-4 py-3.5 text-xs font-mono font-bold text-foreground align-middle whitespace-nowrap">{s.remaining}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-2 py-4 mt-2 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; }
                if (n <= 0 || n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer", page === n ? "bg-sidebar text-white font-bold shadow-xs" : "border border-slate-200/90 dark:border-border text-foreground hover:bg-slate-50 dark:hover:bg-muted/40")}>{n}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Allocation Usage Sidebar */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 flex flex-col gap-4">
          <div>
            <h3 className="text-sm font-bold font-headline text-foreground">Allocation Usage</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Used vs available this month.</p>
          </div>
          <div className="flex flex-col gap-4">
            <UsageBar label="Weekday Allocation" used={weekdayUsed} max={weekdayMax} color="#112e7e" />
            <UsageBar label="Sunday Allocation" used={sundayUsed} max={sundayMax} color="#10b981" />
            <UsageBar label="Full-Time Allocations" used={ftAllocated} max={ftMax} color="#f97316" />
            <UsageBar label="On-Call Allocations" used={ocAllocated} max={ocMax} color="#f59e0b" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Reservations Tab ──────────────────────────────────────────────────────────
function ReservationsTab() {
  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthEnd = useMemo(() => endOfMonth(new Date()), []);
  const { data: workers } = useQuery({ queryKey: ["workers"], queryFn: getWorkers });
  const { data: rooms } = useQuery({ queryKey: ["rooms"], queryFn: getRooms });
  const { data: ministries } = useQuery({ queryKey: ["ministries"], queryFn: getMinistries });
  const { data: reservations, isLoading } = useQuery({
    queryKey: ["bookings-report"],
    queryFn: () => getBookings({ dateFrom: monthStart, dateTo: monthEnd }),
  });

  const [search, setSearch] = useState("");
  const [ministryFilter, setMinistryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const getWorkerName = useCallback((id: string) => { const w = workers?.find(x => x.id === id); return w ? `${w.firstName} ${w.lastName}` : "Unknown"; }, [workers]);
  const getRoomName = useCallback((id: string) => rooms?.find(r => r.id === id)?.name ?? "Unknown", [rooms]);
  const getWorkerMinistry = useCallback((wId: string) => {
    const w = workers?.find(x => x.id === wId);
    if (!w) return null;
    return (ministries as any[] || []).find(m => m.id === w.majorMinistryId);
  }, [workers, ministries]);

  const stats = useMemo(() => {
    if (!reservations) return { total: 0, approved: 0, pending: 0, rejected: 0 };
    return {
      total: reservations.length,
      approved: reservations.filter(r => r.status === "Approved").length,
      pending: reservations.filter(r => r.status?.startsWith("Pending")).length,
      rejected: reservations.filter(r => r.status === "Rejected").length,
    };
  }, [reservations]);

  const donutData = [
    { name: "Approved", value: stats.approved, color: "#10b981" },
    { name: "Pending",  value: stats.pending,  color: "#f59e0b" },
    { name: "Rejected", value: stats.rejected,  color: "#ef4444" },
  ];

  const topRooms = useMemo(() => {
    if (!reservations || !rooms) return [];
    const counts: Record<string, number> = {};
    for (const r of reservations) {
      counts[r.roomId] = (counts[r.roomId] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([roomId, count]) => ({ name: getRoomName(roomId), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [reservations, rooms, getRoomName]);

  const maxRoomCount = topRooms[0]?.count || 1;

  const tabCounts = useMemo(() => {
    const res = reservations || [];
    return {
      all: res.length,
      approved: res.filter(r => r.status === "Approved").length,
      pending: res.filter(r => r.status?.startsWith("Pending")).length,
      rejected: res.filter(r => r.status === "Rejected").length,
    };
  }, [reservations]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (reservations || []).filter(r => {
      if (q && !r.title.toLowerCase().includes(q) && !getWorkerName(r.workerProfileId).toLowerCase().includes(q)) return false;
      if (ministryFilter !== "all") {
        const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
        if (min?.id !== ministryFilter) return false;
      }
      if (statusFilter !== "all") {
        if (statusFilter === "pending" && !r.status?.startsWith("Pending")) return false;
        if (statusFilter === "approved" && r.status !== "Approved") return false;
        if (statusFilter === "rejected" && r.status !== "Rejected") return false;
      }
      return true;
    });
  }, [reservations, search, ministryFilter, statusFilter, getWorkerName, getWorkerMinistry]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE) || 1;
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleExport = () => {
    exportCsv("reservations.csv",
      ["Worker", "Ministry", "Facility", "Date", "Time", "Purpose", "Status"],
      filtered.map(r => {
        const start = toJsDate(r.start);
        const end = toJsDate(r.end);
        const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
        return [
          r.workerProfileId ? getWorkerName(r.workerProfileId) : "N/A",
          min?.name || "—",
          getRoomName(r.roomId),
          format(start, "MMM d, yyyy"),
          `${format(start, "H:mm")} - ${format(end, "H:mm")}`,
          r.purpose || r.title || "—",
          r.status,
        ];
      })
    );
  };

  if (isLoading) return <div className="flex justify-center py-16"><LoaderCircle className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col gap-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={stats.total.toLocaleString()} sub="this month" icon={CalendarCheck} accentColor="bg-sidebar" iconClass="text-sidebar" iconBgClass="bg-sidebar/10" />
        <StatCard label="Approved" value={stats.approved.toLocaleString()} sub="confirmed" icon={CheckCircle2} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
        <StatCard label="Pending" value={stats.pending.toLocaleString()} sub="awaiting" icon={Clock} accentColor="bg-amber-500" iconClass="text-amber-600" iconBgClass="bg-amber-50 dark:bg-amber-950/40" />
        <StatCard label="Rejected" value={stats.rejected.toLocaleString()} sub="declined" icon={XCircle} accentColor="bg-red-500" iconClass="text-red-600" iconBgClass="bg-red-50 dark:bg-red-950/40" />
      </div>

      {/* Main Table + Right Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6 items-start">
        {/* Table Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 sm:p-6 overflow-hidden">
          {/* Top Controls Row: Search + Ministry + Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] sm:min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search reservation or worker..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-9 pr-8 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-slate-50/50 dark:bg-muted/30 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 shadow-2xs focus:outline-none focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Ministry */}
            <Select value={ministryFilter} onValueChange={v => { setMinistryFilter(v); setPage(1); }}>
              <SelectTrigger className="h-10 w-[145px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Ministries" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                {(ministries as any[] || []).map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setPage(1); }}>
              <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Statuses ({tabCounts.all})</SelectItem>
                <SelectItem value="approved" className="text-xs font-medium cursor-pointer">Approved ({tabCounts.approved})</SelectItem>
                <SelectItem value="pending" className="text-xs font-medium cursor-pointer">Pending ({tabCounts.pending})</SelectItem>
                <SelectItem value="rejected" className="text-xs font-medium cursor-pointer">Rejected ({tabCounts.rejected})</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <button
              onClick={handleExport}
              className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer shrink-0"
            >
              <Download className="h-4 w-4" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="border border-gray-200/80 dark:border-border rounded-2xl mt-5 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-sidebar">
                  <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                    {["Worker", "Ministry", "Facility", "Date", "Time", "Purpose", "Status"].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr><td colSpan={7} className="py-14 text-center text-xs font-medium text-muted-foreground">No records found.</td></tr>
                  ) : paginated.map((r, i) => {
                    const start = toJsDate(r.start);
                    const end = toJsDate(r.end);
                    const name = getWorkerName(r.workerProfileId);
                    const min = r.workerProfileId ? getWorkerMinistry(r.workerProfileId) : null;
                    return (
                      <tr key={i} className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3.5 align-middle">
                          <div className="flex items-center gap-2.5">
                            <WorkerInitials name={name} />
                            <span className="text-xs font-semibold text-foreground">{name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{min?.name || "—"}</td>
                        <td className="px-4 py-3.5 text-xs text-foreground font-medium align-middle whitespace-nowrap">{getRoomName(r.roomId)}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle whitespace-nowrap">{format(start, "MMM d, yyyy")}</td>
                        <td className="px-4 py-3.5 text-xs font-mono text-muted-foreground font-medium align-middle whitespace-nowrap">{format(start, "H:mm")} - {format(end, "H:mm")}</td>
                        <td className="px-4 py-3.5 text-xs text-muted-foreground font-medium align-middle">{r.purpose || r.title || "—"}</td>
                        <td className="px-4 py-3.5 align-middle whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-2 py-4 mt-2 flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground font-medium">
              Showing {filtered.length > 0 ? `${(page - 1) * ITEMS_PER_PAGE + 1}–${Math.min(page * ITEMS_PER_PAGE, filtered.length)}` : "0"} of {filtered.length} records
            </p>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n = i + 1;
                if (totalPages > 5 && page > 3) { n = page - 3 + i; if (n + (5 - i) > totalPages) n = totalPages - 4 + i; }
                if (n <= 0 || n > totalPages) return null;
                return <button key={n} onClick={() => setPage(n)} className={cn("h-8 w-8 flex items-center justify-center rounded-xl text-xs font-semibold transition-all cursor-pointer", page === n ? "bg-sidebar text-white font-bold shadow-xs" : "border border-slate-200/90 dark:border-border text-foreground hover:bg-slate-50 dark:hover:bg-muted/40")}>{n}</button>;
              })}
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages || totalPages === 0} className="h-8 w-8 flex items-center justify-center rounded-xl border border-slate-200 dark:border-border text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-5">
          {/* Status Distribution Donut */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5">
            <h3 className="text-sm font-bold font-headline text-foreground mb-0.5">Status Distribution</h3>
            <p className="text-xs text-muted-foreground mb-3">All reservation requests</p>
            <div className="h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donutData} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={3} dataKey="value" strokeWidth={0}>
                    {donutData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-3 mt-1">
              {donutData.map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: d.color }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>

          {/* Most Utilized Rooms */}
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5">
            <h3 className="text-sm font-bold font-headline text-foreground mb-0.5">Most Utilized Rooms</h3>
            <p className="text-xs text-muted-foreground mb-4">Top 5 facilities this month.</p>
            <div className="flex flex-col gap-3">
              {topRooms.map((room, i) => (
                <div key={room.name} className="flex items-center gap-3">
                  <span className="text-[11px] font-bold text-muted-foreground w-4 shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-foreground truncate">{room.name}</span>
                      <span className="text-[11px] text-muted-foreground ml-2 shrink-0 font-mono">{room.count}</span>
                    </div>
                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-sidebar transition-all" style={{ width: `${Math.round((room.count / maxRoomCount) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
              {topRooms.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No data.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
function ReportsContent() {
  const { canViewReports, isLoading } = useUserRole();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") || "attendance") as "attendance" | "meal-stubs" | "allocations" | "reservations";

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!canViewReports) {
    return (
      <AppLayout>
        <div className="p-12 text-center text-sm text-muted-foreground">
          Access Denied. You do not have permission to view reports.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
            Reports &amp; Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor attendance, meal stub usage, allocations, and room reservations across the organization.
          </p>
        </div>

        {/* Tab content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "attendance"   && <AttendanceTab />}
          {activeTab === "meal-stubs"   && <MealStubClaimsTab />}
          {activeTab === "allocations"  && <AllocationsTab />}
          {activeTab === "reservations" && <ReservationsTab />}
        </div>
      </div>
    </AppLayout>
  );
}

export default function ReportsPage() {
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
      <ReportsContent />
    </Suspense>
  );
}

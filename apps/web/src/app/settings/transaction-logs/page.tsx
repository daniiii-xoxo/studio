"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell, Input, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { useUserRole } from "@/hooks/use-user-role";
import { useQuery } from "@tanstack/react-query";
import { getTransactionLogs } from "@/actions/db";
import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  LoaderCircle, Search, ShieldAlert, Clock, History,
  ChevronDown, ChevronUp, Pencil, AlertCircle, RefreshCw,
  Plus, ArrowLeft, LogIn, X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Module color map ──────────────────────────────────────────────────────────
const MODULE_COLORS: Record<string, { dot: string; pill: string; label: string }> = {
  "Meal Stubs":   { dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",   label: "Meal Stub" },
  "MealStubs":    { dot: "bg-blue-500",   pill: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",   label: "Meal Stub" },
  "ORS Sync":     { dot: "bg-red-500",    pill: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800",         label: "ORS Sync" },
  "Auth":         { dot: "bg-emerald-500",pill: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800", label: "Auth" },
  "Roles":        { dot: "bg-orange-500", pill: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800", label: "Roles" },
  "Facilities":   { dot: "bg-blue-400",   pill: "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",   label: "Facilities" },
  "Ministries":   { dot: "bg-purple-500", pill: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800", label: "Ministries" },
  "System":       { dot: "bg-gray-500",   pill: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",     label: "System" },
  "Workers":      { dot: "bg-indigo-500", pill: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800", label: "Workers" },
  "Settings":     { dot: "bg-teal-500",   pill: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",   label: "Settings" },
};

function getModuleStyle(module: string) {
  return MODULE_COLORS[module] || { dot: "bg-primary", pill: "bg-primary/10 text-primary border-primary/20", label: module };
}

// ── Action icon ───────────────────────────────────────────────────────────────
function ActionIcon({ action, module }: { action: string; module: string }) {
  const lower = (action || "").toLowerCase();
  const mod = (module || "").toLowerCase();

  if (lower.includes("sign") || lower.includes("login") || lower.includes("auth") || mod === "auth")
    return <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center shrink-0"><LogIn className="h-4 w-4 text-emerald-600" /></div>;
  if (lower.includes("error") || lower.includes("fail") || lower.includes("denied"))
    return <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center shrink-0"><AlertCircle className="h-4 w-4 text-red-600" /></div>;
  if (lower.includes("creat") || lower.includes("add") || lower.includes("new"))
    return <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0"><Plus className="h-4 w-4 text-orange-600" /></div>;
  if (lower.includes("sync") || lower.includes("import"))
    return <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0"><RefreshCw className="h-4 w-4 text-blue-600" /></div>;
  return <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Pencil className="h-4 w-4 text-primary" /></div>;
}

// ── User initials ─────────────────────────────────────────────────────────────
function UserInitials({ name }: { name?: string | null }) {
  const n = name || "S";
  const parts = n.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : n.slice(0, 2).toUpperCase();
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[9px] font-black shrink-0">{init}</span>;
}

const MODULE_FILTERS = ["All", "Meal Stub", "ORS Sync", "Auth", "Roles", "Facilities", "Ministries", "System"];

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, accentColor }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; iconBg: string; accentColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 shadow-card-dark bg-card">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-4xl font-black tracking-tight text-foreground leading-none mt-3">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBg)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionLogsPage() {
  const { isSuperAdmin, isLoading: isRoleLoading } = useUserRole();
  const [search, setSearch] = useState("");
  const [moduleFilter, setModuleFilter] = useState("All");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: logs, isLoading: isLogsLoading } = useQuery({
    queryKey: ["transaction-logs"],
    queryFn: getTransactionLogs,
    enabled: isSuperAdmin,
    refetchInterval: 30_000,
  });

  const toggleExpand = (id: string) => setExpandedIds(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  // Stats
  const todayCount = useMemo(() => (logs || []).filter(l => l.timestamp && isToday(new Date(l.timestamp))).length, [logs]);
  const errorCount = useMemo(() => (logs || []).filter(l => (l.action || "").toLowerCase().includes("fail") || (l.action || "").toLowerCase().includes("error")).length, [logs]);
  const updateCount = useMemo(() => (logs || []).filter(l => (l.action || "").toLowerCase().includes("updat")).length, [logs]);
  const loginCount = useMemo(() => (logs || []).filter(l => (l.action || "").toLowerCase().includes("sign") || (l.action || "").toLowerCase().includes("login")).length, [logs]);

  const moduleCounts = useMemo(() => {
    const allLogs = logs || [];
    const counts: Record<string, number> = {
      All: allLogs.length,
    };
    MODULE_FILTERS.forEach(f => {
      if (f === "All") return;
      counts[f] = allLogs.filter(l => (l.module || "").toLowerCase().includes(f.toLowerCase())).length;
    });
    return counts;
  }, [logs]);

  const filtered = useMemo(() => {
    let result = logs || [];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        (l.userName || "").toLowerCase().includes(q) ||
        (l.action || "").toLowerCase().includes(q) ||
        (l.module || "").toLowerCase().includes(q) ||
        (l.details || "").toLowerCase().includes(q)
      );
    }
    if (moduleFilter !== "All") {
      result = result.filter(l => {
        const mod = l.module || "";
        return mod.toLowerCase().includes(moduleFilter.toLowerCase());
      });
    }
    return result;
  }, [logs, search, moduleFilter]);

  if (isRoleLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;

  if (!isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
          <ShieldAlert className="h-16 w-16 text-destructive opacity-80" />
          <h2 className="text-2xl font-bold">Access Denied</h2>
          <p className="text-muted-foreground max-w-sm">This area is restricted to Super Administrators only.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              Transaction Logs
            </h1>
            <p className="text-sm text-muted-foreground">
              Full audit trail of activity across every module.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Today's Logs" value={todayCount} icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>} iconBg="bg-blue-50 dark:bg-blue-950/40" accentColor="bg-blue-500" />
          <StatCard label="Errors" value={errorCount} icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2}><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>} iconBg="bg-emerald-50 dark:bg-emerald-950/40" accentColor="bg-emerald-500" />
          <StatCard label="Updates" value={updateCount} icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>} iconBg="bg-orange-50 dark:bg-orange-950/40" accentColor="bg-orange-400" />
          <StatCard label="Logins" value={loginCount} sub="Mon · Fri" icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={2}><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>} iconBg="bg-amber-50 dark:bg-amber-950/40" accentColor="bg-amber-400" />
        </div>

        {/* Main Content Container Card (Connect2Souls Style) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
          {/* Top Controls Row */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Search bar */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by user or action..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Module Filter Dropdown */}
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="h-10 w-[175px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Modules" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover max-h-72">
                {MODULE_FILTERS.map(f => (
                  <SelectItem key={f} value={f} className="text-xs font-medium cursor-pointer">
                    {f === "All" ? "All Modules" : f} ({moduleCounts[f] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table Container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card mt-1">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                    <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-6 text-left w-[42%]">ACTIVITY</TableHead>
                    <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[20%]">USER</TableHead>
                    <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[15%]">MODULE</TableHead>
                    <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[15%]">TIME</TableHead>
                    <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[8%]">DETAILS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLogsLoading ? (
                    <TableRow><TableCell colSpan={5} className="py-14 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="py-14 text-center text-sm text-muted-foreground">No logs found.</TableCell></TableRow>
                  ) : (
                    filtered.map(log => {
                      const isExpanded = expandedIds.has(log.id);
                      const style = getModuleStyle(log.module || "System");
                      const timeAgo = log.timestamp ? formatDistanceToNow(new Date(log.timestamp), { addSuffix: true }) : "Unknown";

                      return (
                        <React.Fragment key={log.id}>
                          <TableRow className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                            <TableCell className="px-6 py-3.5 align-middle">
                              <div className="flex items-center gap-3">
                                <ActionIcon action={log.action || ""} module={log.module || ""} />
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-foreground">{log.action || "Action"}</p>
                                  {log.details && !isExpanded && (
                                    <p className="text-[11px] text-muted-foreground truncate max-w-md mt-0.5">{log.details}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3.5 align-middle">
                              <div className="flex items-center gap-2">
                                <UserInitials name={log.userName} />
                                <span className="text-xs font-semibold text-foreground">{log.userName || "System"}</span>
                              </div>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-center align-middle">
                              <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border", style.pill)}>
                                <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", style.dot)} />
                                {style.label}
                              </span>
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-xs text-muted-foreground font-medium text-center align-middle">
                              {timeAgo}
                            </TableCell>
                            <TableCell className="px-4 py-3.5 text-center align-middle">
                              <button
                                type="button"
                                onClick={() => toggleExpand(log.id)}
                                title={isExpanded ? "Collapse Details" : "View Details"}
                                className="p-1.5 rounded-lg hover:bg-muted text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
                              >
                                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                              </button>
                            </TableCell>
                          </TableRow>
                          {isExpanded && log.details && (
                            <TableRow className="bg-muted/15 border-b border-border/30">
                              <TableCell colSpan={5} className="px-6 py-3">
                                <div className="rounded-xl border border-border/60 bg-background/80 dark:bg-muted/30 p-3.5 text-xs text-muted-foreground">
                                  <span className="font-semibold text-foreground">Details: </span>
                                  {log.details}
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
        </div>
      </div>
    </AppLayout>
  );
}

"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Input } from "@studio/ui";
import { LoaderCircle, Utensils, Save, Search, ChevronDown, ChevronUp, ArrowLeft, Calendar } from "lucide-react";
import type { Ministry, Department } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import { useMinistries } from "@/hooks/use-ministries";
import { useDepartments } from "@/hooks/use-departments";
import { useSettings } from "@/hooks/use-settings";
import { cn } from "@/lib/utils";

const DEPARTMENTS: Department[] = ["Worship", "Outreach", "Relationship", "Discipleship", "Administration"];

const DEPT_COLORS: Record<string, { stripe: string; iconBadge: string; progress: string }> = {
  Worship: {
    stripe: "bg-blue-600",
    iconBadge: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
    progress: "bg-blue-600",
  },
  Outreach: {
    stripe: "bg-amber-500",
    iconBadge: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
    progress: "bg-amber-500",
  },
  Relationship: {
    stripe: "bg-rose-500",
    iconBadge: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800",
    progress: "bg-rose-500",
  },
  Discipleship: {
    stripe: "bg-emerald-500",
    iconBadge: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800",
    progress: "bg-emerald-500",
  },
  Administration: {
    stripe: "bg-slate-900 dark:bg-slate-700",
    iconBadge: "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700",
    progress: "bg-slate-900 dark:bg-slate-500",
  },
};

function StatCard({ label, value, sub, icon: Icon, iconBg, accentColor }: {
  label: string; value: string | number; sub?: string;
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

export default function MealStubAllocationPage() {
  const { isSuperAdmin, canManageMinistries, isLoading: isRoleLoading } = useUserRole();
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [ministryEdits, setMinistryEdits] = useState<Record<string, number>>({});
  const [deptEdits, setDeptEdits] = useState<Record<string, number>>({});

  const { ministries, isLoading: ministriesLoading, updateMinistry } = useMinistries({ all: true });
  const { departments, isLoading: departmentsLoading, upsertDepartment } = useDepartments();
  const { settings: globalSettings, isLoading: settingsLoading } = useSettings("mealstubs");

  const isLoading = ministriesLoading || departmentsLoading || isRoleLoading || settingsLoading;

  const getDeptInfo = (dept: string) => (departments as any[])?.find(d => d.id === dept);
  const getDeptPool = (dept: string) => { const e = deptEdits[dept]; return e !== undefined ? e : (getDeptInfo(dept)?.mealStubWeekdayAllocation || 0); };
  const getDeptAllocated = (dept: string) => {
    return ((ministries as any[])?.filter(m => m.department === dept) || []).reduce((sum: number, m: any) => {
      const e = ministryEdits[m.id]; return sum + (e !== undefined ? e : (m.mealStubWeeklyLimit || 0));
    }, 0);
  };

  // Global stats
  const totalPool = useMemo(() => DEPARTMENTS.reduce((s, d) => s + getDeptPool(d), 0), [departments, deptEdits]);
  const totalAllocated = useMemo(() => DEPARTMENTS.reduce((s, d) => s + getDeptAllocated(d), 0), [ministries, ministryEdits, departments, deptEdits]);
  const totalRemaining = Math.max(0, totalPool - totalAllocated);
  const restrictedDays = (globalSettings as any)?.disabledVolunteerDays?.length ?? 2;

  const handleDeptEdit = (dept: string, value: string) => { const n = parseInt(value) || 0; if (n >= 0) setDeptEdits(p => ({ ...p, [dept]: n })); };
  const handleMinistryEdit = (id: string, value: string) => { const n = parseInt(value) || 0; if (n >= 0) setMinistryEdits(p => ({ ...p, [id]: n })); };

  const handleSaveDeptPool = async (dept: string) => {
    const value = deptEdits[dept]; if (value === undefined) return;
    setSaving(`dept-${dept}`);
    try {
      await upsertDepartment({ id: dept, data: { mealStubWeekdayAllocation: value } });
      toast({ title: "Department Pool Updated" });
      setDeptEdits(p => { const n = { ...p }; delete n[dept]; return n; });
    } catch { toast({ variant: "destructive", title: "Save Failed" }); }
    finally { setSaving(null); }
  };

  const handleSaveMinistry = async (ministry: any) => {
    const value = ministryEdits[ministry.id]; if (value === undefined) return;
    setSaving(ministry.id);
    try {
      await updateMinistry({ id: ministry.id, data: { mealStubWeeklyLimit: value } });
      await logAction("Updated Ministry Allocation", "Settings", `${ministry.name}: ${value}`);
      toast({ title: "Saved" });
      setMinistryEdits(p => { const n = { ...p }; delete n[ministry.id]; return n; });
    } catch { toast({ variant: "destructive", title: "Save Failed" }); }
    finally { setSaving(null); }
  };

  const toggleDept = (dept: string) => setExpandedDepts(p => { const n = new Set(p); n.has(dept) ? n.delete(dept) : n.add(dept); return n; });

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!isSuperAdmin && !canManageMinistries) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-7 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              Meal Stub Allocation
            </h1>
            <p className="text-sm text-muted-foreground">
              Distribute the weekly meal stub pool across departments and ministries.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Weekly Pool" value={totalPool.toLocaleString()} icon={Utensils} iconBg="bg-blue-50 dark:bg-blue-950/40 text-blue-500" accentColor="bg-blue-500" />
          <StatCard label="Allocated" value={totalAllocated.toLocaleString()} icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-emerald-500" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} iconBg="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500" accentColor="bg-emerald-500" />
          <StatCard label="Remaining" value={totalRemaining.toLocaleString()} icon={() => <svg viewBox="0 0 24 24" className="h-5 w-5 text-orange-500" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>} iconBg="bg-orange-50 dark:bg-orange-950/40 text-orange-500" accentColor="bg-orange-400" />
          <StatCard label="Restricted Days" value={restrictedDays} sub="Mon · Fri" icon={Calendar} iconBg="bg-amber-50 dark:bg-amber-950/40 text-amber-500" accentColor="bg-amber-400" />
        </div>

        {/* Department sections container with shadow */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 flex flex-col gap-4">
          {/* Search bar inside container */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ministries...."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-10 rounded-2xl border border-slate-200/90 dark:border-border bg-muted/30 dark:bg-muted/20 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all shadow-2xs"
            />
          </div>

          {DEPARTMENTS.map(dept => {
            const pool = getDeptPool(dept);
            const allocated = getDeptAllocated(dept);
            const remaining = pool - allocated;
            const pct = pool > 0 ? Math.min(100, Math.round((allocated / pool) * 100)) : 0;
            const isOver = allocated > pool;
            const isExpanded = expandedDepts.has(dept);
            const hasDeptEdits = deptEdits[dept] !== undefined;
            const colors = DEPT_COLORS[dept] || {
              stripe: "bg-primary",
              iconBadge: "bg-primary/10 text-primary border border-primary/20",
              progress: "bg-primary",
            };

            const deptMinistries = ((ministries as any[])?.filter(m => m.department === dept) || [])
              .filter(m => !search || m.name.toLowerCase().includes(search.toLowerCase()))
              .sort((a: any, b: any) => a.name.localeCompare(b.name));

            if (search && deptMinistries.length === 0) return null;

            return (
              <div key={dept} className="bg-muted/10 dark:bg-muted/20 rounded-2xl border border-border/60 overflow-hidden relative">
                {/* Top Accent Stripe based on department */}
                <div className={cn("h-1.5 w-full", colors.stripe)} />

                {/* Department header — clickable */}
                <button onClick={() => toggleDept(dept)} className="w-full px-6 py-4 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-xl shrink-0 transition-colors", colors.iconBadge)}>
                      <Utensils className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-foreground">{dept}</h3>
                      <p className="text-[11px] text-muted-foreground">
                        Pool <span className="font-semibold text-foreground">{pool}</span>
                        {" · "}Allocated <span className={cn("font-semibold", isOver ? "text-red-500" : "text-foreground")}>{allocated}</span>
                        {" · "}Remaining <span className="font-semibold text-foreground">{remaining}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all", isOver ? "bg-red-500" : colors.progress)} style={{ width: `${pct}%` }} />
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border/40 px-6 py-5 flex flex-col gap-4">
                    {/* Dept pool input */}
                    <div className="flex items-center justify-between gap-4 bg-muted/30 rounded-xl p-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Department Weekly Pool</p>
                        <input type="number" min="0" value={pool} onChange={e => handleDeptEdit(dept, e.target.value)}
                          className="w-28 h-9 rounded-xl border border-border/60 bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      </div>
                      <button onClick={() => handleSaveDeptPool(dept)} disabled={!hasDeptEdits || saving === `dept-${dept}`}
                        className={cn("h-9 px-3.5 flex items-center gap-1.5 rounded-xl text-xs font-semibold transition-colors",
                          hasDeptEdits ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-muted-foreground cursor-not-allowed")}>
                        {saving === `dept-${dept}` ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        Save Pool
                      </button>
                    </div>

                    {/* Ministry limits */}
                    {deptMinistries.length > 0 && (
                      <div className="border border-border/60 rounded-xl overflow-hidden">
                        <div className="px-4 py-2.5 bg-muted/40 border-b border-border/40">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Ministry Weekly Limits</p>
                        </div>
                        <div className="divide-y divide-border/30">
                          {deptMinistries.map((m: any) => {
                            const editVal = ministryEdits[m.id];
                            const current = editVal !== undefined ? editVal : (m.mealStubWeeklyLimit || 0);
                            const changed = editVal !== undefined;
                            const mPct = pool > 0 ? Math.min(100, Math.round((current / pool) * 100)) : 0;
                            return (
                              <div key={m.id} className="px-4 py-3.5 flex flex-col gap-2">
                                <div className="flex items-center justify-between gap-4">
                                  <p className="text-sm font-semibold text-foreground">{m.name}</p>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <p className="text-[11px] text-muted-foreground">Limit</p>
                                    <input type="number" min="0" value={current} onChange={e => handleMinistryEdit(m.id, e.target.value)}
                                      className="w-20 h-8 rounded-lg border border-border/60 bg-background px-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary" />
                                    <button onClick={() => handleSaveMinistry(m)} disabled={!changed || saving === m.id}
                                      className={cn("h-8 w-8 flex items-center justify-center rounded-lg transition-colors",
                                        changed ? "bg-primary text-primary-foreground hover:bg-primary/90" : "border border-border/60 text-muted-foreground cursor-not-allowed")}>
                                      {saving === m.id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                    </button>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${mPct}%` }} />
                                  </div>
                                  <span className="text-[11px] text-muted-foreground w-8 text-right shrink-0">{mPct}%</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {search && DEPARTMENTS.every(dept => {
            const deptMinistries = ((ministries as any[])?.filter(m => m.department === dept) || [])
              .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
            return deptMinistries.length === 0;
          }) && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No ministries found matching &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
        </div>
      </div>
    </AppLayout>
  );
}

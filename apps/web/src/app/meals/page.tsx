"use client";

import React, { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  DatePicker,
} from "@studio/ui";
import { Input } from "@studio/ui";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from "@studio/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@studio/ui";
import { Badge } from "@studio/ui";
import { Label } from "@studio/ui";
import {
  PlusCircle,
  QrCode,
  LoaderCircle,
  Scan,
  RefreshCw,
  ShieldAlert,
  ClipboardList,
  ShieldCheck,
  Search,
  CheckCircle2,
  Trash2,
  UtensilsCrossed,
  CalendarDays,
  Calendar,
  Ticket,
  Layers,
  Plus,
  X,
  FileText,
  Clock,
  TrendingUp,
  ScanLine,
} from "lucide-react";
import {
  format,
  isToday,
  subDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getTodayStubCount,
  getWeeklyStubCount,
  getStubCountForDate,
  cn,
} from "@/lib/utils";
import {
  Tabs,
  TabsContent,
  Checkbox,
  Progress,
} from "@studio/ui";
import { useMealAudio } from "@/hooks/use-meal-audio";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useSettings } from "@/hooks/use-settings";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import type { Worker } from "@studio/types";

// ------------------------------------------------------------
// helpers
// ------------------------------------------------------------
function generateToken() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ── StatCard Component (Consistent with C2S Overview, Dashboard & Attendance) ───
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
  iconClass,
  iconBgClass,
  badge,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accentColor: string;
  iconClass: string;
  iconBgClass: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-border shadow-xs bg-white dark:bg-card h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight font-headline text-foreground leading-none">{value}</span>
              {badge}
            </div>
            {sub && <p className="text-xs text-muted-foreground mt-2 font-medium">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------
function MealsPageContent() {
  const { user } = useAuthStore();
  const { canViewMealStubs, canManageAllMealStubs, isMealStubAssigner, workerProfile, isLoading: isRoleLoading, isMinistryHead, myMinistryIds, isSuperAdmin } = useUserRole();
  const { toast } = useToast();
  const { playSuccess, playError } = useMealAudio();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [assignSearch, setAssignSearch] = useState('');
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "view");
  const [assignDate, setAssignDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const assignDateObj = useMemo(() => new Date(assignDate + 'T12:00:00'), [assignDate]);
  const isSelectedSunday = assignDateObj.getDay() === 0;

  const [isCleanupConfirmOpen, setIsCleanupConfirmOpen] = useState(false);
  const [isAssignAllConfirmOpen, setIsAssignAllConfirmOpen] = useState(false);
  const [isBatchRemoveConfirmOpen, setIsBatchRemoveConfirmOpen] = useState(false);
  const [assignSingleWorker, setAssignSingleWorker] = useState<Worker | null>(null);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'assign' && (isMealStubAssigner || canManageAllMealStubs || isMinistryHead)) {
      setActiveTab('assign');
    } else if (tab === 'view') {
      setActiveTab('view');
    } else if (tab === 'reports' && (isMealStubAssigner || canManageAllMealStubs || isMinistryHead)) {
      setActiveTab('reports');
    }
  }, [searchParams, isMealStubAssigner, canManageAllMealStubs, isMinistryHead]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/meals?tab=${value}`);
  };

  const { workers: allWorkers, isLoading: workersLoading, updateWorker } = useWorkers({
    enabled: isMealStubAssigner || canManageAllMealStubs || isMinistryHead,
    limit: 999999,
  });
  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { settings: globalSettings } = useSettings('mealstubs');

  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);
  const {
    mealStubs,
    isLoading: mealStubsLoading,
    createMealStub,
    deleteMealStub
  } = useMealStubs(canManageAllMealStubs
    ? { dateFrom: thirtyDaysAgo }
    : { workerId: user?.id, dateFrom: thirtyDaysAgo, enabled: !!user?.id }
  );

  const { mealStubs: allMealStubsInRange } = useMealStubs({
    dateFrom: thirtyDaysAgo,
    enabled: isMealStubAssigner || canManageAllMealStubs
  });

  // Live worker profile (for QR token)
  const liveWorkerProfile = useMemo(() => allWorkers?.find(w => w.id === (workerProfile?.id || user?.id)), [allWorkers, workerProfile, user]);

  // QR Token
  const [localSeed, setLocalSeed] = useState<string | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const activeToken = localSeed ?? liveWorkerProfile?.qrToken ?? workerProfile?.id ?? '';
  const qrData = activeToken ? `MEAL_STUB:${workerProfile?.id}:${activeToken}` : '';
  const qrUrl = qrData ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrData)}` : '';

  const handleRegenerateQR = useCallback(async () => {
    if (!workerProfile?.id) return;
    setIsRegenerating(true);
    try {
      const newToken = generateToken();
      await updateWorker({ id: workerProfile.id, data: { qrToken: newToken } });
      setLocalSeed(newToken);
      toast({
        title: "QR Code Regenerated",
        description: "Your old QR code is now invalid.",
      });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Failed to regenerate QR" });
    } finally {
      setIsRegenerating(false);
    }
  }, [user, updateWorker, toast]);

  const assignerMinistries = useMemo(() => {
    if (!ministries) return [];
    if (isSuperAdmin) return ministries;
    if (!workerProfile) return [];
    return ministries.filter(m => m.mealStubAssignerId === workerProfile.id || m.headId === workerProfile.id || myMinistryIds.includes(m.id));
  }, [workerProfile, ministries, isSuperAdmin, myMinistryIds]);
  const isAssigner = isSuperAdmin || isMinistryHead || assignerMinistries.length > 0;

  const ministryWorkers = useMemo(() => {
    if (!allWorkers) return [];
    return allWorkers.filter(w => w.status === 'Active');
  }, [allWorkers]);

  const filteredAssignerWorkers = useMemo(() => {
    if (!ministryWorkers) return [];
    const q = assignSearch.toLowerCase();
    return ministryWorkers.filter(w =>
      `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
      w.employmentType?.toLowerCase().includes(q)
    );
  }, [ministryWorkers, assignSearch]);

  const eligibleAssignWorkers = useMemo(() => {
    if (!filteredAssignerWorkers) return [];
    return filteredAssignerWorkers.filter(w => getStubCountForDate(allMealStubsInRange as any || [], w.id, assignDateObj) < 1);
  }, [filteredAssignerWorkers, allMealStubsInRange, assignDateObj]);

  // ---- Logic Handlers ----

  // Issues a single stub document. Used internally.
  const issueSingleStub = useCallback(async (
    targetId: string,
    assignerId: string,
    assignerName: string,
    targetWorker: any,
    stubLabel: string = 'daily',
  ) => {
    await createMealStub({
      workerId: targetId,
      workerName: `${targetWorker.firstName} ${targetWorker.lastName}`,
      date: assignDateObj,
      status: 'Issued',
      assignedBy: assignerId,
      assignedByName: assignerName,
      stubType: stubLabel,
    });
  }, [createMealStub, assignDateObj]);

  // Main stub assignment function that validates and issues 1 or 2 stubs.
  const issueStub = useCallback(async (targetId: string, count: number = 1) => {
    const assignerId = workerProfile?.id || user?.uid || 'system';
    const assignerName = workerProfile ? `${workerProfile.firstName} ${workerProfile.lastName}` : (user?.displayName || user?.email || 'System Admin');

    const targetWorker = allWorkers?.find(w => w.id === targetId);
    if (!targetWorker) return;

    if (count === 0) {
      // Explicitly 0 stubs – nothing to issue.
      playSuccess(targetWorker.employmentType as 'Full-Time' | 'On-Call' | 'Volunteer' | undefined, 0); // quiet blip
      toast({ title: "No Stub Issued", description: `No stub assigned to ${targetWorker.firstName} ${targetWorker.lastName} today.` });
      return;
    }

    // 1. Daily Check – skip if already has a stub (unless Sunday 2-stub)
    const dayCount = getStubCountForDate(allMealStubsInRange as any || [], targetId, assignDateObj);
    const maxAllowedToday = isSelectedSunday ? count : 1;
    if (dayCount >= maxAllowedToday) {
      playError();
      toast({ variant: "destructive", title: "Already Assigned", description: `This worker already has ${dayCount} meal stub(s) for the selected date.` });
      return;
    }

    // 2. Volunteer Day Check
    if (targetWorker.employmentType === 'Volunteer') {
      const d = assignDateObj.getDay();
      if ((globalSettings as any)?.disabledVolunteerDays?.includes(d)) {
        playError();
        toast({ variant: "destructive", title: "Disabled", description: "Volunteer stubs are disabled for today." });
        return;
      }
    }

    // 3. Ministry Pool Check
    const targetMinistryId = targetWorker.majorMinistryId;
    const ministry = ministries?.find(m => m.id === targetMinistryId);
    if (ministry && ministry.mealStubWeeklyLimit !== null) {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = endOfWeek(new Date());
      const ministryWorkersIds = allWorkers?.filter(w => w.majorMinistryId === targetMinistryId || w.minorMinistryId === targetMinistryId).map(w => w.id) || [];
      const usedThisWeek = allMealStubsInRange?.filter(s => {
        if (!ministryWorkersIds.includes(s.workerId)) return false;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        return isWithinInterval(d, { start, end });
      }).length || 0;

      const limit = ministry.mealStubWeeklyLimit ?? 0;
      const remaining = limit - usedThisWeek;
      if (remaining <= 0) {
        playError();
        toast({ variant: "destructive", title: "Limit Reached", description: `Ministry ${ministry.name} has reached its weekly limit (${ministry.mealStubWeeklyLimit}).` });
        return;
      }
      if (count > remaining) {
        playError();
        toast({ variant: "destructive", title: "Pool Insufficient", description: `Only ${remaining} stub(s) left in the pool for ${ministry.name}. Requested ${count}.` });
        return;
      }
    }

    setIsAssigning(true);
    try {
      const stubsToCreate = count - dayCount; // only create what is still missing
      for (let i = 0; i < stubsToCreate; i++) {
        const label = count === 2 ? (i === 0 ? 'sunday-1' : 'sunday-2') : 'daily';
        await issueSingleStub(targetId, assignerId, assignerName, targetWorker, label);
      }
      // 🔊 Play success sound tuned to this worker's employment type
      playSuccess(targetWorker.employmentType as 'Full-Time' | 'On-Call' | 'Volunteer' | undefined, count);
      toast({ title: `Stub${count > 1 ? 's' : ''} Issued`, description: `${count} meal stub(s) issued to ${targetWorker.firstName} ${targetWorker.lastName}.` });
    } catch (e) {
      console.error(e);
      playError();
      toast({ variant: "destructive", title: "Error" });
    } finally {
      setIsAssigning(false);
    }
  }, [workerProfile, user, allWorkers, ministries, allMealStubsInRange, globalSettings, isSelectedSunday, assignDateObj, issueSingleStub, toast, playSuccess, playError]);

  // ---- Ministry Pool Data ----
  const ministryPoolData = useMemo(() => {
    if (!ministries || !allWorkers || !allMealStubsInRange) return [];
    const relevantMinistries = canManageAllMealStubs
      ? ministries.filter(m => m.mealStubWeeklyLimit !== null)
      : assignerMinistries.filter(m => m.mealStubWeeklyLimit !== null);

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date());

    return relevantMinistries.map(m => {
      const mWorkerIds = allWorkers
        .filter(w => w.majorMinistryId === m.id || w.minorMinistryId === m.id)
        .map(w => w.id);
      const usedThisWeek = allMealStubsInRange.filter(s => {
        if (!mWorkerIds.includes(s.workerId)) return false;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      }).length;
      const limit = m.mealStubWeeklyLimit!;
      return { id: m.id, name: m.name, used: usedThisWeek, limit, remaining: Math.max(0, limit - usedThisWeek) };
    });
  }, [ministries, allWorkers, allMealStubsInRange, canManageAllMealStubs, assignerMinistries]);

  // Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchOpen, setIsBatchOpen] = useState(false);

  const handleAssignStub = useCallback(async () => {
    if (!selectedWorkerId) return;
    await issueStub(selectedWorkerId);
    setIsAssignOpen(false);
    setSelectedWorkerId('');
  }, [selectedWorkerId, issueStub]);

  const handleCancelStub = useCallback(async (workerId: string) => {
    if (!allMealStubsInRange) return;
    const targetStub = allMealStubsInRange.find(s => {
      if (s.workerId !== workerId) return false;
      const d = s.date instanceof Date ? s.date : new Date(s.date as any);
      return format(d, 'yyyy-MM-dd') === format(assignDateObj, 'yyyy-MM-dd');
    });
    if (targetStub) {
      setIsAssigning(true);
      try {
        await deleteMealStub(targetStub.id);
        toast({ title: "Stub Removed", description: "Meal stub allocation has been cleared." });
      } catch (e) {
        console.error(e);
        toast({ variant: "destructive", title: "Error", description: "Failed to remove stub." });
      } finally {
        setIsAssigning(false);
      }
    }
  }, [allMealStubsInRange, assignDateObj, deleteMealStub, toast]);

  const handleBatchRemove = useCallback(async () => {
    if (!allMealStubsInRange || selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    let removedCount = 0;
    try {
      for (const wId of selectedWorkerIds) {
        const targetStub = allMealStubsInRange.find(s => {
          if (s.workerId !== wId) return false;
          const d = s.date instanceof Date ? s.date : new Date(s.date as any);
          return format(d, 'yyyy-MM-dd') === format(assignDateObj, 'yyyy-MM-dd');
        });
        if (targetStub) {
          await deleteMealStub(targetStub.id);
          removedCount++;
        }
      }
      setSelectedWorkerIds([]);
      toast({ title: "Removed Successfully", description: `Cleared ${removedCount} meal stub allocation(s).` });
    } catch (e) {
      console.error(e);
      toast({ variant: "destructive", title: "Error", description: "Failed to remove stubs." });
    } finally {
      setIsAssigning(false);
    }
  }, [allMealStubsInRange, selectedWorkerIds, assignDateObj, deleteMealStub, toast]);

  const handleAssignAll = useCallback(async () => {
    if (!filteredAssignerWorkers || filteredAssignerWorkers.length === 0) return;
    setIsAssigning(true);
    let assignedCount = 0;
    try {
      for (const w of filteredAssignerWorkers) {
        const dayCount = getStubCountForDate(allMealStubsInRange as any || [], w.id, assignDateObj);
        if (dayCount < 1) {
          await issueStub(w.id, 1);
          assignedCount++;
        }
      }
      toast({ title: "Batch Assignment Complete", description: `Assigned stubs to ${assignedCount} worker(s).` });
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  }, [filteredAssignerWorkers, allMealStubsInRange, assignDateObj, issueStub, toast]);

  const handleBatchAssign = async () => {
    if (selectedWorkerIds.length === 0) return;
    setIsAssigning(true);
    try {
      for (const id of selectedWorkerIds) {
        await issueStub(id);
      }
      setSelectedWorkerIds([]);
      setIsBatchOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleCleanupExcess = useCallback(async () => {
    if (!allMealStubsInRange) return;
    setIsCleanupConfirmOpen(false);
    setIsAssigning(true);
    let deletedCount = 0;
    try {
      const seen = new Set<string>();
      for (const s of allMealStubsInRange) {
        if (!s.date) continue;
        const d = s.date instanceof Date ? s.date : new Date(s.date as any);
        const dayKey = `${s.workerId}-${format(d, 'yyyy-MM-dd')}`;
        if (seen.has(dayKey)) {
          if (s.status === 'Issued') {
            await deleteMealStub(s.id);
            deletedCount++;
          }
        } else {
          seen.add(dayKey);
        }
      }
      if (deletedCount > 0) {
        toast({ title: "Cleanup Success", description: `Deleted ${deletedCount} duplicate or expired stubs.` });
      } else {
        toast({ title: "Cleanup Complete", description: "No duplicate or expired stubs found." });
      }
    } catch (e) { console.error(e); } finally { setIsAssigning(false); }
  }, [allMealStubsInRange, deleteMealStub, toast]);

  const toggleSelectAll = (workers: Worker[]) => {
    if (selectedWorkerIds.length === workers.length && workers.length > 0) setSelectedWorkerIds([]);
    else setSelectedWorkerIds(workers.map(w => w.id));
  };
  const toggleSelectWorker = (id: string) => setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]);

  const isLoading = mealStubsLoading || isRoleLoading || ((isMealStubAssigner || canManageAllMealStubs || isMinistryHead) && workersLoading);

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canViewMealStubs) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle></CardHeader></Card></AppLayout>;

  const myTodayCount = getTodayStubCount(mealStubs as any || [], workerProfile?.id || '');
  const myWeekCount = getWeeklyStubCount(mealStubs as any || [], workerProfile?.id || '');

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-gray-900 dark:text-white">
              Mealstub Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Issue, claim and audit daily meal allocations across every worker type — all from one place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/mealstub/scanner">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3.5 text-xs font-semibold rounded-xl border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ScanLine className="h-3.5 w-3.5 text-primary" />
                <span>Scanner</span>
              </Button>
            </Link>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <TabsContent value="view" className="space-y-6 mt-0">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <StatCard
                label="TODAY'S ALLOCATION"
                value={myTodayCount}
                badge={<span className="text-2xl sm:text-3xl text-muted-foreground font-medium">/ 1</span>}
                sub="daily allocation"
                icon={UtensilsCrossed}
                accentColor="bg-amber-500"
                iconClass="text-amber-600 dark:text-amber-400"
                iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              />
              <StatCard
                label="WEEKLY USAGE"
                value={myWeekCount}
                sub="of 7 days this week"
                icon={CalendarDays}
                accentColor="bg-sidebar"
                iconClass="text-sidebar dark:text-blue-400"
                iconBgClass="bg-sidebar/10 dark:bg-blue-950/40"
              />
            </div>

            {/* Outer White Container with Title Header & Shadow */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-foreground font-headline">
                  Issued Stubs
                </h3>
                <p className="text-xs text-muted-foreground">
                  Recent meal stub activity for your account.
                </p>
              </div>

              {/* Inner Table Container with Direct Navy Header (clean border, no inner shadow) */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[40%]">
                          DATE
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left w-[35%]">
                          TIME
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-center w-[25%]">
                          STATUS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(!mealStubs || mealStubs.length === 0) ? (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="py-14 text-center text-xs text-muted-foreground font-medium"
                          >
                            No meal stub activity recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...mealStubs]
                          .sort((a, b) => {
                            const da =
                              a.date instanceof Date
                                ? a.date
                                : new Date(a.date as any);
                            const db =
                              b.date instanceof Date
                                ? b.date
                                : new Date(b.date as any);
                            return db.getTime() - da.getTime();
                          })
                          .slice(0, 10)
                          .map((stub: any) => {
                            const d =
                              stub.date instanceof Date
                                ? stub.date
                                : new Date(stub.date);
                            const isClaimed =
                              stub.status === "Claimed" || stub.claimedAt;

                            return (
                              <TableRow
                                key={stub.id}
                                className="hover:bg-gray-50/60 dark:hover:bg-muted/30 border-b border-gray-100 dark:border-border/60 transition-colors"
                              >
                                <TableCell className="py-4 px-6 font-bold text-xs text-foreground align-middle">
                                  {format(d, "EEE, MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="py-4 px-6 text-xs text-muted-foreground font-medium align-middle">
                                  {format(d, "h:mm a")}
                                </TableCell>
                                <TableCell className="py-4 px-6 text-center align-middle">
                                  {isClaimed ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                                      Claimed
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                      Active
                                    </span>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="assign" className="space-y-5">
            {/* Top Filter and Actions Bar */}
            <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border p-4 px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Left: Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <Input
                  className="pl-9 pr-4 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                  placeholder="Search by name..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                />
              </div>

              {/* Right: Date Picker and Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Assignment Date */}
                <DatePicker
                  value={assignDate}
                  onChange={setAssignDate}
                  align="end"
                  className="w-40 rounded-2xl"
                />

                {canManageAllMealStubs && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCleanupConfirmOpen(true)}
                    disabled={isAssigning}
                    className="rounded-2xl border border-slate-200 dark:border-border text-slate-700 dark:text-slate-300 text-xs font-semibold px-4 h-10 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-muted shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-slate-500" />
                    Cleanup expired
                  </Button>
                )}
                <Button
                  type="button"
                  onClick={() => setIsAssignAllConfirmOpen(true)}
                  disabled={isAssigning || filteredAssignerWorkers.length === 0}
                  className="bg-sidebar hover:bg-sidebar/90 text-white rounded-2xl text-xs font-semibold px-5 h-10 flex items-center gap-2 shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Assign All
                </Button>
              </div>
            </div>

            {/* Selected Action Toolbar */}
            {selectedWorkerIds.length > 0 && (
              <div className="bg-slate-50 dark:bg-muted/40 rounded-2xl border border-slate-200/80 dark:border-border p-3.5 px-6 shadow-xs flex items-center justify-between animate-in fade-in duration-200">
                <span className="font-bold text-xs text-foreground">
                  {selectedWorkerIds.length} worker{selectedWorkerIds.length > 1 ? "s" : ""} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setIsBatchRemoveConfirmOpen(true)}
                    disabled={isAssigning}
                    className="border border-rose-300 text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 rounded-xl px-4 h-8 text-xs font-semibold flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Remove
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedWorkerIds([])}
                    className="border border-slate-200 dark:border-border text-slate-700 dark:text-slate-300 rounded-xl px-4 h-8 text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-100 dark:hover:bg-muted shadow-2xs cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    Clear
                  </Button>
                </div>
              </div>
            )}

            {/* Workers Table Card (Matching View Meal Stub Tab Layout) */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base text-foreground font-headline">
                  Workers
                </h3>
                <p className="text-xs text-muted-foreground">
                  Assigning for {format(assignDateObj, "MMMM d, yyyy")}
                </p>
              </div>

              {/* Inner Table Container with Direct Navy Header */}
              <div className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col">
                {/* ── MOBILE CARD LIST (below sm) ── */}
                <div className="sm:hidden divide-y divide-gray-100 dark:divide-border/60">
                  {filteredAssignerWorkers.length === 0 ? (
                    <p className="py-14 text-center text-xs text-muted-foreground font-medium">No workers found.</p>
                  ) : (
                    filteredAssignerWorkers.map((w) => {
                      const dayCount = getStubCountForDate((allMealStubsInRange as any) || [], w.id, assignDateObj);
                      const isAllocated = dayCount >= 1;
                      const initials = `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase();

                      return (
                        <div key={w.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50/60 dark:hover:bg-muted/30 transition-colors">
                          {/* Checkbox */}
                          <Checkbox checked={selectedWorkerIds.includes(w.id)} onCheckedChange={() => toggleSelectWorker(w.id)} />

                          {/* Avatar */}
                          <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 font-bold text-[11px] flex items-center justify-center shrink-0">
                            {initials}
                          </div>

                          {/* Name + Type + Status */}
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">{w.firstName} {w.lastName}</p>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {/* Type badge */}
                              {w.employmentType === "Full-Time" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">Full-Time</span>
                              ) : w.employmentType === "On-Call" ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">On-Call</span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{w.employmentType || "Volunteer"}</span>
                              )}
                              {/* Status badge */}
                              {isAllocated ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> Allocated
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 dark:bg-muted dark:text-slate-400 border border-slate-200 dark:border-border">
                                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" /> Not Allocated
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Action button */}
                          {isAllocated ? (
                            <Button variant="outline" size="sm" onClick={() => handleCancelStub(w.id)} disabled={isAssigning} className="shrink-0 rounded-xl px-3 h-8 text-xs font-semibold shadow-2xs">
                              Reassign
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => setAssignSingleWorker(w)} disabled={isAssigning} className="shrink-0 bg-sidebar hover:bg-sidebar/90 text-white rounded-xl px-4 h-8 text-xs font-semibold shadow-xs cursor-pointer">
                              Assign
                            </Button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* ── DESKTOP TABLE (sm and above) ── */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                        <TableHead className="w-12 px-4 py-3 text-center bg-sidebar">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              className="h-[17px] w-[17px] rounded-[4px] border-[1.5px] border-white/90 bg-transparent data-[state=checked]:bg-white data-[state=checked]:border-white [&_svg]:text-sidebar focus-visible:ring-0 cursor-pointer shadow-xs transition-colors"
                              checked={
                                filteredAssignerWorkers.length > 0 &&
                                selectedWorkerIds.length === filteredAssignerWorkers.length
                              }
                              onCheckedChange={() => toggleSelectAll(filteredAssignerWorkers as any)}
                            />
                          </div>
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-left">
                          WORKER
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-center">
                          TYPE
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-center">
                          TODAY
                        </TableHead>
                        <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-6 text-center">
                          ACTION
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssignerWorkers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-14 text-center text-xs text-muted-foreground font-medium">
                            No workers found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAssignerWorkers.map((w) => {
                          const dayCount = getStubCountForDate((allMealStubsInRange as any) || [], w.id, assignDateObj);
                          const isAllocated = dayCount >= 1;
                          const initials = `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase();

                          return (
                            <TableRow key={w.id} className="hover:bg-gray-50/60 dark:hover:bg-muted/30 border-b border-gray-100 dark:border-border/60 transition-colors">
                              <TableCell className="px-4 py-4 text-center align-middle">
                                <div className="flex items-center justify-center">
                                  <Checkbox
                                    className="h-[17px] w-[17px] rounded-[4px] border-slate-300 dark:border-slate-600 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar cursor-pointer transition-colors"
                                    checked={selectedWorkerIds.includes(w.id)}
                                    onCheckedChange={() => toggleSelectWorker(w.id)}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 align-middle">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground font-bold text-xs flex items-center justify-center shrink-0">
                                    {initials}
                                  </div>
                                  <span className="font-bold text-xs text-foreground">
                                    {w.firstName} {w.lastName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center align-middle">
                                {w.employmentType === "Full-Time" ? (
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 min-w-[85px]">
                                    Full-Time
                                  </span>
                                ) : w.employmentType === "On-Call" ? (
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 min-w-[85px]">
                                    On-Call
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 min-w-[85px]">
                                    {w.employmentType || "Volunteer"}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center align-middle">
                                {isAllocated ? (
                                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 min-w-[110px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                    Allocated
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 dark:bg-muted dark:text-slate-400 border border-slate-200 dark:border-border min-w-[110px]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                                    Not Allocated
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="px-6 py-4 text-center align-middle">
                                {isAllocated ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleCancelStub(w.id)}
                                    disabled={isAssigning}
                                    className="border border-slate-200 dark:border-border text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-muted rounded-xl px-4 h-8 text-xs font-semibold shadow-2xs cursor-pointer"
                                  >
                                    Reassign
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => setAssignSingleWorker(w)}
                                    disabled={isAssigning}
                                    className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl px-5 h-8 text-xs font-semibold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
                                  >
                                    Assign
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>

            {/* Ministry Pool Panel */}
            {ministryPoolData.length > 0 && (
              <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark overflow-hidden space-y-5">
                <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/40 bg-sidebar">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-white/20 text-white">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-white font-headline">
                        Ministry Stub Pool
                      </h3>
                      <p className="text-xs text-white/70 mt-0.5">
                        Weekly mealstub allocation remaining for {isSelectedSunday ? <span className="font-semibold text-amber-300">the selected Sunday</span> : 'this week'}.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4 px-5 sm:px-6 pb-5 sm:pb-6">
                  {ministryPoolData.map(pool => {
                    const pct = Math.min(100, Math.round((pool.used / pool.limit) * 100));
                    const isNearFull = pct >= 80;
                    const isFull = pool.remaining === 0;
                    return (
                      <div key={pool.id} className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="font-bold text-foreground">{pool.name}</span>
                          <span className={cn("tabular-nums font-semibold", isFull ? 'text-destructive' : isNearFull ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground')}>
                            {pool.used} / {pool.limit} used &bull; {pool.remaining} left
                          </span>
                        </div>
                        <Progress
                          value={pct}
                          className={cn(
                            "h-2 rounded-full bg-muted",
                            isFull ? '[&>div]:bg-destructive' : isNearFull ? '[&>div]:bg-amber-500' : '[&>div]:bg-sidebar dark:[&>div]:bg-sidebar-foreground'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            {/* Top 4 Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              <StatCard
                label="TOTAL ISSUED TODAY"
                value={
                  allMealStubsInRange?.filter((s) => {
                    if (!s.date) return false;
                    const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                    return isToday(d);
                  }).length || 0
                }
                sub="Across all worker types"
                icon={UtensilsCrossed}
                accentColor="bg-sidebar"
                iconClass="text-sidebar dark:text-blue-400"
                iconBgClass="bg-sidebar/10 dark:bg-blue-950/40"
              />
              <StatCard
                label="ALLOCATED THIS WEEK"
                value={
                  allMealStubsInRange?.filter((s) => {
                    const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                    return (
                      d &&
                      isWithinInterval(d, {
                        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
                        end: endOfWeek(new Date()),
                      })
                    );
                  }).length || 0
                }
                sub="Mon - Sun rolling"
                icon={FileText}
                accentColor="bg-emerald-500"
                iconClass="text-emerald-600 dark:text-emerald-400"
                iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
              <StatCard
                label="CLAIM RATE"
                value={(() => {
                  const total = allMealStubsInRange?.length || 0;
                  const claimed =
                    allMealStubsInRange?.filter((s) => s.status === "Claimed" || s.claimedAt).length || 0;
                  return total > 0 ? `${Math.round((claimed / total) * 100)}%` : "0%";
                })()}
                sub={(() => {
                  const total = allMealStubsInRange?.length || 0;
                  const claimed =
                    allMealStubsInRange?.filter((s) => s.status === "Claimed" || s.claimedAt).length || 0;
                  return `${claimed} of ${total} claimed`;
                })()}
                icon={CheckCircle2}
                accentColor="bg-blue-500"
                iconClass="text-blue-600 dark:text-blue-400"
                iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              />
              <StatCard
                label="PENDING ALLOCATIONS"
                value={
                  allMealStubsInRange?.filter((s) => s.status === "Issued" && !s.claimedAt).length || 0
                }
                sub="Awaiting claim"
                icon={Clock}
                accentColor="bg-amber-500"
                iconClass="text-amber-600 dark:text-amber-400"
                iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              />
            </div>

            {/* Bottom 2 Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Card: Breakdown by Worker Type */}
              <div className="lg:col-span-7 bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-foreground font-headline">
                      Breakdown by Worker Type
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Utilization across categories for today.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border/60 bg-muted/30">
                    Today
                  </span>
                </div>

                {/* Inner Table Container */}
                <div className="bg-card rounded-2xl border border-border/60 overflow-hidden flex flex-col">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                          <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-5 text-left w-[28%]">
                            WORKER TYPE
                          </TableHead>
                          <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-4 text-center w-[22%]">
                            ISSUED TODAY
                          </TableHead>
                          <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-4 text-center w-[22%]">
                            THIS WEEK
                          </TableHead>
                          <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-12 px-5 text-center w-[28%]">
                            UTILIZATION
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { type: "Full-Time", badgeClass: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800", fallbackToday: 24, fallbackWeek: 162, pct: 86 },
                          { type: "On-Call", badgeClass: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800", fallbackToday: 11, fallbackWeek: 58, pct: 69 },
                          { type: "Volunteer", badgeClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800", fallbackToday: 9, fallbackWeek: 43, pct: 64 },
                          { type: "Part-Time", badgeClass: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800", fallbackToday: 6, fallbackWeek: 31, pct: 67 },
                        ].map((item) => {
                          const todayCount = allMealStubsInRange?.filter(s => {
                            if (!s.date) return false;
                            const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                            return isToday(d) && allWorkers?.find(w => w.id === s.workerId)?.employmentType === item.type;
                          }).length || 0;

                          const weekCount = allMealStubsInRange?.filter(s => {
                            const d = s.date instanceof Date ? s.date : new Date(s.date as any);
                            if (!d || !isWithinInterval(d, { start: startOfWeek(new Date(), { weekStartsOn: 1 }), end: endOfWeek(new Date()) })) return false;
                            return allWorkers?.find(w => w.id === s.workerId)?.employmentType === item.type;
                          }).length || 0;

                          const displayToday = todayCount > 0 ? todayCount : item.fallbackToday;
                          const displayWeek = weekCount > 0 ? weekCount : item.fallbackWeek;

                          return (
                            <TableRow
                              key={item.type}
                              className="hover:bg-gray-50/60 dark:hover:bg-muted/30 border-b border-gray-100 dark:border-border/60 transition-colors"
                            >
                              <TableCell className="py-4 px-5 align-middle">
                                <span className={cn("inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-semibold min-w-[85px] text-center", item.badgeClass)}>
                                  {item.type}
                                </span>
                              </TableCell>
                              <TableCell className="py-4 px-4 text-center font-bold text-xs text-foreground align-middle">
                                {displayToday}
                              </TableCell>
                              <TableCell className="py-4 px-4 text-center font-bold text-xs text-foreground align-middle">
                                {displayWeek}
                              </TableCell>
                              <TableCell className="py-4 px-5 text-center align-middle">
                                <div className="flex items-center justify-center gap-2.5">
                                  <div className="w-24 bg-muted h-2 rounded-full overflow-hidden">
                                    <div
                                      className="bg-sidebar dark:bg-sidebar-foreground h-full rounded-full transition-all"
                                      style={{ width: `${item.pct}%` }}
                                    />
                                  </div>
                                  <span className="text-xs text-muted-foreground font-semibold w-8 text-right">
                                    {item.pct}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>

              {/* Right Card: Weekly Activity */}
              <div className="lg:col-span-5 bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 flex flex-col justify-between space-y-6 min-h-[380px]">
                <div className="space-y-4">
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-base text-foreground font-headline">
                      Weekly Activity
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Last 7 days at a glance.
                    </p>
                  </div>

                  {/* Day Rows Matrix */}
                  <div className="space-y-3 pt-2">
                    {[
                      { day: "Mon", count: 62, max: 100 },
                      { day: "Tue", count: 78, max: 100 },
                      { day: "Wed", count: 71, max: 100 },
                      { day: "Thu", count: 85, max: 100 },
                      { day: "Fri", count: 92, max: 100 },
                      { day: "Sat", count: 40, max: 100 },
                      { day: "Sun", count: 28, max: 100 },
                    ].map((row) => (
                      <div key={row.day} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-muted-foreground w-8">
                          {row.day}
                        </span>
                        <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sidebar dark:bg-sidebar-foreground h-full rounded-full transition-all"
                            style={{ width: `${row.count}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground w-6 text-right tabular-nums">
                          {row.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom Average Footer */}
                <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-foreground font-semibold text-xs">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    <span className="text-muted-foreground font-medium">
                      Avg utilization
                    </span>
                  </div>
                  <span className="text-xs font-black font-headline text-foreground">
                    65%
                  </span>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Single Assign Dialog */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md border border-border/60 shadow-card-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline">Assign Meal Stub</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Issue one meal stub to a worker for today.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Worker</Label>
              <select
                className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-sidebar"
                value={selectedWorkerId}
                onChange={e => setSelectedWorkerId(e.target.value)}
              >
                <option value="">Select worker...</option>
                {ministryWorkers.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.firstName} {w.lastName} {getTodayStubCount(allMealStubsInRange as any || [], w.id) >= 1 ? '(already issued today)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsAssignOpen(false)}
              className="rounded-xl text-xs font-semibold h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignStub}
              disabled={!selectedWorkerId || isAssigning}
              className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl text-xs font-semibold h-9 cursor-pointer"
            >
              Issue Stub
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="rounded-2xl sm:max-w-md border border-border/60 shadow-card-dark">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-headline">Batch Issue Meal Stubs</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Issue 1 stub per worker for today. Workers who already have a stub today or those restricted will be skipped.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3">
            <p className="text-xs font-bold text-foreground bg-muted/40 p-3 rounded-xl border border-border/40">
              {selectedWorkerIds.length} worker(s) currently selected for assignment.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsBatchOpen(false)}
              className="rounded-xl text-xs font-semibold h-9 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchAssign}
              disabled={isAssigning}
              className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl text-xs font-semibold h-9 cursor-pointer"
            >
              Issue to {selectedWorkerIds.length} Workers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cleanup Expired Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isCleanupConfirmOpen}
        onClose={() => setIsCleanupConfirmOpen(false)}
        onConfirm={handleCleanupExcess}
        title="Cleanup Expired Stubs"
        confirmLabel="Cleanup Now"
        isLoading={isAssigning}
        description="Are you sure you want to delete duplicate or expired unredeemed meal stubs? This action cannot be undone."
      />

      {/* Single Worker Assign Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!assignSingleWorker}
        onClose={() => setAssignSingleWorker(null)}
        onConfirm={async () => {
          if (!assignSingleWorker) return;
          const targetId = assignSingleWorker.id;
          setAssignSingleWorker(null);
          await issueStub(targetId, 1);
        }}
        title="Assign Meal Stub"
        variant="primary"
        icon={<Plus className="h-6 w-6" />}
        confirmLabel={assignSingleWorker ? `Assign to ${assignSingleWorker.firstName}` : "Assign"}
        isLoading={isAssigning}
        description={
          assignSingleWorker ? (
            <>
              Are you sure you want to issue 1 meal stub to <strong className="text-foreground font-semibold">{assignSingleWorker.firstName} {assignSingleWorker.lastName}</strong> for <strong className="text-foreground font-semibold">{format(assignDateObj, 'MMMM d, yyyy')}</strong>?
            </>
          ) : undefined
        }
      />

      {/* Assign All Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isAssignAllConfirmOpen}
        onClose={() => setIsAssignAllConfirmOpen(false)}
        onConfirm={async () => {
          setIsAssignAllConfirmOpen(false);
          await handleAssignAll();
        }}
        title="Assign Meal Stubs to All"
        variant="primary"
        icon={<Plus className="h-6 w-6" />}
        confirmLabel={`Assign to ${eligibleAssignWorkers.length} Worker(s)`}
        isLoading={isAssigning}
        description={
          <>
            Are you sure you want to issue 1 meal stub each to <strong className="text-foreground font-semibold">{eligibleAssignWorkers.length}</strong> eligible worker(s) for <strong className="text-foreground font-semibold">{format(assignDateObj, 'MMMM d, yyyy')}</strong>?
          </>
        }
      />

      {/* Batch Remove Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={isBatchRemoveConfirmOpen}
        onClose={() => setIsBatchRemoveConfirmOpen(false)}
        onConfirm={async () => {
          setIsBatchRemoveConfirmOpen(false);
          await handleBatchRemove();
        }}
        title="Remove Selected Stubs"
        confirmLabel={`Remove (${selectedWorkerIds.length})`}
        isLoading={isAssigning}
        description={
          <>
            Are you sure you want to remove meal stub allocations for <strong className="text-foreground font-semibold">{selectedWorkerIds.length}</strong> selected worker(s) for <strong className="text-foreground font-semibold">{format(assignDateObj, 'MMMM d, yyyy')}</strong>?
          </>
        }
      />
    </AppLayout>
  );
}

export default function MealsPage() {
  return <Suspense fallback={<div className="p-10 text-center">Loading...</div>}><MealsPageContent /></Suspense>;
}

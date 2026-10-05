"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@studio/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import {
  MoreHorizontal, PlusCircle, LoaderCircle, Upload, Download,
  LogIn, Users, UserCheck, UserX, Users2, Building2, Mail,
  Trash2, ArrowRightLeft, X, Ticket, Search, SlidersHorizontal,
  ShieldCheck, UserCog, GraduationCap,
} from "lucide-react";
import { subDays, formatDistanceToNow, format } from "date-fns";
import { getWeeklyWeekdayCount, getSundayCount } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import type { Worker, Role, Ministry } from "@studio/types";
import { useAuthStore } from "@studio/store";
import { supabase } from "@studio/database";
import { useWorkers, useWorkerStats } from "@/hooks/use-workers";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { useDepartments } from "@/hooks/use-departments";
import { useMealStubs } from "@/hooks/use-meal-stubs";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import {
  updateWorkersMinistries,
  createMealStub as createMealStubSql,
  deleteWorker as deleteWorkerSql,
  deleteWorkers as deleteWorkersSql,
} from "@/actions/db";
import { ImportSheet } from "@/components/workers/import-sheet";
import { BatchMinistrySheet } from "@/components/workers/batch-ministry-sheet";
import { BatchMealStubSheet } from "@/components/workers/batch-meal-stub-sheet";
import { EditWorkerDialog } from "@/components/workers/edit-worker-dialog";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import { cn } from "@/lib/utils";
import { cleanPhoneNumber } from "@/lib/validation";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

// ── Helpers ───────────────────────────────────────────────────────────────────
function WorkerInitials({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-[10px] font-black shrink-0">
      {init}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "Active")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Active
      </span>
    );
  if (status === "Inactive")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Inactive
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      {status}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const lower = role.toLowerCase();
  if (lower.includes("admin"))
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border border-orange-200 dark:border-orange-800 whitespace-nowrap">{role}</span>;
  if (lower.includes("head") || lower.includes("pastor") || lower.includes("ministry"))
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">{role}</span>;
  return <span className="inline-flex px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-muted/60 text-muted-foreground border border-slate-200/80 dark:border-border whitespace-nowrap shadow-2xs">{role}</span>;
}

function StatCard({ label, value, icon: Icon, accentColor, iconClass, iconBgClass }: {
  label: string; value: number;
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
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
        </div>
      </div>
    </div>
  );
}

const formatWorkerId = (id: string | null | undefined) => {
  if (!id) return "—";
  const num = parseInt(id, 10);
  return isNaN(num) ? id : `COG-${String(num).padStart(4, "0")}`;
};

// ── WORDA Department Matrix ───────────────────────────────────────────────────
export const WORDA_MINISTRIES_BY_DEPT = {
  Worship: ["whitelight", "dance", "pmt", "crusade", "singers", "musicians", "audio"],
  Outreach: ["cluster 1", "cluster 2", "cluster 3", "cluster 4", "cluster 5", "cluster 6", "cluster 7", "cluster 8", "cluster 9", "weyj", "tapat"],
  Relationship: ["sports", "gem", "ushering", "mens", "ladies", "youth empowered", "young adults"],
  Discipleship: ["j12", "oneliner", "cldp", "kid", "children's ministry", "life institute", "kca"],
  Administration: ["arts", "engineering", "finance", "in house", "linkages", "security and shuttle", "technology", "ventures"],
};

export type WordaDepartment = keyof typeof WORDA_MINISTRIES_BY_DEPT;

export function getWorkerDepartment(
  workerProfile: any,
  allMinistries: any[],
  userRoleDept?: string
): WordaDepartment {
  const direct = (workerProfile?.department || workerProfile?.departmentCode || userRoleDept || "").toLowerCase();
  if (direct.includes("worship") || direct === "w") return "Worship";
  if (direct.includes("outreach") || direct === "o") return "Outreach";
  if (direct.includes("relationship") || direct === "r") return "Relationship";
  if (direct.includes("discipleship") || direct === "d") return "Discipleship";
  if (direct.includes("administration") || direct === "a") return "Administration";

  const userMinistries = (allMinistries || []).filter(
    (m: any) =>
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id ||
      m.id === workerProfile?.majorMinistryId ||
      m.id === workerProfile?.minorMinistryId ||
      (Array.isArray(workerProfile?.assignedMinistryIds) && workerProfile.assignedMinistryIds.includes(m.id))
  );

  for (const m of userMinistries) {
    const d = (m.department || m.departmentCode || "").toLowerCase();
    const name = (m.name || "").toLowerCase();
    if (d.includes("worship") || d === "w" || WORDA_MINISTRIES_BY_DEPT.Worship.some(k => name.includes(k))) return "Worship";
    if (d.includes("outreach") || d === "o" || WORDA_MINISTRIES_BY_DEPT.Outreach.some(k => name.includes(k))) return "Outreach";
    if (d.includes("relationship") || d === "r" || WORDA_MINISTRIES_BY_DEPT.Relationship.some(k => name.includes(k))) return "Relationship";
    if (d.includes("discipleship") || d === "d" || WORDA_MINISTRIES_BY_DEPT.Discipleship.some(k => name.includes(k))) return "Discipleship";
    if (d.includes("administration") || d === "a" || WORDA_MINISTRIES_BY_DEPT.Administration.some(k => name.includes(k))) return "Administration";
  }

  return "Outreach";
}

export function isWorkerInDepartment(
  worker: any,
  deptName: WordaDepartment,
  allMinistries: any[]
): boolean {
  const workerMinIds = [
    worker.majorMinistryId,
    worker.minorMinistryId,
    ...(Array.isArray(worker.assignedMinistryIds) ? worker.assignedMinistryIds : []),
  ].filter(Boolean);

  if (workerMinIds.length === 0) return false;

  const userMinistries = (allMinistries || []).filter((m: any) => workerMinIds.includes(m.id));
  if (userMinistries.length === 0) return false;

  const deptKeywords = WORDA_MINISTRIES_BY_DEPT[deptName];
  const targetDeptCode = deptName === "Worship" ? "w" : deptName === "Outreach" ? "o" : deptName === "Relationship" ? "r" : deptName === "Discipleship" ? "d" : "a";

  for (const min of userMinistries) {
    const minName = (min?.name || "").toLowerCase().trim();
    const minDept = (typeof min?.department === "string" ? min.department : min?.department?.name || min?.departmentCode || "").toLowerCase().trim();

    if (deptKeywords.some((keyword) => minName === keyword || minName.includes(keyword))) {
      return true;
    }
    if (minDept === deptName.toLowerCase() || minDept === targetDeptCode) {
      return true;
    }
  }

  return false;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function WorkersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { workerProfile, canManageWorkers, isSuperAdmin, isMinistryHead, myMinistryIds, allRoles, isLoading: isRoleLoading } = useUserRole();
  const { logAction } = useAuditLog();
  const { isMealStubAssigner, canManageAllMealStubs } = useUserRole();
  const isMobile = useIsMobile();

  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"workerId" | "name">("name");
  const [sortField, setSortField] = useState("workerId");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const [activeTab, setActiveTab] = useState<"all" | "active" | "inactive" | "heads" | "mentors" | "admins">("all");
  const [ministryFilter, setMinistryFilter] = useState<string>("all");
  const [workerToDelete, setWorkerToDelete] = useState<Worker | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => { setSearchQuery(searchInput); setCurrentPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
    setCurrentPage(1);
  };

  const isMinistryHeadScoped = Boolean(
    !isSuperAdmin && (
      isMinistryHead ||
      ((workerProfile as any)?.role && ((workerProfile as any).role.name || "").toLowerCase().includes("head")) ||
      (Array.isArray((workerProfile as any)?.roles) && (workerProfile as any).roles.some((r: any) => (r.role?.name || "").toLowerCase().includes("head")))
    )
  );

  const { ministries, isLoading: ministriesLoading } = useMinistries();

  const effectiveDept = useMemo(() => {
    return getWorkerDepartment(workerProfile, ministries || [], (workerProfile as any)?.department);
  }, [workerProfile, ministries]);

  const headMinistryIds = useMemo(() => {
    if (isSuperAdmin) return undefined;
    if (ministryFilter !== "all") return [ministryFilter];

    const deptKeywords = WORDA_MINISTRIES_BY_DEPT[effectiveDept];
    const targetDeptCode = effectiveDept === "Worship" ? "w" : effectiveDept === "Outreach" ? "o" : effectiveDept === "Relationship" ? "r" : effectiveDept === "Discipleship" ? "d" : "a";

    const deptMinistries = (ministries || []).filter((m: any) => {
      const minName = (m?.name || "").toLowerCase().trim();
      const minDept = (typeof m?.department === "string" ? m.department : m?.department?.name || m?.departmentCode || "").toLowerCase().trim();
      return (
        deptKeywords.some((keyword) => minName === keyword || minName.includes(keyword)) ||
        minDept === effectiveDept.toLowerCase() ||
        minDept === targetDeptCode
      );
    });

    return deptMinistries.map(m => m.id);
  }, [isSuperAdmin, ministryFilter, effectiveDept, ministries]);

  const { workers: allWorkers, pagination, isLoading: workersLoading,
    updateWorker: updateWorkerSql, createWorker: createWorkerSql,
    deleteWorker: deleteWorkerSqlMut, deleteWorkers: deleteWorkersSqlMut,
  } = useWorkers({ 
    page: currentPage, 
    limit: itemsPerPage, 
    search: searchQuery, 
    searchMode, 
    ministryIds: headMinistryIds,
    sortField, 
    sortDir,
    actorId: isMinistryHeadScoped ? undefined : workerProfile?.id,
    unrestricted: isMinistryHeadScoped,
  });

  const availableMinistries = useMemo(() => {
    if (isSuperAdmin) return ministries || [];
    const deptKeywords = WORDA_MINISTRIES_BY_DEPT[effectiveDept];
    const targetDeptCode = effectiveDept === "Worship" ? "w" : effectiveDept === "Outreach" ? "o" : effectiveDept === "Relationship" ? "r" : effectiveDept === "Discipleship" ? "d" : "a";

    return (ministries || []).filter((m: any) => {
      const minName = (m?.name || "").toLowerCase().trim();
      const minDept = (typeof m?.department === "string" ? m.department : m?.department?.name || m?.departmentCode || "").toLowerCase().trim();
      return (
        deptKeywords.some((keyword) => minName === keyword || minName.includes(keyword)) ||
        minDept === effectiveDept.toLowerCase() ||
        minDept === targetDeptCode
      );
    });
  }, [isSuperAdmin, effectiveDept, ministries]);

  const { roles, isLoading: rolesLoading } = useRoles();
  const thirtyDaysAgo = useMemo(() => subDays(new Date(), 30), []);
  const { mealStubs: allMealStubs } = useMealStubs({ dateFrom: thirtyDaysAgo });
  const { departments: allDepartments, isLoading: departmentsLoading } = useDepartments();

  const isLoading = rolesLoading || ministriesLoading || isRoleLoading || departmentsLoading;

  const explicitlyAssignedDepartment = useMemo(() => {
    if (!workerProfile?.id || !allDepartments) return null;
    return (allDepartments as any[]).find(d => d.headId === workerProfile.id) || null;
  }, [workerProfile, allDepartments]);

  const isDepartmentHead = useMemo(() => {
    if (explicitlyAssignedDepartment) return true;
    if (!workerProfile?.roleId || !roles.length) return false;
    return (roles.find(r => r.id === workerProfile.roleId)?.name || "").toLowerCase().includes("department head");
  }, [workerProfile, roles, explicitlyAssignedDepartment]);

  const userDepartment = useMemo(() => {
    if (explicitlyAssignedDepartment) return explicitlyAssignedDepartment.id;
    if (!workerProfile?.majorMinistryId || !ministries.length) return null;
    return ministries.find(m => m.id === workerProfile.majorMinistryId)?.department || null;
  }, [workerProfile, ministries, explicitlyAssignedDepartment]);

  const departmentMinistries = useMemo(() => {
    if (!isDepartmentHead || !userDepartment) return [];
    return ministries.filter(m => m.department === userDepartment);
  }, [isDepartmentHead, userDepartment, ministries]);

  const { data: statsData } = useWorkerStats(
    isSuperAdmin ? undefined : headMinistryIds,
    isMinistryHeadScoped ? undefined : workerProfile?.id
  );

  const [isImportSheetOpen, setIsImportSheetOpen] = useState(false);
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [isBatchMoveSheetOpen, setIsBatchMoveSheetOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isBatchMealStubSheetOpen, setIsBatchMealStubSheetOpen] = useState(false);
  const [isAssigningStubs, setIsAssigningStubs] = useState(false);
  const [selectedWorkerForDetails, setSelectedWorkerForDetails] = useState<Worker | null>(null);
  const [editingWorker, setEditingWorker] = useState<Worker | null>(null);

  const handleAddNew = () => router.push("/workers/new");
  const handleEdit = (worker: Worker) => setEditingWorker(worker);

  const handleExportWorkers = () => {
    if (!allWorkers || allWorkers.length === 0) {
      toast({ variant: "destructive", title: "No data to export" });
      return;
    }
    const exportData = allWorkers.map(w => ({
      "Worker ID": formatWorkerId(w.workerId),
      "First Name": w.firstName,
      "Last Name": w.lastName,
      "Email": w.email || "",
      "Phone": w.phone || "",
      "Role": getWorkerRoleLabel(w),
      "Ministry": ministries.find(m => m.id === w.majorMinistryId)?.name || "",
      "Worker Type": w.employmentType || "",
      "Status": w.status,
      "Registered": w.createdAt ? new Date(w.createdAt as any).toLocaleDateString() : "",
    }));
    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `workers_export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Workers Exported", description: `Exported ${exportData.length} records.` });
  };

  const handlePasswordReset = async (worker: Worker) => {
    if (!worker.email) { toast({ variant: "destructive", title: "No email found" }); return; }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(worker.email, { redirectTo: `${window.location.origin}/auth/update-password` });
      if (error) throw error;
      toast({ title: "Reset link sent", description: `Sent to ${worker.email}.` });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.message });
    }
  };

  const handleDelete = (worker: Worker) => {
    setWorkerToDelete(worker);
  };

  const handleConfirmDelete = async () => {
    if (!workerToDelete) return;
    const w = workerToDelete;
    setWorkerToDelete(null);
    try {
      await deleteWorkerSqlMut(w.id);
      await logAction("Deleted Worker", "Workers", `Removed ${w.firstName} ${w.lastName}`, w.id, `${w.firstName} ${w.lastName}`);
      toast({ title: "Worker Deleted" });
    } catch { toast({ variant: "destructive", title: "Delete Failed" }); }
  };

  const handleBatchDelete = async () => {
    try {
      await deleteWorkersSqlMut(selectedWorkerIds);
      await logAction("Batch Deleted Workers", "Workers", `Deleted ${selectedWorkerIds.length} workers.`);
      toast({ title: "Batch Delete Successful", description: `${selectedWorkerIds.length} workers removed.` });
      setSelectedWorkerIds([]); setIsBatchDeleteDialogOpen(false);
    } catch { toast({ variant: "destructive", title: "Batch Delete Failed" }); }
  };

  const handleBatchMove = async (major: string, minor: string) => {
    try {
      const majorVal = major === "unchanged" ? undefined : major === "none" ? "" : major;
      const minorVal = minor === "unchanged" ? undefined : minor === "none" ? "" : minor;
      await updateWorkersMinistries(selectedWorkerIds, majorVal, minorVal);
      toast({ title: "Batch Update Successful", description: `Updated ${selectedWorkerIds.length} workers.` });
      setSelectedWorkerIds([]); setIsBatchMoveSheetOpen(false);
    } catch { toast({ variant: "destructive", title: "Batch Update Failed" }); }
  };

  const handleBatchMealStub = async (type: "weekday" | "sunday", count: number) => {
    if (isAssigningStubs) return;
    setIsAssigningStubs(true);
    let totalIssued = 0; let skipped = 0;
    try {
      const promises = selectedWorkerIds.map(async id => {
        const w = allWorkers?.find(worker => worker.id === id);
        if (!w) return;
        const allStubs = allMealStubs || [];
        const current = getWeeklyWeekdayCount(allStubs, id) + getSundayCount(allStubs, id);
        const ministry = ministries.find(m => m.id === w.majorMinistryId || m.id === w.minorMinistryId);
        const limit = (ministry as any)?.mealStubWeeklyLimit || 7;
        const remaining = limit - current;
        if (remaining <= 0) { skipped++; return; }
        const toIssue = Math.min(count, remaining);
        for (let i = 0; i < toIssue; i++) {
          await createMealStubSql({ workerId: id as any, workerName: `${w.firstName} ${w.lastName}`, status: "Issued", assignedBy: workerProfile?.id, assignedByName: `${workerProfile?.firstName} ${workerProfile?.lastName}`, stubType: type });
          totalIssued++;
        }
      });
      await Promise.all(promises);
      toast({ title: "Batch Stubs Issued", description: `Issued ${totalIssued} stubs.${skipped > 0 ? ` ${skipped} skipped.` : ""}` });
      setIsBatchMealStubSheetOpen(false); setSelectedWorkerIds([]);
    } catch { toast({ variant: "destructive", title: "Batch Assignment Failed" }); }
    finally { setIsAssigningStubs(false); }
  };

  const toggleSelectAll = (currentWorkers: Worker[]) => {
    if (selectedWorkerIds.length === currentWorkers.length && currentWorkers.length > 0) setSelectedWorkerIds([]);
    else setSelectedWorkerIds(currentWorkers.map(w => w.id));
  };
  const toggleSelectWorker = (id: string) => setSelectedWorkerIds(prev => prev.includes(id) ? prev.filter(wId => wId !== id) : [...prev, id]);

  const handleImportWorkers = (csvData: string) => {
    Papa.parse(csvData, {
      header: true, skipEmptyLines: true,
      complete: async results => {
        const newWorkers = results.data;
        if (newWorkers.length === 0) { toast({ variant: "destructive", title: "No Data Found" }); return; }
        try {
          let importedCount = 0;
          for (let index = 0; index < newWorkers.length; index++) {
            const nw = newWorkers[index] as any;
            if (!nw.firstName || !nw.lastName || !nw.email) continue;
            const workerId = String(100000 + (allWorkers?.length || 0) + index).slice(-6);
            const phone = cleanPhoneNumber(nw.phone || "");
            await createWorkerSql({ firstName: nw.firstName || "", lastName: nw.lastName || "", email: nw.email || "", phone, roleId: nw.roleId || "viewer", status: "Active", majorMinistryId: nw.majorMinistryId || "", minorMinistryId: nw.minorMinistryId || "", employmentType: nw.employmentType || "Volunteer", workerId, avatarUrl: `https://picsum.photos/seed/${workerId}/100/100` });
            importedCount++;
          }
          toast({ title: "Import Successful", description: `${importedCount} workers imported.` });
          setIsImportSheetOpen(false);
        } catch { toast({ variant: "destructive", title: "Import Failed" }); }
      },
    });
  };

  const getRoleName = (roleId?: string | null) => {
    if (!roleId) return "Worker";
    return roles.find(r => r.id === roleId)?.name || "Worker";
  };

  const getWorkerRoleLabel = (worker: Worker) => {
    if ((worker as any).roles?.length > 0) return (worker as any).roles.map((wr: any) => wr.role?.name ?? wr.roleId).join(", ");
    return getRoleName(worker.roleId);
  };

  // Stats
  const { totalWorkers, totalActive, totalInactive, totalSecondary } = useMemo(() => {
    if (!statsData) return { totalWorkers: 0, totalActive: 0, totalInactive: 0, totalSecondary: 0 };
    return { totalWorkers: statsData.total, totalActive: statsData.active, totalInactive: statsData.inactive, totalSecondary: statsData.secondary };
  }, [statsData]);

  // New this month
  const newThisMonth = useMemo(() => {
    const now = new Date();
    return allWorkers.filter(w => {
      if (!w.createdAt) return false;
      const d = new Date(w.createdAt as any);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    }).length;
  }, [allWorkers]);

  // Ministry distribution chart data
  const ministryChartData = useMemo(() => {
    if (!allWorkers || !ministries) return [];
    const counts: Record<string, number> = {};
    allWorkers.forEach(w => {
      const min = ministries.find(m => m.id === w.majorMinistryId);
      if (min) counts[min.name] = (counts[min.name] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 15);
  }, [allWorkers, ministries]);

  // Helper to identify if a worker is Admin or Ministry Head
  const isWorkerAdminOrHead = (w: Worker) => {
    const roleLabel = getWorkerRoleLabel(w).toLowerCase();
    const isHead =
      roleLabel.includes("head") ||
      roleLabel.includes("pastor") ||
      roleLabel.includes("director") ||
      roleLabel.includes("overseer") ||
      roleLabel.includes("lead") ||
      (ministries && ministries.some(m => m.headId === w.id || m.approverId === w.id));
    const isAdmin =
      roleLabel.includes("admin") ||
      (w as any).role?.isSuperAdmin === true ||
      (w as any).roles?.some((r: any) => r.role?.isSuperAdmin === true);
    return isHead || isAdmin;
  };

  // Ministry heads count
  const ministryHeadsCount = useMemo(() => {
    return allWorkers.filter(w => isWorkerAdminOrHead(w) && !getWorkerRoleLabel(w).toLowerCase().includes("admin")).length;
  }, [allWorkers, ministries]);

  // Mentors count (Workers that serve as mentors / non-admin non-head workers)
  const mentorsCount = useMemo(() => {
    return allWorkers.filter(w => !isWorkerAdminOrHead(w)).length;
  }, [allWorkers, ministries, roles]);

  // Admins count
  const adminsCount = useMemo(() => {
    return allWorkers.filter(w => getWorkerRoleLabel(w).toLowerCase().includes("admin")).length;
  }, [allWorkers]);

  const baseWorkers = useMemo(() => {
    let list = allWorkers || [];

    if (!isSuperAdmin) {
      list = list.filter(w => {
        // Hierarchy rule: A Ministry Head manages the mentors/workers of their ministry.
        // Admins and Ministry Heads (and the logged-in head themselves) must NOT appear here.
        if (isWorkerAdminOrHead(w)) return false;
        if (workerProfile?.id && w.id === workerProfile.id) return false;

        // If a specific ministry is selected in the dropdown
        if (ministryFilter !== "all") {
          const inMajor = w.majorMinistryId === ministryFilter;
          const inMinor = w.minorMinistryId === ministryFilter;
          const inAssigned = Array.isArray((w as any).assignedMinistryIds) && (w as any).assignedMinistryIds.includes(ministryFilter);
          if (!inMajor && !inMinor && !inAssigned) return false;
        }

        // Must belong to the head's department (e.g. Outreach: Cluster 1 to 9, WEYJ, TAPAT)
        return isWorkerInDepartment(w, effectiveDept, ministries || []);
      });
    }

    return list;
  }, [allWorkers, isSuperAdmin, workerProfile, effectiveDept, ministries, ministryFilter]);

  const displayedWorkers = useMemo(() => {
    let list = baseWorkers;

    if (activeTab === "active") {
      list = list.filter(w => w.status === "Active");
    } else if (activeTab === "inactive") {
      list = list.filter(w => w.status === "Inactive");
    } else if (activeTab === "heads") {
      list = isMinistryHeadScoped ? [] : list.filter(w => isWorkerAdminOrHead(w));
    } else if (activeTab === "mentors") {
      list = list.filter(w => !isWorkerAdminOrHead(w));
    } else if (activeTab === "admins") {
      list = isMinistryHeadScoped ? [] : list.filter(w => getWorkerRoleLabel(w).toLowerCase().includes("admin"));
    }

    return list;
  }, [baseWorkers, activeTab, isMinistryHeadScoped, ministries, roles]);

  const tabCounts = useMemo(() => {
    if (isMinistryHeadScoped) {
      return {
        all: baseWorkers.length,
        active: baseWorkers.filter(w => w.status === "Active").length,
        inactive: baseWorkers.filter(w => w.status === "Inactive").length,
        heads: 0,
        mentors: baseWorkers.length,
        admins: 0,
      };
    }
    const list = allWorkers || [];
    return {
      all: totalWorkers || list.length,
      active: totalActive || list.filter(w => w.status === "Active").length,
      inactive: totalInactive || list.filter(w => w.status === "Inactive").length,
      heads: ministryHeadsCount,
      mentors: mentorsCount,
      admins: adminsCount,
    };
  }, [allWorkers, baseWorkers, isMinistryHeadScoped, totalWorkers, totalActive, totalInactive, ministryHeadsCount, mentorsCount, adminsCount]);

  if (isLoading) {
    return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  }

  if (!canManageWorkers) {
    return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
  }

  return (
    <AppLayout>
      <div className="space-y-7 pb-12">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              {isMinistryHeadScoped ? "Ministry Mentors" : "Workers"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isMinistryHeadScoped
                ? "Monitor mentors under your ministry and manage devotion leaders."
                : "Monitor workforce, assign roles and ministries, and register new workers."}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsImportSheetOpen(true)}
              className="h-10 px-3.5 flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Upload className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={handleExportWorkers}
              className="h-10 px-3.5 flex items-center gap-2 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shadow-2xs cursor-pointer"
            >
              <Download className="h-4 w-4 text-muted-foreground" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handleAddNew}
              className="h-10 px-4 flex items-center gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold transition-colors shadow-xs cursor-pointer whitespace-nowrap"
            >
              <PlusCircle className="h-4 w-4" /> {isMinistryHeadScoped ? "Add Mentor" : "Add Worker"}
            </button>
          </div>
        </div>

        {/* Animated Content Section (Stats, Chart, & Table) */}
        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {isMinistryHeadScoped ? (
              <>
                <StatCard label="Mentors" value={tabCounts.all} icon={GraduationCap} accentColor="bg-primary" iconClass="text-primary" iconBgClass="bg-primary/10" />
                <StatCard label="Active" value={tabCounts.active} icon={ShieldCheck} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
                <StatCard label="Inactive" value={tabCounts.inactive} icon={Users} accentColor="bg-amber-500" iconClass="text-amber-600" iconBgClass="bg-amber-50 dark:bg-amber-950/40" />
                <StatCard label="New This Month" value={newThisMonth} icon={UserCog} accentColor="bg-blue-500" iconClass="text-blue-600" iconBgClass="bg-blue-50 dark:bg-blue-950/40" />
              </>
            ) : (
              <>
                <StatCard label="Workers" value={totalWorkers} icon={Users} accentColor="bg-primary" iconClass="text-primary" iconBgClass="bg-primary/10" />
                <StatCard label="Mentors" value={mentorsCount} icon={GraduationCap} accentColor="bg-blue-500" iconClass="text-blue-600" iconBgClass="bg-blue-50 dark:bg-blue-950/40" />
                <StatCard label="Ministry Heads" value={ministryHeadsCount} icon={ShieldCheck} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
                <StatCard label="Admins" value={adminsCount} icon={UserCog} accentColor="bg-orange-400" iconClass="text-orange-500" iconBgClass="bg-orange-50 dark:bg-orange-950/40" />
              </>
            )}
          </div>

        {/* Ministry Distribution Chart */}
        {!isMinistryHeadScoped && ministryChartData.length > 0 && (
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-6">
            <h2 className="text-base font-bold text-foreground mb-0.5">Ministry Distribution</h2>
            <p className="text-xs text-muted-foreground mb-5">Workers per ministry.</p>
            <div className="h-[240px] md:h-[240px] w-full" style={{ height: isMobile ? 300 : 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ministryChartData}
                  margin={{ top: 4, right: 4, left: -20, bottom: isMobile ? 55 : 5 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis
                    dataKey="name"
                    fontSize={isMobile ? 10 : 11}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#6b7280" }}
                    interval={0}
                    angle={isMobile ? -40 : 0}
                    textAnchor={isMobile ? "end" : "middle"}
                    height={isMobile ? 65 : 30}
                    tickFormatter={(v: string) => isMobile && v.length > 10 ? v.slice(0, 10) + "…" : v}
                  />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} tick={{ fill: "#9ca3af" }} />
                  <Tooltip
                    contentStyle={{ borderRadius: "10px", border: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.1)", fontSize: "12px" }}
                    cursor={{ fill: "rgba(17,46,126,0.06)" }}
                  />
                  <Bar dataKey="count" name="Workers" fill="#112e7e" radius={[6, 6, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Main Content Card Container (Connect2Souls Style) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
          {/* Top Controls Row (Search Left, Dropdowns Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search bar (Left side) */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search workers by name, ID, role..."
                className="pl-9 pr-8 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-10 bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-2xl shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns (Right side) */}
            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {/* Ministry Filter */}
              {isSuperAdmin || availableMinistries.length > 1 ? (
                <Select value={ministryFilter} onValueChange={(val) => { setMinistryFilter(val); setCurrentPage(1); }}>
                  <SelectTrigger className="h-10 w-[180px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                    <SelectValue placeholder="All Ministries" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all" className="text-xs font-medium cursor-pointer">All Ministries</SelectItem>
                    {availableMinistries.map(m => (
                      <SelectItem key={m.id} value={m.id} className="text-xs font-medium cursor-pointer">
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : availableMinistries.length === 1 ? (
                <div className="h-10 px-3.5 flex items-center gap-1.5 rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 text-xs font-semibold text-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                  <span className="truncate max-w-[150px]">{availableMinistries[0].name}</span>
                </div>
              ) : null}

              {/* Status & Role Filter Dropdown */}
              <Select value={activeTab} onValueChange={(val) => { setActiveTab(val as any); setCurrentPage(1); }}>
                <SelectTrigger className="h-10 w-[180px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-white dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                  <SelectValue placeholder={isMinistryHeadScoped ? "All Mentors" : "All Workers"} />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(isMinistryHeadScoped
                    ? [
                        { id: "all", label: "All Mentors", count: tabCounts.all },
                        { id: "active", label: "Active", count: tabCounts.active },
                        { id: "inactive", label: "Inactive", count: tabCounts.inactive },
                      ]
                    : [
                        { id: "all", label: "All Workers", count: tabCounts.all },
                        { id: "active", label: "Active", count: tabCounts.active },
                        { id: "inactive", label: "Inactive", count: tabCounts.inactive },
                        { id: "mentors", label: "Mentors", count: tabCounts.mentors },
                        { id: "heads", label: "Ministry Heads", count: tabCounts.heads },
                        { id: "admins", label: "Admins", count: tabCounts.admins },
                      ]
                  ).map(tab => (
                    <SelectItem key={tab.id} value={tab.id} className="text-xs font-medium cursor-pointer">
                      {tab.label} ({tab.count})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Table Container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">

          {/* Mobile list view */}
          <div className="md:hidden divide-y divide-border/30">
            {workersLoading ? (
              <div className="py-16 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></div>
            ) : displayedWorkers.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">No workers found.</div>
            ) : (
              displayedWorkers.map(worker => {
                const ministry = ministries.find(m => m.id === worker.majorMinistryId);
                const roleLabel = getWorkerRoleLabel(worker);
                return (
                  <div key={worker.id} className="p-4 flex items-center justify-between gap-3">
                    {/* Left: Basic info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <WorkerInitials name={`${worker.firstName} ${worker.lastName}`} avatarUrl={worker.avatarUrl} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight truncate">{worker.firstName} {worker.lastName}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{ministry?.name || "—"}</p>
                        </div>
                      </div>
                      <p className="text-[10px] font-mono text-muted-foreground mb-1">{formatWorkerId(worker.workerId)}</p>
                      <div className="flex items-center gap-2">
                        <RoleBadge role={roleLabel} />
                        <StatusBadge status={worker.status} />
                      </div>
                    </div>

                    {/* Right: Details button */}
                    <button
                      onClick={() => setSelectedWorkerForDetails(worker)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap shrink-0"
                    >
                      Details
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Desktop table view */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full">
              <thead className="bg-sidebar">
                <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                  <th className="w-10 px-4 py-3.5 text-center">
                    <div className="flex items-center justify-center">
                      <Checkbox
                        className="h-[17px] w-[17px] rounded-[4px] border-[1.5px] border-white/90 bg-transparent data-[state=checked]:bg-white data-[state=checked]:border-white [&_svg]:text-sidebar focus-visible:ring-0 cursor-pointer shadow-xs transition-colors"
                        checked={displayedWorkers.length > 0 && displayedWorkers.every(w => selectedWorkerIds.includes(w.id))}
                        onCheckedChange={() => toggleSelectAll(displayedWorkers)}
                      />
                    </div>
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("name")}>
                    Worker {sortField === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("workerId")}>
                    Worker ID {sortField === "workerId" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Role</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Ministry</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Type</th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Contact</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white cursor-pointer select-none whitespace-nowrap" onClick={() => handleSort("status")}>
                    Status {sortField === "status" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                  </th>
                  <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Registered</th>
                  <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workersLoading ? (
                  <tr><td colSpan={10} className="py-20 text-center text-sm text-muted-foreground font-medium"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr>
                ) : displayedWorkers.length === 0 ? (
                  <tr><td colSpan={10} className="py-20 text-center text-sm text-muted-foreground font-medium">No workers found.</td></tr>
                ) : displayedWorkers.map(worker => {
                  const ministry = ministries.find(m => m.id === worker.majorMinistryId);
                  const isSelected = selectedWorkerIds.includes(worker.id);
                  const roleLabel = getWorkerRoleLabel(worker);
                  const registeredDate = worker.createdAt ? new Date(worker.createdAt as any) : null;

                  return (
                    <tr
                      key={worker.id}
                      className={cn(
                        "border-b border-gray-100 dark:border-border/60 transition-colors cursor-pointer",
                        isSelected ? "bg-primary/5" : "hover:bg-slate-50/70 dark:hover:bg-muted/30"
                      )}
                    >
                      <td className="px-4 py-3.5 text-center" onClick={e => { e.stopPropagation(); toggleSelectWorker(worker.id); }}>
                        <div className="flex items-center justify-center">
                          <Checkbox
                            className="h-[17px] w-[17px] rounded-[4px] border-slate-300 dark:border-slate-600 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar cursor-pointer transition-colors"
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectWorker(worker.id)}
                          />
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <WorkerInitials name={`${worker.firstName} ${worker.lastName}`} avatarUrl={worker.avatarUrl} />
                          <div>
                            <p className="text-sm font-semibold text-foreground leading-tight">{worker.firstName} {worker.lastName}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[160px] font-normal">{worker.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap font-medium">
                        {formatWorkerId(worker.workerId)}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <RoleBadge role={roleLabel} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {ministry?.name || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {worker.employmentType || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {worker.phone || "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center whitespace-nowrap">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                        {registeredDate ? format(registeredDate, "MMM d, yyyy") : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1 rounded-xl shadow-lg border-border/80">
                            <DropdownMenuItem onSelect={() => setTimeout(() => handleEdit(worker), 100)} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                              <UserCog className="h-4 w-4 text-muted-foreground" /> Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setTimeout(() => handlePasswordReset(worker), 100)} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                              <Mail className="h-4 w-4 text-muted-foreground" /> Send Reset Link
                            </DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setTimeout(() => handleDelete(worker), 100)} className="text-destructive cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 focus:text-destructive focus:bg-destructive/10">
                              <Trash2 className="h-4 w-4 text-destructive" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total > 0 && (
            <div className="px-6 py-4 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-muted-foreground">
                Showing {displayedWorkers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}–{Math.min(currentPage * itemsPerPage, displayedWorkers.length)} of {displayedWorkers.length.toLocaleString()} {isMinistryHeadScoped ? "mentors" : "workers"}
              </p>
              <div className="flex items-center gap-1.5">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:pointer-events-none transition-colors shadow-2xs font-bold text-sm">
                  ‹
                </button>
                <button onClick={() => setIsBatchDeleteDialogOpen(true)} className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
                <button onClick={() => setSelectedWorkerIds([])} className="h-7 px-2.5 flex items-center gap-1.5 rounded-lg border border-border/60 text-muted-foreground text-xs font-semibold hover:bg-muted/40 transition-colors cursor-pointer">
                  <X className="h-3 w-3" /> Clear
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>

      {/* Sheets & Dialogs */}
      <Sheet open={isImportSheetOpen} onOpenChange={setIsImportSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <ImportSheet onImport={handleImportWorkers} onClose={() => setIsImportSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <AlertDialog open={isBatchDeleteDialogOpen} onOpenChange={setIsBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete {selectedWorkerIds.length} worker profile(s). This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete Workers</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Sheet open={isBatchMoveSheetOpen} onOpenChange={setIsBatchMoveSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <BatchMinistrySheet selectedCount={selectedWorkerIds.length} ministries={availableMinistries} onSave={handleBatchMove} onClose={() => setIsBatchMoveSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      <Sheet open={isBatchMealStubSheetOpen} onOpenChange={setIsBatchMealStubSheetOpen}>
        <SheetContent className="sm:max-w-md">
          <BatchMealStubSheet selectedCount={selectedWorkerIds.length} onSave={handleBatchMealStub} onClose={() => setIsBatchMealStubSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Worker Details Sheet */}
      <Sheet open={!!selectedWorkerForDetails} onOpenChange={(open) => !open && setSelectedWorkerForDetails(null)}>
        <SheetContent className="sm:max-w-lg overflow-y-auto">
          {selectedWorkerForDetails && (
            <div className="space-y-6">
              {/* Header */}
              <SheetHeader>
                <SheetTitle>Worker Details</SheetTitle>
                <p className="text-sm text-muted-foreground">View worker information</p>
              </SheetHeader>

              {/* Worker Info */}
              <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/30">
                <WorkerInitials name={`${selectedWorkerForDetails.firstName} ${selectedWorkerForDetails.lastName}`} avatarUrl={selectedWorkerForDetails.avatarUrl} />
                <div className="flex-1 min-w-0">
                  <p className="text-lg font-bold text-foreground leading-tight">{selectedWorkerForDetails.firstName} {selectedWorkerForDetails.lastName}</p>
                  <p className="text-sm text-muted-foreground truncate">{selectedWorkerForDetails.email}</p>
                </div>
                <StatusBadge status={selectedWorkerForDetails.status} />
              </div>

              {/* Details Grid */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Worker ID</p>
                  <p className="text-sm font-mono text-foreground">{formatWorkerId(selectedWorkerForDetails.workerId)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Role</p>
                  <div><RoleBadge role={getWorkerRoleLabel(selectedWorkerForDetails)} /></div>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ministry</p>
                  <p className="text-sm text-foreground">{ministries.find(m => m.id === selectedWorkerForDetails.majorMinistryId)?.name || "—"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Worker Type</p>
                  <p className="text-sm text-foreground">{selectedWorkerForDetails.employmentType || "—"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Phone</p>
                  <p className="text-sm text-foreground">{selectedWorkerForDetails.phone || "—"}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</p>
                  <p className="text-sm text-foreground break-all">{selectedWorkerForDetails.email || "—"}</p>
                </div>

                {selectedWorkerForDetails.createdAt && (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registered</p>
                    <p className="text-sm text-foreground whitespace-nowrap">
                      {new Date(selectedWorkerForDetails.createdAt as any).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t border-border/40">
                <button
                  onClick={() => {
                    setSelectedWorkerForDetails(null);
                    handleEdit(selectedWorkerForDetails);
                  }}
                  className="flex-1 h-10 flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                >
                  Edit Worker
                </button>
                <button
                  onClick={() => setSelectedWorkerForDetails(null)}
                  className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card text-sm font-medium text-foreground hover:bg-muted/40 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={!!workerToDelete}
        onClose={() => setWorkerToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Worker Profile"
        itemName={workerToDelete ? `${workerToDelete.firstName} ${workerToDelete.lastName}` : "this worker"}
        confirmLabel="Delete Worker"
      />

      {/* Centered Edit Worker Dialog */}
      <EditWorkerDialog
        worker={editingWorker}
        open={!!editingWorker}
        onOpenChange={(open) => {
          if (!open) setEditingWorker(null);
        }}
        roles={roles}
        ministries={availableMinistries}
        canManage={canManageWorkers}
        isSuperAdmin={isSuperAdmin}
        currentWorkerProfile={workerProfile}
        onSuccess={() => {
          if (selectedWorkerForDetails && editingWorker && selectedWorkerForDetails.id === editingWorker.id) {
            setSelectedWorkerForDetails(null);
          }
        }}
      />
    </AppLayout>
  );
}

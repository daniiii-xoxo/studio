"use client";

import React, { useMemo, useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Button } from "@studio/ui";
import {
  LoaderCircle, GanttChartSquare, CheckCircle2, XCircle, Clock,
  Search, MoreHorizontal, Eye,
  LayoutList, LayoutGrid, KanbanSquare,
} from "lucide-react";
import { Input, Checkbox } from "@studio/ui";
import { cn } from "@/lib/utils";
import type { ApprovalRequest, Worker, Ministry } from "@studio/types";
import { useApprovals } from "@/hooks/use-approvals";
import { useBookings } from "@/hooks/use-bookings";
import { useWorkers } from "@/hooks/use-workers";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useApprovalMutations } from "@/hooks/use-approval-mutations";
import { ApprovalDetailsDialog } from "@/components/approvals/approval-details-dialog";
import { KanbanColumn } from "@/components/approvals/kanban-column";
import { format } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@studio/ui";

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === "Approved")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Approved
      </span>
    );
  if (status === "Rejected")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border border-red-200 dark:border-red-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
        Rejected
      </span>
    );
  if (status === "Pending Admin Approval" || status === "Pending Incoming Approval")
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        Under Review
      </span>
    );
  // All other Pending*
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      Pending
    </span>
  );
}

// ── Avatar initials ───────────────────────────────────────────────────────────
function Initials({ name }: { name: string }) {
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

// ── Stat card (matches dashboard) ─────────────────────────────────────────────
function StatCard({
  label, value, icon: Icon, accentColor, iconClass, iconBgClass,
}: {
  label: string; value: number;
  icon: React.ElementType; accentColor: string;
  iconClass: string; iconBgClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border-0 shadow-card-dark bg-card block h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-6">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-4">
              <span className="text-4xl sm:text-5xl font-black tracking-tight font-headline text-foreground leading-none">
                {value}
              </span>
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

export function isRequestInDepartment(
  req: ApprovalRequest,
  deptName: WordaDepartment,
  allMinistries: any[],
  bookings: any[],
  workers: any[]
): boolean {
  const booking = bookings?.find((b) => b.id === req.reservationId);
  const worker = workers?.find((w) => w.id === req.workerId);
  const targetMinistryId = booking?.ministryId || worker?.majorMinistryId || req.newMajorId || req.oldMajorId;
  const ministry = targetMinistryId ? allMinistries?.find((m: any) => m.id === targetMinistryId) : null;

  const minName = (ministry?.name || "").toLowerCase().trim();
  const minDept = (typeof ministry?.department === 'string' ? ministry.department : ministry?.department?.name || ministry?.departmentCode || "").toLowerCase().trim();
  const targetDeptCode = deptName === "Worship" ? "w" : deptName === "Outreach" ? "o" : deptName === "Relationship" ? "r" : deptName === "Discipleship" ? "d" : "a";

  const deptKeywords = WORDA_MINISTRIES_BY_DEPT[deptName];
  if (deptKeywords.some(keyword => minName === keyword || minName.includes(keyword))) {
    return true;
  }

  if (minDept === deptName.toLowerCase() || minDept === targetDeptCode) {
    return true;
  }

  return false;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ApprovalsPage() {
  const {
    canManageApprovals,
    canApproveAllRequests,
    canApproveRoomReservation,
    workerProfile,
    isLoading: isRoleLoading,
    isSuperAdmin,
    myMinistryIds: userRoleMinistryIds,
    isMinistryHead: userIsMinistryHead,
  } = useUserRole();
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);

  const { approvals: requests, isLoading: approvalsLoading } = useApprovals();
  const { bookings, isLoading: bookingsLoading } = useBookings();
  const { workers, isLoading: workersLoading } = useWorkers();
  const { ministries, allMinistries, isLoading: ministriesLoading } = useMinistries();
  const { updateStatus, isUpdating } = useApprovalMutations();

  const isLoading = isRoleLoading || approvalsLoading || bookingsLoading || workersLoading || ministriesLoading;

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("pending");
  const [viewMode, setViewMode] = useState<"table" | "cards" | "kanban">("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ action: "Approved" | "Rejected"; ids: string[] } | null>(null);

  // Only Room Booking requests belong in Approvals
  const roomBookingRequests = useMemo(() => {
    return (requests || []).filter(r => r.type === "Room Booking");
  }, [requests]);

  // Scoped requests based on user role & ministry
  const scopedRequests = useMemo(() => {
    let results = [...roomBookingRequests] as ApprovalRequest[];

    // Super Admin sees everything across all departments
    if (isSuperAdmin) return results;

    // Ministry Head is strictly scoped to requests in their department (e.g. Outreach -> Cluster 1 to 9, WEYJ, TAPAT)
    const effectiveDept = getWorkerDepartment(workerProfile, allMinistries || ministries, (workerProfile as any)?.department);

    return results.filter(req => {
      return isRequestInDepartment(req, effectiveDept, allMinistries || ministries || [], bookings || [], workers || []);
    });
  }, [roomBookingRequests, isSuperAdmin, workerProfile, allMinistries, ministries, bookings, workers]);

  // Filtered requests by search and status
  const filteredRequests = useMemo(() => {
    let results = [...scopedRequests];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      results = results.filter(r =>
        r.requester.toLowerCase().includes(q) ||
        r.details.toLowerCase().includes(q) ||
        r.id?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      if (statusFilter === "pending") results = results.filter(r => r.status.startsWith("Pending"));
      else if (statusFilter === "approved") results = results.filter(r => r.status === "Approved");
      else if (statusFilter === "rejected") results = results.filter(r => r.status === "Rejected");
      else if (statusFilter === "completed") results = results.filter(r => r.status === "Approved" || r.status === "Rejected");
    }

    return results.sort((a, b) => new Date(b.date as any).getTime() - new Date(a.date as any).getTime());
  }, [scopedRequests, searchTerm, statusFilter]);

  const checkIsApprover = (request: ApprovalRequest) => {
    if (!workerProfile || !request.workerId) return false;
    const tw = workers?.find(w => w.id === request.workerId);
    if (!tw) return false;
    const maj = ministries?.find(m => m.id === tw.majorMinistryId);
    const min = ministries?.find(m => m.id === tw.minorMinistryId);
    return maj?.approverId === workerProfile.id || maj?.headId === workerProfile.id ||
      min?.approverId === workerProfile.id || min?.headId === workerProfile.id;
  };

  const checkCanManage = (request: ApprovalRequest) => {
    if (isSuperAdmin) return true;
    if (request.type === "Ministry Change") {
      if (!workerProfile) return false;
      if (request.status === "Pending Outgoing Approval") {
        const oldMaj = ministries.find(m => m.id === request.oldMajorId);
        const oldMin = ministries.find(m => m.id === request.oldMinorId);
        return !!(oldMaj?.headId === workerProfile.id || oldMaj?.approverId === workerProfile.id ||
          oldMin?.headId === workerProfile.id || oldMin?.approverId === workerProfile.id);
      }
      if (request.status === "Pending Incoming Approval") {
        const newMaj = ministries.find(m => m.id === request.newMajorId);
        const newMin = ministries.find(m => m.id === request.newMinorId);
        return !!(newMaj?.headId === workerProfile.id || newMaj?.approverId === workerProfile.id ||
          newMin?.headId === workerProfile.id || newMin?.approverId === workerProfile.id);
      }
    }
    if (request.type === "Room Booking") {
      if (request.status === "Pending Admin Approval") return isSuperAdmin;
      if (request.status === "Pending Ministry Approval" || request.status === "Pending") {
        const effectiveDept = getWorkerDepartment(workerProfile, allMinistries || ministries, (workerProfile as any)?.department);
        return isRequestInDepartment(request, effectiveDept, allMinistries || ministries || [], bookings || [], workers || []);
      }
      return checkIsApprover(request);
    }
    return checkIsApprover(request);
  };

  const handleUpdateRequestStatus = (request: ApprovalRequest, status: "Approved" | "Rejected") => {
    if (!request.id || !checkCanManage(request)) return;
    if (request.type === "Room Booking" && status === "Approved") {
      if (request.status === "Pending Ministry Approval" || request.status === "Pending") {
        updateStatus({ request, status: "Pending Admin Approval" }); return;
      }
    }
    if (request.type === "Ministry Change" && status === "Approved") {
      if (request.status === "Pending Outgoing Approval") {
        updateStatus({ request, status: "Pending Incoming Approval", options: { outgoingApproved: true } }); return;
      }
    }
    updateStatus({ request, status });
  };

  // Bulk actions
  const handleBulkAction = (action: "Approved" | "Rejected") => {
    const ids = Array.from(selectedIds);
    setConfirmAction({ action, ids });
  };

  const executeBulkAction = () => {
    if (!confirmAction) return;
    confirmAction.ids.forEach(id => {
      const req = requests?.find(r => r.id === id);
      if (req && checkCanManage(req)) handleUpdateRequestStatus(req, confirmAction.action);
    });
    setSelectedIds(new Set());
    setConfirmAction(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(r => r.id).filter((id): id is string => Boolean(id))));
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  const hasAnyApproverRole = ministries?.some(m => m.approverId === workerProfile?.id || m.headId === workerProfile?.id);
  const canViewPage = canManageApprovals || canApproveRoomReservation || hasAnyApproverRole;
  if (!canViewPage) {
    return (
      <AppLayout>
        <Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card>
      </AppLayout>
    );
  }

  const stats = {
    total: scopedRequests.length,
    pending: scopedRequests.filter(r => r.status.startsWith("Pending")).length,
    approved: scopedRequests.filter(r => r.status === "Approved").length,
    rejected: scopedRequests.filter(r => r.status === "Rejected").length,
  };

  const statusCounts = {
    all: scopedRequests.length,
    pending: scopedRequests.filter(r => r.status.startsWith("Pending")).length,
    approved: scopedRequests.filter(r => r.status === "Approved").length,
    rejected: scopedRequests.filter(r => r.status === "Rejected").length,
    completed: scopedRequests.filter(r => r.status === "Approved" || r.status === "Rejected").length,
  };

  const pendingRequests = filteredRequests.filter(r => r.status.startsWith("Pending"));
  const approvedRequests = filteredRequests.filter(r => r.status === "Approved");
  const rejectedRequests = filteredRequests.filter(r => r.status === "Rejected");

  return (
    <AppLayout>
      <div className="space-y-7 pb-12">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">Approvals</h1>
            <p className="text-sm text-muted-foreground">
              Review and act on incoming requests across ministries, facilities, and operations.
            </p>
          </div>
        </div>

        <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Stat Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Requests" value={stats.total} icon={GanttChartSquare} accentColor="bg-primary" iconClass="text-primary" iconBgClass="bg-primary/10" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accentColor="bg-amber-500" iconClass="text-amber-600" iconBgClass="bg-amber-50 dark:bg-amber-950/40" />
          <StatCard label="Approved" value={stats.approved} icon={CheckCircle2} accentColor="bg-emerald-500" iconClass="text-emerald-600" iconBgClass="bg-emerald-50 dark:bg-emerald-950/40" />
          <StatCard label="Rejected" value={stats.rejected} icon={XCircle} accentColor="bg-rose-500" iconClass="text-rose-500" iconBgClass="bg-rose-50 dark:bg-rose-950/40" />
        </div>

        {/* Bulk action bar */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between bg-card border border-border/60 rounded-2xl px-5 py-3 shadow-card-dark">
            <span className="text-sm font-semibold text-foreground">{selectedIds.size} selected</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction("Approved")}
                className="h-8 px-4 flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
              </button>
              <button
                onClick={() => handleBulkAction("Rejected")}
                className="h-8 px-4 flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 text-xs font-semibold hover:bg-red-100 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" /> Reject
              </button>
            </div>
          </div>
        )}

        {/* Main Content Card Container (Connect2Souls Style) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
          {/* Top Controls Row (Search Left, Filter Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search bar (Left side) */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search requests, requestors, IDs..."
                className="pl-9 pr-4 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-10 bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-2xl shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status filter dropdown (Right side) */}
            <Select value={statusFilter} onValueChange={(val: any) => setStatusFilter(val)}>
              <SelectTrigger className="h-10 w-[165px] text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border border-border shadow-lg bg-popover">
                {(["all", "pending", "approved", "rejected"] as const).map(s => (
                  <SelectItem key={s} value={s} className="text-xs font-medium cursor-pointer">
                    {s === "all" ? "All Statuses" : s.charAt(0).toUpperCase() + s.slice(1)} ({statusCounts[s]})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table / Cards / Kanban container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">
            {/* Table View */}
            {viewMode === "table" && (
            <>
              {/* Mobile list view */}
              <div className="md:hidden divide-y divide-border/30">
                {filteredRequests.length === 0 ? (
                  <div className="py-20 text-center text-sm text-muted-foreground">
                    No requests found.
                  </div>
                ) : (
                  filteredRequests.map(req => {
                    const worker = workers?.find(w => w.id === req.workerId);
                    const booking = bookings?.find(b => b.id === req.reservationId);
                    const targetMinistryId = booking?.ministryId || worker?.majorMinistryId || req.newMajorId || req.oldMajorId;
                    const ministry = targetMinistryId
                      ? (allMinistries || ministries)?.find(m => m.id === targetMinistryId)
                      : null;
                    const reqId = req.id || "";
                    const reqDate = req.date ? new Date(req.date as any) : null;

                    return (
                      <div
                        key={reqId || Math.random().toString()}
                        className="p-4 flex items-center justify-between gap-3"
                      >
                        {/* Left: Basic info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2.5 mb-1.5">
                            <Initials name={req.requester} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground leading-tight truncate">{req.requester}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{ministry?.name || "—"}</p>
                            </div>
                          </div>
                          <p className="text-[10px] font-mono text-muted-foreground mb-1">REQ-{reqId.slice(-4).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground truncate">{req.details}</p>
                        </div>

                        {/* Right: Status + Details button */}
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <StatusBadge status={req.status} />
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                          >
                            Details
                          </button>
                        </div>
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
                          className="h-[17px] w-[17px] rounded-[4px] border-[1.5px] border-white/90 bg-transparent data-[state=checked]:bg-white data-[state=checked]:border-white [&_svg]:text-sidebar focus-visible:ring-0 focus-visible:ring-offset-0 cursor-pointer shadow-xs transition-colors"
                          checked={selectedIds.size === filteredRequests.length && filteredRequests.length > 0}
                          onCheckedChange={() => toggleSelectAll()}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Request ID</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Request</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Requestor</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Ministry</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Date</th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Status</th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Type</th>
                    <th className="px-4 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-20 text-center text-sm text-muted-foreground font-medium">
                        No requests found.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => {
                      const worker = workers?.find(w => w.id === req.workerId);
                      const booking = bookings?.find(b => b.id === req.reservationId);
                      const targetMinistryId = booking?.ministryId || worker?.majorMinistryId || req.newMajorId || req.oldMajorId;
                      const ministry = targetMinistryId
                        ? (allMinistries || ministries)?.find(m => m.id === targetMinistryId)
                        : null;
                      const reqId = req.id || "";
                      const isSelected = selectedIds.has(reqId);
                      const canManage = checkCanManage(req);
                      const isPending = req.status.startsWith("Pending");
                      const reqDate = req.date ? new Date(req.date as any) : null;

                      return (
                        <tr
                          key={reqId || Math.random().toString()}
                          className={cn(
                            "border-b border-gray-100 dark:border-border/60 transition-colors cursor-pointer",
                            isSelected ? "bg-primary/5" : "hover:bg-slate-50/70 dark:hover:bg-muted/30"
                          )}
                          onClick={() => setSelectedRequest(req)}
                        >
                          <td className="px-4 py-3.5 text-center" onClick={e => { e.stopPropagation(); toggleSelect(reqId); }}>
                            <div className="flex items-center justify-center">
                              <Checkbox
                                className="h-[17px] w-[17px] rounded-[4px] border-slate-300 dark:border-slate-600 data-[state=checked]:bg-sidebar data-[state=checked]:border-sidebar cursor-pointer transition-colors"
                                checked={isSelected}
                                onCheckedChange={() => toggleSelect(reqId)}
                              />
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs font-mono text-muted-foreground whitespace-nowrap font-medium">
                            REQ-{reqId.slice(-4).toUpperCase()}
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-semibold text-foreground leading-snug line-clamp-1">{req.details}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <Initials name={req.requester} />
                                <span className="text-sm font-semibold text-foreground whitespace-nowrap">{req.requester}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                              {ministry?.name || "—"}
                            </td>
                            <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap font-medium">
                              {reqDate ? format(reqDate, "MMM d, yyyy") : "—"}
                            </td>
                            <td className="px-5 py-3.5 text-center whitespace-nowrap">
                              <StatusBadge status={req.status} />
                            </td>
                            <td className="px-5 py-3.5 text-center whitespace-nowrap">
                              <span className="text-[11px] font-semibold text-muted-foreground bg-slate-100 dark:bg-muted/60 border border-slate-200/80 dark:border-border px-2.5 py-0.5 rounded-md whitespace-nowrap shadow-2xs">
                                {req.type}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-center" onClick={e => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl shadow-lg border-border/80">
                                  <DropdownMenuItem onClick={() => setSelectedRequest(req)} className="text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg">
                                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                    View Details
                                  </DropdownMenuItem>
                                  {canManage && isPending && (
                                    <>
                                      <DropdownMenuItem
                                        className="text-emerald-600 dark:text-emerald-400 text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg"
                                        onClick={() => setConfirmAction({ action: "Approved", ids: [req.id!] })}
                                      >
                                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" /> Approve
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="text-rose-600 dark:text-rose-400 text-xs font-medium cursor-pointer gap-2 py-2 rounded-lg"
                                        onClick={() => setConfirmAction({ action: "Rejected", ids: [req.id!] })}
                                      >
                                        <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" /> Reject
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Cards View */}
          {viewMode === "cards" && (
            <div className="p-3 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 items-stretch auto-rows-fr">
              {filteredRequests.length === 0 ? (
                <p className="col-span-full py-16 text-center text-sm text-muted-foreground">No requests found.</p>
              ) : filteredRequests.map(req => {
                const canManage = checkCanManage(req);
                const isPending = req.status.startsWith("Pending");
                const reqDate = req.date ? new Date(req.date as any) : null;
                const worker = workers?.find(w => w.id === req.workerId);
                const booking = bookings?.find(b => b.id === req.reservationId);
                const targetMinistryId = booking?.ministryId || worker?.majorMinistryId || req.newMajorId || req.oldMajorId;
                const ministry = targetMinistryId
                  ? (allMinistries || ministries)?.find(m => m.id === targetMinistryId)
                  : null;
                return (
                  <div
                    key={req.id}
                    className="rounded-2xl border border-slate-200/90 dark:border-border/80 bg-slate-50/60 dark:bg-muted/20 p-5 flex flex-col cursor-pointer hover:border-sidebar/40 hover:bg-card hover:shadow-md transition-all h-full shadow-2xs"
                    onClick={() => setSelectedRequest(req)}
                  >
                    {/* Top row: avatar + name/ministry + status badge */}
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <Initials name={req.requester} />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-foreground leading-tight truncate">{req.requester}</p>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{ministry?.name || "—"}</p>
                        </div>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>

                    {/* Request ID + details */}
                    <div className="mt-3.5 space-y-1">
                      <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-muted text-slate-700 dark:text-slate-300">
                        REQ-{(req.id || "").slice(-4).toUpperCase()}
                      </span>
                      <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{req.details}</p>
                    </div>

                    {/* Date */}
                    {reqDate && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <svg className="h-3.5 w-3.5 shrink-0 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        {format(reqDate, "MMMM d, yyyy")}
                      </div>
                    )}

                    {/* Action buttons — always at bottom */}
                    <div className="mt-auto pt-4 border-t border-slate-200/80 dark:border-border/60 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      {canManage && isPending ? (
                        <>
                          <button
                            onClick={() => setConfirmAction({ action: "Approved", ids: [req.id!] })}
                            className="flex-1 h-8.5 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/90 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-950/60 shadow-2xs transition-all cursor-pointer"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setConfirmAction({ action: "Rejected", ids: [req.id!] })}
                            className="flex-1 h-8.5 flex items-center justify-center gap-1.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-300/90 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-950/60 shadow-2xs transition-all cursor-pointer"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="h-8.5 px-3.5 rounded-xl text-xs font-bold bg-white dark:bg-card border border-slate-200/90 dark:border-border text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted shadow-2xs transition-all cursor-pointer"
                          >
                            Details
                          </button>
                        </>
                      ) : (
                        <div className="w-full flex justify-end">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="h-8.5 px-4 rounded-xl text-xs font-bold bg-white dark:bg-card border border-slate-200/90 dark:border-border text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted shadow-2xs transition-all cursor-pointer"
                          >
                            View Details
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Kanban View */}
          {viewMode === "kanban" && (
            <div className="p-3 md:p-5 overflow-x-auto">
              <div className="flex gap-3 md:gap-4 min-w-max">
                {([
                  { key: "pending",  label: "PENDING",      color: "text-amber-500",   bg: "bg-amber-50/60 dark:bg-amber-950/20",   border: "border-amber-200/60 dark:border-amber-800/40",  requests: filteredRequests.filter(r => r.status === "Pending" || r.status === "Pending Ministry Approval" || r.status === "Pending Outgoing Approval") },
                  { key: "review",   label: "UNDER REVIEW", color: "text-blue-500",    bg: "bg-blue-50/60 dark:bg-blue-950/20",     border: "border-blue-200/60 dark:border-blue-800/40",    requests: filteredRequests.filter(r => r.status === "Pending Admin Approval" || r.status === "Pending Incoming Approval") },
                  { key: "approved", label: "APPROVED",     color: "text-emerald-500", bg: "bg-emerald-50/60 dark:bg-emerald-950/20", border: "border-emerald-200/60 dark:border-emerald-800/40", requests: filteredRequests.filter(r => r.status === "Approved") },
                  { key: "rejected", label: "REJECTED",     color: "text-red-500",     bg: "bg-red-50/60 dark:bg-red-950/20",       border: "border-red-200/60 dark:border-red-800/40",      requests: filteredRequests.filter(r => r.status === "Rejected") },
                ] as const).map(col => (
                  <div key={col.key} className={cn("flex-shrink-0 w-[280px] md:flex-1 md:min-w-[220px] rounded-2xl border p-3 md:p-4 flex flex-col gap-3 min-h-[300px]", col.bg, col.border)}>
                    {/* Column header */}
                    <div className="flex items-center justify-between">
                      <span className={cn("text-xs font-black uppercase tracking-widest", col.color)}>
                        {col.label}
                      </span>
                      <button className="w-6 h-6 flex items-center justify-center rounded-md hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground transition-colors">
                        <span className="text-base leading-none">+</span>
                      </button>
                    </div>

                    {/* Cards */}
                    {col.requests.length === 0 ? (
                      <div className="flex-1 flex items-center justify-center">
                        <p className="text-xs text-muted-foreground/50">No requests</p>
                      </div>
                    ) : col.requests.map(req => {
                      const worker = workers?.find(w => w.id === req.workerId);
                      const booking = bookings?.find(b => b.id === req.reservationId);
                      const targetMinistryId = booking?.ministryId || worker?.majorMinistryId || req.newMajorId || req.oldMajorId;
                      const ministry = targetMinistryId
                        ? (allMinistries || ministries)?.find(m => m.id === targetMinistryId)
                        : null;
                      const canManage = checkCanManage(req);
                      const isPending = req.status.startsWith("Pending");
                      const reqDate = req.date ? new Date(req.date as any) : null;
                      return (
                        <div
                          key={req.id}
                          className="bg-card rounded-xl border border-border/50 p-3.5 flex flex-col gap-2.5 cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => setSelectedRequest(req)}
                        >
                          {/* Avatar + name/ministry */}
                          <div className="flex items-center gap-2.5">
                            <Initials name={req.requester} />
                            <div>
                              <p className="text-sm font-bold text-foreground leading-tight">{req.requester}</p>
                              <p className="text-[11px] text-muted-foreground">{ministry?.name || "—"}</p>
                            </div>
                          </div>

                          {/* REQ ID + details */}
                          <div>
                            <p className="text-[10px] font-mono text-muted-foreground mb-0.5">REQ-{(req.id || "").slice(-4).toUpperCase()}</p>
                            <p className="text-sm font-bold text-foreground leading-snug line-clamp-2">{req.details}</p>
                          </div>

                          {/* Date */}
                          {reqDate && (
                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                              <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                              </svg>
                              {format(reqDate, "MMM d, yyyy")}
                            </div>
                          )}

                          {/* Actions */}
                          {canManage && isPending && (
                            <div className="flex gap-1.5 pt-1 border-t border-border/30" onClick={e => e.stopPropagation()}>
                              <button onClick={() => setConfirmAction({ action: "Approved", ids: [req.id!] })} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors">
                                <CheckCircle2 className="h-3 w-3" /> Approve
                              </button>
                              <button onClick={() => setConfirmAction({ action: "Rejected", ids: [req.id!] })} className="flex-1 h-7 flex items-center justify-center gap-1 rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 text-[11px] font-semibold hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors">
                                <XCircle className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
      </div>

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={open => !open && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.action === "Approved" ? "Confirm Approval" : "Confirm Rejection"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.ids.length === 1
                ? `Are you sure you want to ${confirmAction?.action === "Approved" ? "approve" : "reject"} this request? This action cannot be undone.`
                : `Are you sure you want to ${confirmAction?.action?.toLowerCase()} ${confirmAction?.ids.length} selected request(s)?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmAction?.action === "Rejected" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              onClick={executeBulkAction}
            >
              Yes, {confirmAction?.action === "Approved" ? "Approve" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ApprovalDetailsDialog
        request={selectedRequest}
        open={!!selectedRequest}
        requesterWorker={workers?.find(w => w.id === selectedRequest?.workerId)}
        onOpenChange={open => { if (!open) setSelectedRequest(null); }}
        canManage={selectedRequest ? checkCanManage(selectedRequest) : false}
        onApprove={(id) => {
          setSelectedRequest(null);
          setConfirmAction({ action: "Approved", ids: [id] });
        }}
        onReject={(id) => {
          setSelectedRequest(null);
          setConfirmAction({ action: "Rejected", ids: [id] });
        }}
      />
    </AppLayout>
  );
}

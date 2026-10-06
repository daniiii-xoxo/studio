"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import {
  Building2, HeartHandshake, User as UserIcon, Users, LoaderCircle,
  PlusCircle, MoreHorizontal, Edit, Trash2, UserCog, Utensils,
  Eye, ArrowLeft, Search, Copy, ClipboardCheck,
} from "lucide-react";
import type { Ministry, Worker, Department } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@studio/ui";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@studio/ui";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { cn } from "@/lib/utils";

const generateMinistryId = (name: string, department: string) =>
  `${department.charAt(0).toUpperCase()}-${name.trim()}`;

// ── Worker initials ────────────────────────────────────────────────────────────
function WorkerInitials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const init = parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  return <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:text-sky-400 text-[11px] font-black shrink-0 border border-sidebar/20">{init}</span>;
}

// ── Ministry Form ──────────────────────────────────────────────────────────────
function MinistryForm({ ministry, workers, departments, onSave, onClose }: {
  ministry: Partial<Ministry> | null; workers: Worker[]; departments: Department[];
  onSave: (data: Partial<Ministry>) => void; onClose: () => void;
}) {
  const [formData, setFormData] = useState<Partial<Ministry>>({ name: "", description: "", department: "Worship", leaderId: "", headId: "" });
  useEffect(() => { if (ministry) setFormData(ministry); else setFormData({ name: "", description: "", department: "Worship", leaderId: "", headId: "", weight: 0 }); }, [ministry]);
  const set = (field: keyof Ministry, value: string | number) => setFormData(p => ({ ...p, [field]: value }));
  const sorted = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));

  return (
    <div className="space-y-6">
      <DialogHeader className="space-y-2 pb-1 border-b border-border/40 pr-8">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 shrink-0 mt-0.5">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-bold font-headline text-foreground">
              {ministry?.id ? "Edit Ministry" : "Add New Ministry"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Fill in the ministry details, assigned leadership, and parent department.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-0.5">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">Ministry Name</Label>
          <Input
            value={formData.name}
            onChange={e => set("name", e.target.value)}
            placeholder="e.g. Media & Tech Ministry"
            className="h-10 rounded-xl border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar"
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-foreground">Description</Label>
          <Textarea
            value={formData.description}
            onChange={e => set("description", e.target.value)}
            placeholder="Brief overview of the ministry's role..."
            className="rounded-xl border-slate-200/90 dark:border-border text-xs min-h-[75px] focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar bg-background dark:bg-muted/20 resize-none transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Department</Label>
            <Select value={formData.department} onValueChange={v => set("department", v)}>
              <SelectTrigger className="h-10 rounded-xl border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border shadow-xl">
                {departments.map(d => <SelectItem key={d} value={d} className="text-xs font-medium cursor-pointer">{d}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-foreground">Display Order (Weight)</Label>
            <Input
              type="number"
              value={formData.weight ?? 0}
              onChange={e => set("weight", parseInt(e.target.value, 10) || 0)}
              className="h-10 rounded-xl border-slate-200/90 dark:border-border text-xs font-semibold bg-white dark:bg-background shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar"
            />
          </div>
        </div>

        {/* Leadership Card */}
        <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 space-y-3.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <UserCog className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">Ministry Leadership</p>
              <p className="text-[11px] text-muted-foreground">Assign designated head for this ministry.</p>
            </div>
          </div>

          <div className="pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Ministry Head</Label>
              <Select value={formData.headId || "none"} onValueChange={v => set("headId", v === "none" ? "" : v)}>
                <SelectTrigger className="h-10 rounded-xl border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
                  <SelectValue placeholder="Select a ministry head" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border border-border shadow-xl max-h-56">
                  <SelectItem value="none" className="text-xs font-medium cursor-pointer text-muted-foreground">None</SelectItem>
                  {sorted.map(w => (
                    <SelectItem key={w.id} value={w.id} className="text-xs font-medium cursor-pointer">
                      {w.firstName} {w.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(formData)}
          className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Appoint Dialog ──────────────────────────────────────────────────────────────
function AppointDialog({ ministry, workers, onSave, onClose, type = "approver" }: {
  ministry: Ministry; workers: Worker[];
  onSave: (id: string, userId: string | null, type: "approver" | "head") => void;
  onClose: () => void; type?: "approver" | "head";
}) {
  const init = type === "approver" ? (ministry.approverId || "none") : (ministry.headId || "none");
  const [sel, setSel] = useState<string>(init);
  const sorted = [...workers].sort((a, b) => a.firstName.localeCompare(b.firstName));
  const label = type === "approver" ? "Approver" : "Ministry Head";

  return (
    <div className="space-y-6">
      <DialogHeader className="space-y-2 pb-1 border-b border-border/40 pr-8">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 shrink-0 mt-0.5">
            <UserCog className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-xl font-bold font-headline text-foreground">
              Appoint {label}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              Select an authorized worker for <span className="font-semibold text-foreground">{ministry.name}</span>.
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      <div className="space-y-3 py-2">
        <Label className="text-xs font-bold text-foreground">{label}</Label>
        <Select value={sel} onValueChange={setSel}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
            <SelectValue placeholder={`Select a ${label.toLowerCase()}`} />
          </SelectTrigger>
          <SelectContent className="rounded-xl border border-border shadow-xl max-h-64">
            <SelectItem value="none" className="text-xs font-medium cursor-pointer text-muted-foreground">
              None (Remove {label})
            </SelectItem>
            {sorted.map(w => (
              <SelectItem key={w.id} value={w.id} className="text-xs font-medium cursor-pointer">
                <div className="flex items-center gap-2 py-0.5">
                  <span className="w-5 h-5 rounded-full bg-sidebar/10 text-sidebar dark:text-sky-400 text-[9px] font-black flex items-center justify-center shrink-0">
                    {w.firstName?.[0]}{w.lastName?.[0]}
                  </span>
                  <span>{w.firstName} {w.lastName}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={() => onSave(ministry.id, sel === "none" ? null : sel, type)}
          className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          Save Changes
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MinistryManagementPage() {
  const { canManageMinistries, canAppointApprovers, workerProfile, isLoading: isRoleLoading } = useUserRole();
  const { ministries, isLoading: ministriesLoading, createMinistry, updateMinistry, deleteMinistry } = useMinistries({ all: true });
  const { workers, isLoading: workersLoading } = useWorkers({ limit: 999999 });
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  const [formOpen, setFormOpen] = useState(false);
  const [selectedMinistry, setSelectedMinistry] = useState<Ministry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsMinistry, setDetailsMinistry] = useState<Ministry | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ministry | null>(null);
  const [appointOpen, setAppointOpen] = useState(false);
  const [appointType, setAppointType] = useState<"approver" | "head">("approver");
  const [appointTarget, setAppointTarget] = useState<Ministry | null>(null);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<"all" | Department>("all");

  const departments: Department[] = ["Worship", "Outreach", "Relationship", "Discipleship", "Administration"];
  const getWorker = (id?: string | null) => id ? workers?.find(w => w.id === id) : null;
  const isLoading = ministriesLoading || workersLoading || isRoleLoading;

  const handleSaveMinistry = async (data: Partial<Ministry>) => {
    try {
      if (selectedMinistry) {
        await updateMinistry({ id: selectedMinistry.id, data });
        await logAction("Updated Ministry", "Ministries", `Updated "${data.name || selectedMinistry.name}"`);
        toast({ title: "Ministry Updated" });
      } else {
        const id = generateMinistryId(data.name || "New", data.department as string || "Worship");
        await createMinistry({ ...data, id, description: data.description || "", leaderId: data.leaderId || "", headId: data.headId || "" });
        await logAction("Created Ministry", "Ministries", `Created "${data.name}" in ${data.department}`);
        toast({ title: "Ministry Added" });
      }
      setFormOpen(false);
    } catch { toast({ variant: "destructive", title: "Save Failed" }); }
  };

  const handleSaveAppointed = async (ministryId: string, userId: string | null, type: "approver" | "head") => {
    try {
      const field = type === "approver" ? "approverId" : "headId";
      await updateMinistry({ id: ministryId, data: { [field]: userId === null ? "" : userId } });
      const label = type === "approver" ? "Approver" : "Ministry Head";
      toast({ title: `${label} Updated` });
      setAppointOpen(false);
    } catch { toast({ variant: "destructive", title: "Update Failed" }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMinistry(deleteTarget.id);
      await logAction("Deleted Ministry", "Ministries", `Deleted "${deleteTarget.name}"`);
      toast({ title: "Ministry Deleted" });
      setDeleteTarget(null);
    } catch { toast({ variant: "destructive", title: "Delete Failed" }); }
  };

  const deptCounts = useMemo(() => {
    const list = (ministries as Ministry[] || []);
    const counts: Record<string, number> = {
      all: list.length,
    };
    for (const d of departments) {
      counts[d] = list.filter(m => m.department === d || m.departmentCode === d.toUpperCase()).length;
    }
    return counts;
  }, [ministries, departments]);

  const filteredMinistries = (ministries as Ministry[] || []).filter(m => {
    const q = search.trim().toLowerCase();
    if (q && !m.name.toLowerCase().includes(q)) return false;
    if (deptFilter !== "all" && m.department !== deptFilter) return false;
    return true;
  }).sort((a, b) => { const wa = a.weight ?? 0, wb = b.weight ?? 0; return wa !== wb ? wa - wb : a.name.localeCompare(b.name); });

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canManageMinistries) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              Ministry Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage ministries, leaders and weekly allocations.
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
          {/* Controls Row (Search Left, Filter & Add Ministry Right - White Container, No Shadow) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar (Left side) */}
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ministries...."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-10 bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-xl focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all focus:outline-none"
            />
          </div>

          {/* Filter Tabs & Add Ministry Button (Right side) */}
          <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end">
            {/* Dept filter dropdown */}
            <Select value={deptFilter} onValueChange={(val: any) => setDeptFilter(val)}>
              <SelectTrigger className="h-10 w-[180px] text-xs rounded-xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {(["all", ...departments] as const).map(d => (
                  <SelectItem key={d} value={d} className="text-xs font-medium cursor-pointer">
                    {d === "all" ? "All Departments" : d} ({deptCounts[d] ?? 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Add Ministry Button */}
            <button
              type="button"
              onClick={() => { setSelectedMinistry(null); setFormOpen(true); }}
              className="h-10 px-4 flex items-center gap-2 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold transition-colors cursor-pointer shrink-0"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Add Ministry</span>
            </button>
          </div>
        </div>

        {/* Ministry cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMinistries.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-muted-foreground">No ministries found.</p>
          ) : filteredMinistries.map(ministry => {
            const head = getWorker(ministry.headId);
            const memberCount = (workers || []).filter(w => w.majorMinistryId === ministry.id || w.minorMinistryId === ministry.id).length;
            const weeklyPool = (ministry as any).mealStubWeeklyLimit || 0;

            return (
              <div key={ministry.id} className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 flex flex-col gap-4 justify-between">
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-foreground font-headline">{ministry.name}</h3>
                    <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 mt-1">{ministry.department}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="p-2 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 shrink-0">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => { setDetailsMinistry(ministry); setDetailsOpen(true); }}><Eye className="mr-2 h-3.5 w-3.5" /> View Details</DropdownMenuItem>
                        {canManageMinistries && <DropdownMenuItem onClick={() => { setSelectedMinistry(ministry); setFormOpen(true); }}><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => { setAppointTarget(ministry); setAppointType("head"); setAppointOpen(true); }}><Users className="mr-2 h-3.5 w-3.5" /> Appoint Head</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { setAppointTarget(ministry); setAppointType("approver"); setAppointOpen(true); }}><UserCog className="mr-2 h-3.5 w-3.5" /> Appoint Approver</DropdownMenuItem>
                        {canManageMinistries && <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(ministry)}><Trash2 className="mr-2 h-3.5 w-3.5" /> Delete</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Ministry Head */}
                <div className="rounded-xl border border-border/60 bg-muted/[0.12] px-3 py-2.5 flex items-center gap-2.5">
                  {head ? (
                    <>
                      <WorkerInitials name={`${head.firstName} ${head.lastName}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{head.firstName} {head.lastName}</p>
                        <p className="text-[10px] text-muted-foreground">Ministry Head</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span className="text-xs italic">No head assigned</span>
                    </div>
                  )}
                </div>

                {/* Members + Weekly pool */}
                <div className="flex items-center justify-between pt-2 border-t border-border/40">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                    <Users className="h-3.5 w-3.5 text-sidebar dark:text-sky-400" /> {memberCount} members
                  </span>
                  {weeklyPool > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                      ✦ {weeklyPool}/week
                    </span>
                  )}
                </div>

                {/* View Details */}
                <button
                  type="button"
                  onClick={() => { setDetailsMinistry(ministry); setDetailsOpen(true); }}
                  className="w-full flex items-center justify-center gap-2 h-9 rounded-xl border border-border/60 bg-muted/[0.08] hover:bg-muted/[0.22] text-xs font-bold text-foreground transition-colors cursor-pointer shadow-2xs"
                >
                  <Eye className="h-3.5 w-3.5" /> View Details
                </button>
              </div>
            );
          })}
        </div>
        </div>
      </div>

      {/* Ministry Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 sm:p-7 border-border/80 shadow-2xl">
          <MinistryForm ministry={selectedMinistry} workers={workers || []} departments={departments} onSave={handleSaveMinistry} onClose={() => setFormOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Appoint Dialog */}
      <Dialog open={appointOpen} onOpenChange={setAppointOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 sm:p-7 border-border/80 shadow-2xl">
          {appointTarget && <AppointDialog ministry={appointTarget} workers={workers || []} onSave={handleSaveAppointed} onClose={() => setAppointOpen(false)} type={appointType} />}
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 sm:p-7 border-border/80 shadow-2xl">
          {detailsMinistry && (() => {
            const m = detailsMinistry;
            const head = getWorker(m.headId);
            const members = (workers || []).filter(w => w.majorMinistryId === m.id || w.minorMinistryId === m.id);
            return (
              <div className="flex flex-col gap-5">
                <DialogHeader className="space-y-1 pb-3 border-b border-border/40 pr-8">
                  <div className="flex items-start gap-3.5">
                    <div className="p-2.5 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 shrink-0 mt-0.5">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <DialogTitle className="text-xl font-bold font-headline text-foreground">{m.name}</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">{m.department} Department</DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}

                <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider mb-1.5">Ministry Head</p>
                  {head ? (
                    <div className="flex items-center gap-2">
                      <WorkerInitials name={`${head.firstName} ${head.lastName}`} />
                      <p className="text-xs font-semibold text-foreground truncate">{head.firstName} {head.lastName}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">Unassigned</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-bold text-foreground mb-2">Members ({members.length})</p>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {members.map(w => (
                      <div key={w.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-background p-2">
                        <WorkerInitials name={`${w.firstName} ${w.lastName}`} />
                        <p className="text-xs font-medium text-foreground truncate">{w.firstName} {w.lastName}</p>
                      </div>
                    ))}
                    {members.length === 0 && <p className="col-span-2 text-xs text-muted-foreground italic text-center py-4">No members.</p>}
                  </div>
                </div>

                <DialogFooter className="pt-2 border-t border-border/40 flex items-center justify-end gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => { setSelectedMinistry(m); setDetailsOpen(false); setFormOpen(true); }}
                    className="h-10 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/50 transition-colors cursor-pointer gap-1.5"
                  >
                    <Edit className="h-3.5 w-3.5" /> Edit Ministry
                  </Button>
                  <Button
                    onClick={() => setDetailsOpen(false)}
                    className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete ministry?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <span className="font-bold">{deleteTarget?.name}</span>.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

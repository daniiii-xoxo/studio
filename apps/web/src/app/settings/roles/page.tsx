"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@studio/ui";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@studio/ui";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@studio/ui";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import {
  LoaderCircle, PlusCircle, Trash2, Save, ShieldCheck,
  Shield, ArrowLeft, Search, MoreHorizontal, RefreshCw, Pencil, KeyRound,
} from "lucide-react";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/use-audit-log";
import { useRoles } from "@/hooks/use-roles";
import { useWorkers } from "@/hooks/use-workers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@studio/ui";
import {
  setRolePermissionsByKeys, createRole, updateRole, deleteRole,
} from "@/actions/db";
import { seedPermissions } from "@/actions/seed-permissions";
import { ALL_PERMISSIONS } from "@/lib/permissions/registry";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// ── Permission categories ──────────────────────────────────────────────────────
const PERMISSION_CATEGORIES = (() => {
  const grouped: Record<string, { key: string; label: string; description: string }[]> = {};
  for (const p of ALL_PERMISSIONS) {
    if (!grouped[p.module]) grouped[p.module] = [];
    grouped[p.module].push({ key: `${p.module}:${p.action}`, label: p.action.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), description: p.description || "" });
  }
  const MODULE_LABELS: Record<string, string> = {
    roles: "Roles", workers: "Workers", ministries: "Ministries", facilities: "Facilities",
    venues: "Room Reservations", approvals: "Approvals", attendance: "Scanner & Attendance",
    meals: "Meal Stubs", mentorship: "Connect 2 Souls", reports: "Reports",
    system: "System", venue_assistance: "Venue Assistance", schedule: "Service Schedule", inventory: "Inventory",
  };
  return Object.entries(grouped).map(([module, permissions]) => ({ module, category: MODULE_LABELS[module] || module, permissions }));
})();

// ── Permission Dialog ─────────────────────────────────────────────────────────
function RolePermissionDialog({ role, isOpen, onOpenChange, onSave, onDelete, isSaving }: {
  role: any | null; isOpen: boolean; onOpenChange: (open: boolean) => void;
  onSave: (name: string, permKeys: string[]) => void;
  onDelete: (roleId: string) => void; isSaving?: boolean;
}) {
  const [name, setName] = useState("");
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setName(role?.name || "New Role");
      setSelectedKeys((role?.rolePermissions || []).map((rp: any) => `${rp.permission.module}:${rp.permission.action}`));
    }
  }, [role, isOpen]);

  const isAdminRole = role?.isSuperAdmin || role?.id === "admin";

  const toggle = (key: string, checked: boolean) =>
    setSelectedKeys(curr => checked ? [...curr, key] : curr.filter(k => k !== key));

  const toggleModule = (moduleKeys: string[], checked: boolean) =>
    setSelectedKeys(curr => {
      if (checked) { const next = new Set(curr); moduleKeys.forEach(k => next.add(k)); return [...next]; }
      return curr.filter(k => !moduleKeys.includes(k));
    });

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-6 sm:p-7 rounded-2xl border-border/80 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:bg-sidebar/25 flex items-center justify-center shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-headline">
                {role?.id ? "Edit Role" : "Add New Role"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {isAdminRole ? "Super Admin roles have all permissions enabled by default." : "Configure granular permissions and access levels for this role."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-2 space-y-4 pr-1">
          {/* Role Name Card */}
          <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-3">
            <Label htmlFor="role-name" className="text-xs font-bold text-foreground">
              Role Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="role-name"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={isAdminRole}
              placeholder="e.g., Ministry Coordinator, Venue Supervisor"
              className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
            />
          </div>

          {!isAdminRole && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5 text-primary" />
                  <span>Module Permissions</span>
                </Label>
                <Badge variant="outline" className="text-[10px] font-semibold">
                  {selectedKeys.length} total granted
                </Badge>
              </div>

              <Accordion type="multiple" className="w-full border border-border/70 rounded-2xl overflow-hidden bg-background divide-y divide-border/40" defaultValue={PERMISSION_CATEGORIES.map(c => c.module)}>
                {PERMISSION_CATEGORIES.map(({ module, category, permissions }) => {
                  const moduleKeys = permissions.map(p => p.key);
                  const selectedCount = moduleKeys.filter(k => selectedKeys.includes(k)).length;
                  const allSelected = selectedCount === moduleKeys.length;
                  const someSelected = selectedCount > 0 && !allSelected;
                  return (
                    <AccordionItem value={module} key={module} className="px-4 border-none">
                      <div className="flex items-center gap-2 py-1">
                        <Checkbox
                          id={`module-all-${module}`}
                          checked={allSelected}
                          data-state={someSelected ? "indeterminate" : allSelected ? "checked" : "unchecked"}
                          onCheckedChange={checked => toggleModule(moduleKeys, !!checked)}
                          onClick={e => e.stopPropagation()}
                          className="shrink-0 rounded-md"
                        />
                        <AccordionTrigger className="flex-1 text-xs font-bold py-2.5 hover:no-underline text-foreground">
                          <span className="flex items-center gap-2">
                            {category}
                            <Badge
                              variant={selectedCount > 0 ? "default" : "outline"}
                              className={cn(
                                "text-[10px] px-2 py-0.2 rounded-full",
                                selectedCount > 0 ? "bg-sidebar text-white" : "text-muted-foreground"
                              )}
                            >
                              {selectedCount}/{moduleKeys.length}
                            </Badge>
                          </span>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="pt-1 pb-3 pl-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                          {permissions.map(permission => {
                            const isChecked = selectedKeys.includes(permission.key);
                            return (
                              <label
                                key={permission.key}
                                htmlFor={`${role?.id || "new"}-${permission.key}`}
                                className={cn(
                                  "flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer",
                                  isChecked
                                    ? "bg-primary/5 border-primary/30 text-foreground"
                                    : "bg-slate-50/50 dark:bg-muted/10 border-slate-200/70 dark:border-border/60 text-muted-foreground hover:border-slate-300"
                                )}
                              >
                                <Checkbox
                                  id={`${role?.id || "new"}-${permission.key}`}
                                  checked={isChecked}
                                  onCheckedChange={checked => toggle(permission.key, !!checked)}
                                  className="mt-0.5 rounded-md"
                                />
                                <div className="grid gap-0.5 leading-none">
                                  <span className="font-semibold text-xs text-foreground">{permission.label}</span>
                                  {permission.description && (
                                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-tight">{permission.description}</p>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </div>
          )}
        </div>

        {!isAdminRole && (
          <DialogFooter className="pt-4 border-t border-border/60 flex flex-col-reverse sm:flex-row sm:justify-between items-center gap-2 shrink-0">
            {role?.id && !role?.isSystemRole ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl h-10 px-4 text-xs font-semibold mr-auto"
                onClick={() => onDelete(role.id)}
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Delete Role
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="rounded-xl h-10 px-5 text-xs font-semibold"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isSaving || !name.trim()}
                onClick={() => onSave(name, selectedKeys)}
                className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs"
              >
                {isSaving ? <><LoaderCircle className="h-4 w-4 mr-2 animate-spin" /> Saving…</> : <><Save className="h-4 w-4 mr-2" /> Save Role</>}
              </Button>
            </div>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RoleManagementPage() {
  const { canManageRoles } = useUserRole();
  const { roles, isLoading } = useRoles();
  const { workers } = useWorkers({ limit: 999999 });
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  const queryClient = useQueryClient();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any | null>(null);
  const [roleToDelete, setRoleToDelete] = useState<any | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "system" | "custom">("all");

  useEffect(() => {
    if (!canManageRoles) return;
    seedPermissions().catch(console.error);
  }, [canManageRoles]);

  const handleSyncPermissions = async () => {
    setIsSyncing(true);
    try {
      const result = await seedPermissions();
      toast({ title: `Permissions synced — ${result.permissions} entries, ${result.roles} roles migrated` });
      queryClient.invalidateQueries({ queryKey: ["roles"] });
    } catch { toast({ variant: "destructive", title: "Sync failed" }); }
    finally { setIsSyncing(false); }
  };

  const saveMutation = useMutation({
    mutationFn: async ({ role, name, permKeys }: { role: any | null; name: string; permKeys: string[] }) => {
      if (role?.id) { await updateRole(role.id, { name }); await setRolePermissionsByKeys(role.id, permKeys); return { id: role.id, name }; }
      const created = await createRole({ name, permissions: [] });
      await setRolePermissionsByKeys(created.id, permKeys);
      return created;
    },
    onSuccess: async (result, { role }) => {
      await queryClient.invalidateQueries({ queryKey: ["roles"] });
      await queryClient.refetchQueries({ queryKey: ["roles"] });
      await logAction(role?.id ? "Updated Role" : "Created Role", "Roles", `${role?.id ? "Updated" : "Created"} role "${result.name}"`);
      toast({ title: role?.id ? "Role Updated" : "Role Created" });
      setSheetOpen(false);
    },
    onError: err => toast({ variant: "destructive", title: "Save Failed", description: err instanceof Error ? err.message : "Could not save the role." }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRole(id),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      await logAction("Deleted Role", "Roles", `Deleted role "${roleToDelete?.name}"`);
      toast({ title: "Role Deleted" });
      setRoleToDelete(null);
    },
    onError: () => toast({ variant: "destructive", title: "Delete Failed" }),
  });

  const handleSaveRole = (name: string, permKeys: string[]) => {
    if (!name.trim()) { toast({ variant: "destructive", title: "Role name is required." }); return; }
    saveMutation.mutate({ role: selectedRole, name, permKeys });
  };

  if (isLoading) return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
  if (!canManageRoles) return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>No permission.</CardDescription></CardHeader></Card></AppLayout>;

  const sortedRoles = [...(roles || [])].sort((a: any, b: any) => a.isSuperAdmin ? -1 : b.isSuperAdmin ? 1 : a.name.localeCompare(b.name));

  const filtered = sortedRoles.filter((r: any) => {
    const q = search.trim().toLowerCase();
    if (q && !r.name.toLowerCase().includes(q)) return false;
    if (typeFilter === "system" && !r.isSystemRole) return false;
    if (typeFilter === "custom" && r.isSystemRole) return false;
    return true;
  });

  // Count workers per role
  const workerCountByRole = (roleId: string) =>
    (workers || []).filter(w => w.roleId === roleId || (w as any).roles?.some((wr: any) => wr.roleId === roleId)).length;

  // Permission labels for display (max 5)
  const getPermLabels = (role: any): { key: string; label: string }[] => {
    if (role.isSuperAdmin) return [{ key: "all-access", label: "All Access" }];
    return (role.rolePermissions || []).slice(0, 5).map((rp: any, idx: number) => {
      const module = rp.permission?.module || "";
      const action = rp.permission?.action || "";
      const formattedAction = action.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
      return {
        key: rp.id || rp.permissionId || `${module}:${action}:${idx}`,
        label: formattedAction,
      };
    });
  };

  const totalRolesCount = sortedRoles.length;
  const systemRolesCount = sortedRoles.filter((r: any) => r.isSystemRole).length;
  const customRolesCount = sortedRoles.filter((r: any) => !r.isSystemRole).length;

  const typeCounts = {
    all: totalRolesCount,
    system: systemRolesCount,
    custom: customRolesCount,
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-12 w-full">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              Role Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Define roles and fine-grained permissions across the app.
            </p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </Link>
        </div>

        {/* Main Content Card Container (Connect2Souls Style) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Top Controls Row (Search Left, Filter & New Role Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search bar (Left side) */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Search roles...."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-10 bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-2xl shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all focus:outline-none"
              />
            </div>

            {/* Filter Tabs & New Role Button (Right side) */}
            <div className="flex items-center gap-3 flex-wrap justify-between sm:justify-end">
              {/* Type filter dropdown */}
              <Select value={typeFilter} onValueChange={(val: any) => setTypeFilter(val)}>
                <SelectTrigger className="h-10 w-[150px] text-xs rounded-xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3.5 focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {(["all", "system", "custom"] as const).map(t => (
                    <SelectItem key={t} value={t} className="text-xs font-medium cursor-pointer">
                      {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)} ({typeCounts[t]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* New Role Button */}
              <button
                type="button"
                onClick={() => { setSelectedRole(null); setSheetOpen(true); }}
                className="h-10 px-4 flex items-center gap-2 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <PlusCircle className="h-4 w-4" />
                <span>New Role</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-sidebar text-white border-b border-sidebar">
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white">Role</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white">Type</th>
                    <th className="px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white">Members</th>
                    <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white">Permissions</th>
                    <th className="px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="py-14 text-center text-sm text-muted-foreground">No roles found.</td></tr>
                  ) : filtered.map((role: any) => {
                    const permLabels = getPermLabels(role);
                    const memberCount = workerCountByRole(role.id);
                    return (
                      <tr key={role.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="p-1.5 rounded-lg bg-primary/10">
                              <Shield className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{role.name}</span>
                            {role.isSuperAdmin && <ShieldCheck className="h-4 w-4 text-primary shrink-0" />}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {role.isSystemRole
                            ? <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20"><span className="w-1.5 h-1.5 rounded-full bg-primary" /> System</span>
                            : <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Custom</span>}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground font-medium text-center">{memberCount}</td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1.5">
                            {permLabels.map(item => (
                              <span key={item.key} className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{item.label}</span>
                            ))}
                            {(role.rolePermissions?.length || 0) > 5 && (
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border/60">+{(role.rolePermissions?.length || 0) - 5} more</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center align-middle">
                          <div className="flex items-center justify-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                <DropdownMenuItem onClick={() => { setSelectedRole(role); setSheetOpen(true); }} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                                  <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Role
                                </DropdownMenuItem>
                                {!role.isSystemRole && (
                                  <DropdownMenuItem className="text-destructive cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 focus:text-destructive focus:bg-destructive/10" onClick={() => setRoleToDelete(role)}>
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete Role
                                  </DropdownMenuItem>
                                )}
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
      </div>

      <RolePermissionDialog isOpen={sheetOpen} onOpenChange={setSheetOpen} role={selectedRole} onSave={handleSaveRole} isSaving={saveMutation.isPending}
        onDelete={roleId => { const role = sortedRoles.find((r: any) => r.id === roleId); if (role) { setRoleToDelete(role); setSheetOpen(false); } }} />

      <AlertDialog open={!!roleToDelete} onOpenChange={open => !open && setRoleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete <span className="font-bold">{roleToDelete?.name}</span> and remove it from all assigned workers.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteMutation.mutate(roleToDelete.id)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

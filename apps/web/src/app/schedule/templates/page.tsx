"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@studio/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@studio/ui";
import { Input } from "@studio/ui";
import { Label } from "@studio/ui";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import { ArrowLeft, PlusCircle, Trash2, LoaderCircle, Plus, X } from "lucide-react";
import { useServiceTemplates } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";

const DEPT_CODE_TO_NAME: Record<string, string> = {
    W: 'Worship',
    O: 'Outreach',
    R: 'Relationship',
    D: 'Discipleship',
    A: 'Administration',
};

const DEPT_NAME_TO_CODE: Record<string, string> = {
    Worship: 'W',
    Outreach: 'O',
    Relationship: 'R',
    Discipleship: 'D',
    Administration: 'A',
};

function getDeptCode(ministry: any): string {
    return ministry?.departmentCode || DEPT_NAME_TO_CODE[ministry?.department] || '';
}

function getDeptName(ministry: any): string {
    const code = getDeptCode(ministry);
    return DEPT_CODE_TO_NAME[code] || ministry?.department || code || '—';
}

type RoleRow = { roleName: string; count: number; notes: string };

export default function TemplatesPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { canAssignSchedulers, isSuperAdmin, workerProfile } = useUserRole();
    const { templates, isLoading, createTemplate, deleteTemplate } = useServiceTemplates();
    const { ministries } = useMinistries();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [ministryId, setMinistryId] = useState("");
    const [templateName, setTemplateName] = useState("");
    const [isDefault, setIsDefault] = useState(false);
    const [roles, setRoles] = useState<RoleRow[]>([{ roleName: "", count: 1, notes: "" }]);
    const [isSaving, setIsSaving] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<any | null>(null);

    // Scope ministries to the scheduler's department
    const visibleMinistries = useMemo(() => {
        if (isSuperAdmin || canAssignSchedulers) return ministries;
        // Ministry Scheduler — only their own ministry
        if (workerProfile?.majorMinistryId) {
            return ministries.filter((m: any) =>
                m.id === workerProfile.majorMinistryId || m.id === workerProfile.minorMinistryId
            );
        }
        return ministries;
    }, [ministries, isSuperAdmin, canAssignSchedulers, workerProfile]);

    const addRole = () => setRoles(r => [...r, { roleName: "", count: 1, notes: "" }]);
    const removeRole = (i: number) => setRoles(r => r.filter((_, idx) => idx !== i));
    const updateRole = (i: number, field: keyof RoleRow, value: any) =>
        setRoles(r => r.map((row, idx) => idx === i ? { ...row, [field]: value } : row));

    const handleCreate = async () => {
        if (!ministryId || !templateName.trim()) return;
        const validRoles = roles.filter(r => r.roleName.trim());
        if (validRoles.length === 0) return;
        setIsSaving(true);
        try {
            await createTemplate({
                ministryId,
                name: templateName.trim(),
                isDefault,
                createdBy: user?.uid || "system",
                roles: validRoles.map((r, i) => ({ roleName: r.roleName.trim(), count: r.count, notes: r.notes || undefined, order: i })),
            });
            toast({ title: "Template created" });
            setIsCreateOpen(false);
            setMinistryId(""); setTemplateName(""); setIsDefault(false);
            setRoles([{ roleName: "", count: 1, notes: "" }]);
        } catch {
            toast({ variant: "destructive", title: "Failed to create template" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (t: any) => {
        setTemplateToDelete(t);
    };

    const handleConfirmDelete = async () => {
        if (!templateToDelete) return;
        const id = templateToDelete.id;
        setTemplateToDelete(null);
        try {
            await deleteTemplate(id);
            toast({ title: "Template deleted" });
        } catch {
            toast({ variant: "destructive", title: "Failed to delete" });
        }
    };

    // Group visible templates by department → ministry
    const visibleMinistryIds = new Set(visibleMinistries.map((m: any) => m.id));
    const filteredTemplates = templates.filter((t: any) => visibleMinistryIds.has(t.ministryId));

    const byDept = filteredTemplates.reduce<Record<string, Record<string, typeof filteredTemplates>>>((acc, t: any) => {
        const ministry = ministries.find((m: any) => m.id === t.ministryId);
        const deptCode = getDeptCode(ministry);
        const deptName = getDeptName(ministry) || 'Other';
        const mName = ministry?.name || t.ministryId;
        if (!acc[deptName]) acc[deptName] = {};
        if (!acc[deptName][mName]) acc[deptName][mName] = [];
        acc[deptName][mName].push(t);
        return acc;
    }, {});

    // Sort departments in WORDA order
    const DEPT_ORDER = ['Worship', 'Outreach', 'Relationship', 'Discipleship', 'Administration'];
    const sortedDepts = Object.keys(byDept).sort((a, b) => {
        const ai = DEPT_ORDER.indexOf(a);
        const bi = DEPT_ORDER.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
                        Service Templates
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Define reusable role templates per ministry. Apply them when building a Sunday service schedule.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button variant="outline" onClick={() => router.push("/schedule")}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Schedules
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Template
                    </Button>
                </div>
            </div>

            <div className="mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : sortedDepts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            No templates yet. Create one to get started.
                        </CardContent>
                    </Card>
                ) : (
                    sortedDepts.map(deptName => {
                        const deptCode = DEPT_NAME_TO_CODE[deptName] || '';
                        return (
                            <div key={deptName}>
                                {/* Department header */}
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                                        {deptCode}
                                    </div>
                                    <h2 className="text-base font-bold">{deptName}</h2>
                                </div>

                                {Object.entries(byDept[deptName]).map(([ministryName, mTemplates]) => (
                                    <div key={ministryName} className="mb-6 ml-11">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                                            {ministryName}
                                        </h3>
                                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {(mTemplates as any[]).map((t: any) => (
                                                <Card key={t.id}>
                                                    <CardHeader className="pb-2">
                                                        <div className="flex items-start justify-between">
                                                            <div>
                                                                <CardTitle className="text-base">{t.name}</CardTitle>
                                                                {t.isDefault && <Badge variant="secondary" className="mt-1 text-xs">Default</Badge>}
                                                            </div>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive cursor-pointer"
                                                                onClick={() => handleDelete(t)}>
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </div>
                                                    </CardHeader>
                                                    <CardContent className="pt-0">
                                                        <div className="space-y-1">
                                                            {t.roles.map((r: any) => (
                                                                <div key={r.id} className="flex items-center justify-between text-sm">
                                                                    <span>{r.roleName}</span>
                                                                    <Badge variant="outline" className="text-xs">×{r.count}</Badge>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <p className="text-xs text-muted-foreground mt-2">
                                                            {t.roles.reduce((s: number, r: any) => s + r.count, 0)} total slots
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Template Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>New Service Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Ministry</Label>
                            <Select value={ministryId} onValueChange={setMinistryId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select ministry" />
                                </SelectTrigger>
                                <SelectContent>
                                    {visibleMinistries.map((m: any) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            <span className="text-xs text-muted-foreground mr-2">{getDeptCode(m)}</span>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Template Name</Label>
                            <Input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Standard Sunday" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Checkbox id="isDefault" checked={isDefault} onCheckedChange={v => setIsDefault(!!v)} />
                            <Label htmlFor="isDefault" className="font-normal cursor-pointer">Set as default template for this ministry</Label>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>Roles</Label>
                                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={addRole}>
                                    <Plus className="mr-1 h-3 w-3" /> Add Role
                                </Button>
                            </div>
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {roles.map((role, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <Input className="flex-1" placeholder="Role name" value={role.roleName}
                                            onChange={e => updateRole(i, "roleName", e.target.value)} />
                                        <Input type="number" min={1} max={20} className="w-16 text-center" value={role.count}
                                            onChange={e => updateRole(i, "count", parseInt(e.target.value) || 1)} />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive"
                                            onClick={() => removeRole(i)} disabled={roles.length === 1}>
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-muted-foreground">Role name + how many workers needed for that role.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isSaving || !ministryId || !templateName.trim()}>
                            {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Create Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={!!templateToDelete}
                onClose={() => setTemplateToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Service Template"
                itemName={templateToDelete?.name}
                confirmLabel="Delete Template"
            />
        </AppLayout>
    );
}

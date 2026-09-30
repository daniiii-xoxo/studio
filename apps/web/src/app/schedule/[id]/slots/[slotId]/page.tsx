"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@studio/ui";
import { Input } from "@studio/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@studio/ui";
import { Badge } from "@studio/ui";
import { ArrowLeft, Plus, X, CheckCircle2, LoaderCircle, Trash2 } from "lucide-react";
import { useWorshipSlots } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useWorkers } from "@/hooks/use-workers";
import { useToast } from "@/hooks/use-toast";

export default function SlotRolesPage() {
    const { id: scheduleId, slotId } = useParams<{ id: string; slotId: string }>();
    const router = useRouter();
    const { toast } = useToast();

    const { slots, isLoading, addWorker, removeWorker } = useWorshipSlots(scheduleId);
    const { ministries } = useMinistries();
    const { workers } = useWorkers({ limit: 500 });

    const slot = slots.find((s: any) => s.id === slotId);

    const [draftRoles, setDraftRoles] = useState<{ roleName: string; workers: { id: string; name: string }[] }[]>([]);
    const [roleInput, setRoleInput] = useState("");
    const [activeRoleIdx, setActiveRoleIdx] = useState<number | null>(null);
    const [workerSearch, setWorkerSearch] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [initialized, setInitialized] = useState(false);

    useEffect(() => {
        if (!slot || initialized) return;
        const existing: Record<string, { id: string; name: string }[]> = {};
        for (const sw of slot.workers) {
            const key = sw.role || "(No Role)";
            if (!existing[key]) existing[key] = [];
            existing[key].push({ id: sw.workerId, name: sw.workerName });
        }
        const roles = Object.entries(existing).map(([roleName, ws]) => ({ roleName, workers: ws }));
        setDraftRoles(roles);
        if (roles.length > 0) setActiveRoleIdx(0);
        setInitialized(true);
    }, [slot, initialized]);

    const worshipWorkers = useMemo(() => {
        const base = workers.filter((w: any) => {
            if (w.status !== "Active") return false;
            const m = ministries.find((x: any) => x.id === w.majorMinistryId);
            return (m as any)?.departmentCode === "W";
        });
        if (!workerSearch.trim()) return base;
        const q = workerSearch.toLowerCase();
        return base.filter((w: any) =>
            `${w.firstName} ${w.lastName}`.toLowerCase().includes(q) ||
            (w.workerId || "").includes(q)
        );
    }, [workers, ministries, workerSearch]);

    const addRole = () => {
        const name = roleInput.trim();
        if (!name) return;
        if (draftRoles.some(r => r.roleName.toLowerCase() === name.toLowerCase())) return;
        const next = [...draftRoles, { roleName: name, workers: [] }];
        setDraftRoles(next);
        setActiveRoleIdx(next.length - 1);
        setRoleInput("");
        setWorkerSearch("");
    };

    const removeRole = (idx: number) => {
        const next = draftRoles.filter((_, i) => i !== idx);
        setDraftRoles(next);
        if (activeRoleIdx === idx) setActiveRoleIdx(next.length > 0 ? 0 : null);
        else if (activeRoleIdx !== null && activeRoleIdx > idx) setActiveRoleIdx(activeRoleIdx - 1);
    };

    const toggleWorker = (workerId: string, workerName: string) => {
        if (activeRoleIdx === null) return;
        const updated = [...draftRoles];
        const role = { ...updated[activeRoleIdx] };
        const exists = role.workers.some(w => w.id === workerId);
        role.workers = exists
            ? role.workers.filter(w => w.id !== workerId)
            : [...role.workers, { id: workerId, name: workerName }];
        updated[activeRoleIdx] = role;
        setDraftRoles(updated);
    };

    const handleSave = async () => {
        if (!slot) return;
        setIsSaving(true);
        try {
            for (const sw of slot.workers) await removeWorker(sw.id);
            for (const dr of draftRoles) {
                for (const w of dr.workers) {
                    await addWorker({
                        slotId,
                        workerId: w.id,
                        workerName: w.name,
                        role: dr.roleName === "(No Role)" ? undefined : dr.roleName,
                    });
                }
            }
            toast({ title: "Slot saved" });
            router.push(`/schedule/${scheduleId}`);
        } catch {
            toast({ variant: "destructive", title: "Failed to save" });
        } finally {
            setIsSaving(false);
        }
    };

    const totalAssigned = draftRoles.reduce((s, r) => s + r.workers.length, 0);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <LoaderCircle className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!slot) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background">
                <p className="text-muted-foreground">Slot not found.</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-background overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b bg-card shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => router.push(`/schedule/${scheduleId}`)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-semibold leading-tight">{slot.slotName} — Manage Roles</h1>
                        <p className="text-xs text-muted-foreground">
                            {draftRoles.length} role{draftRoles.length !== 1 ? "s" : ""} · {totalAssigned} worker{totalAssigned !== 1 ? "s" : ""} assigned
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push(`/schedule/${scheduleId}`)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save
                    </Button>
                </div>
            </div>

            {/* Body — two columns */}
            <div className="flex flex-1 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                {/* Left — Roles panel */}
                <div className="w-72 border-r flex flex-col shrink-0 bg-card">
                    <div className="px-4 py-3 border-b">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Roles</p>
                        <div className="flex gap-2">
                            <Input
                                value={roleInput}
                                onChange={e => setRoleInput(e.target.value)}
                                placeholder="e.g. Worship Leader"
                                className="h-9 text-sm"
                                onKeyDown={e => e.key === "Enter" && addRole()}
                                autoFocus
                            />
                            <Button size="sm" className="h-9 px-3 shrink-0" onClick={addRole} disabled={!roleInput.trim()}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {draftRoles.length === 0 && (
                            <p className="text-xs text-muted-foreground text-center py-10 px-4">
                                Type a role name above and press Enter or +
                            </p>
                        )}
                        {draftRoles.map((dr, idx) => (
                            <button
                                key={idx}
                                className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm border-b transition-colors hover:bg-muted/50 ${activeRoleIdx === idx ? "bg-muted font-semibold" : ""}`}
                                onClick={() => { setActiveRoleIdx(idx); setWorkerSearch(""); }}
                            >
                                <span className="truncate flex-1">{dr.roleName}</span>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {dr.workers.length > 0 && (
                                        <Badge variant="secondary" className="text-xs px-1.5 py-0">{dr.workers.length}</Badge>
                                    )}
                                    <button
                                        className="text-muted-foreground hover:text-destructive p-0.5 rounded"
                                        onClick={e => { e.stopPropagation(); removeRole(idx); }}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right — Worker picker */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeRoleIdx === null ? (
                        <div className="flex-1 flex items-center justify-center">
                            <p className="text-sm text-muted-foreground">Select a role on the left to assign workers</p>
                        </div>
                    ) : (
                        <>
                            {/* Role header + chips + search */}
                            <div className="px-6 py-3 border-b bg-card shrink-0">
                                <p className="text-sm font-semibold mb-2">
                                    Assigning to: <span className="text-primary">{draftRoles[activeRoleIdx]?.roleName}</span>
                                </p>

                                {draftRoles[activeRoleIdx]?.workers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mb-3">
                                        {draftRoles[activeRoleIdx].workers.map(w => (
                                            <span key={w.id} className="flex items-center gap-1 bg-muted border rounded-full px-2.5 py-0.5 text-xs">
                                                {w.name}
                                                <button onClick={() => toggleWorker(w.id, w.name)}>
                                                    <X className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}

                                <Input
                                    value={workerSearch}
                                    onChange={e => setWorkerSearch(e.target.value)}
                                    placeholder="Search Worship workers by name or ID..."
                                    className="h-9 text-sm max-w-md"
                                />
                            </div>

                            {/* Worker list */}
                            <div className="flex-1 overflow-y-auto">
                                {worshipWorkers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-16">No Worship workers found.</p>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-0">
                                    {worshipWorkers.map((w: any) => {
                                        const isAssigned = draftRoles[activeRoleIdx]?.workers.some(x => x.id === w.id);
                                        const ministryName = ministries.find((m: any) => m.id === w.majorMinistryId)?.name?.replace(/^[WORDA]-/i, "") || "—";
                                        return (
                                            <button
                                                key={w.id}
                                                className={`flex items-center gap-3 px-4 py-3 border-b border-r text-left transition-colors hover:bg-muted/50 ${isAssigned ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                                                onClick={() => toggleWorker(w.id, `${w.firstName} ${w.lastName}`)}
                                            >
                                                <Avatar className="h-9 w-9 shrink-0">
                                                    <AvatarImage src={w.avatarUrl} />
                                                    <AvatarFallback className="text-xs">{w.firstName[0]}{w.lastName[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{w.firstName} {w.lastName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">{ministryName}</p>
                                                </div>
                                                {isAssigned && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

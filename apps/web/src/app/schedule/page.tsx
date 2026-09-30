"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { format, nextSunday, isSunday } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@studio/ui";
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
import { Textarea } from "@studio/ui";
import { PlusCircle, CalendarDays, ChevronRight, Trash2, LoaderCircle, LayoutTemplate } from "lucide-react";
import { useServiceSchedules } from "@/hooks/use-schedule";
import { useMinistries } from "@/hooks/use-ministries";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import { upsertAssignment } from "@/actions/schedule";

const STATUS_COLORS: Record<string, string> = {
    Draft: "secondary",
    Published: "default",
    Completed: "outline",
};

export default function SchedulePage() {
    const router = useRouter();
    const { toast } = useToast();
    const { user } = useAuthStore();
    const { schedules, isLoading, createSchedule, deleteSchedule } = useServiceSchedules();
    const { ministries } = useMinistries();
    const { canAssignSchedulers, isSuperAdmin, workerProfile } = useUserRole();

    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newDate, setNewDate] = useState(() => {
        const today = new Date();
        const sunday = isSunday(today) ? today : nextSunday(today);
        return format(sunday, "yyyy-MM-dd");
    });
    const [newTitle, setNewTitle] = useState("Sunday Service");
    const [newNotes, setNewNotes] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState<any | null>(null);

    const handleCreate = async () => {
        if (!newDate) return;
        setIsCreating(true);
        try {
            const schedule = await createSchedule({
                date: new Date(newDate),
                title: newTitle || "Sunday Service",
                notes: newNotes || undefined,
                createdBy: user?.uid || "system",
            });

            // Department Schedulers: auto-add all ministries in their department alphabetically
            if ((canAssignSchedulers || isSuperAdmin) && workerProfile?.majorMinistryId) {
                const userMinistry = ministries.find((m: any) => m.id === workerProfile.majorMinistryId);
                const userDept = (userMinistry as any)?.department || (userMinistry as any)?.departmentCode;
                if (userDept) {
                    const deptMinistries = ministries
                        .filter((m: any) => m.department === userDept || m.departmentCode === userDept)
                        .sort((a: any, b: any) => a.name.localeCompare(b.name));

                    for (const ministry of deptMinistries) {
                        await upsertAssignment({
                            scheduleId: schedule.id,
                            ministryId: ministry.id,
                            roleName: 'Role',
                            order: 0,
                        });
                    }
                }
            }

            toast({ title: "Schedule created" });
            setIsCreateOpen(false);
            router.push(`/schedule/${schedule.id}`);
        } catch {
            toast({ variant: "destructive", title: "Failed to create schedule" });
        } finally {
            setIsCreating(false);
        }
    };

    const handleDelete = (s: any, e: React.MouseEvent) => {
        e.stopPropagation();
        setScheduleToDelete(s);
    };

    const handleConfirmDelete = async () => {
        if (!scheduleToDelete) return;
        const id = scheduleToDelete.id;
        setScheduleToDelete(null);
        try {
            await deleteSchedule(id);
            toast({ title: "Schedule deleted" });
        } catch {
            toast({ variant: "destructive", title: "Failed to delete" });
        }
    };

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
                        Sunday Service Schedule
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        View and manage weekly Sunday service schedules and ministry role assignments.
                    </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                    <Button variant="outline" onClick={() => router.push("/schedule/templates")}>
                        <LayoutTemplate className="mr-2 h-4 w-4" /> Templates
                    </Button>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New Schedule
                    </Button>
                </div>
            </div>

            <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {isLoading ? (
                    <div className="flex justify-center py-10">
                        <LoaderCircle className="h-8 w-8 animate-spin" />
                    </div>
                ) : schedules.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <CalendarDays className="h-12 w-12 text-muted-foreground mb-4" />
                            <CardTitle className="mb-2">No schedules yet</CardTitle>
                            <CardDescription className="mb-4">Create your first Sunday service schedule to get started.</CardDescription>
                            <Button onClick={() => setIsCreateOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> New Schedule
                            </Button>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="rounded-lg border shadow-sm overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Assignments</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {schedules.map((s: any) => (
                                    <TableRow
                                        key={s.id}
                                        className="cursor-pointer hover:bg-muted/50"
                                        onClick={() => router.push(`/schedule/${s.id}`)}
                                    >
                                        <TableCell className="font-medium">
                                            {format(new Date(s.date), "EEEE, MMMM d, yyyy")}
                                        </TableCell>
                                        <TableCell>{s.title}</TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {s.assignments.length} slots
                                                {" · "}
                                                {s.assignments.filter((a: any) => a.workerId).length} filled
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={STATUS_COLORS[s.status] as any ?? "secondary"}>
                                                {s.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost" size="icon"
                                                    onClick={(e) => handleDelete(s, e)}
                                                    className="h-8 w-8 text-destructive hover:text-destructive cursor-pointer"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Create Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>New Sunday Service Schedule</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="space-y-1.5">
                            <Label>Date</Label>
                            <Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Title</Label>
                            <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Sunday Service" />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Notes (optional)</Label>
                            <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} placeholder="Any special notes for this service..." rows={3} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={isCreating}>
                            {isCreating && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                isOpen={!!scheduleToDelete}
                onClose={() => setScheduleToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Delete Schedule"
                confirmLabel="Delete Schedule"
                description={
                    scheduleToDelete ? (
                        <>
                            Are you sure you want to delete <strong className="text-foreground font-semibold">{scheduleToDelete.title || "this schedule"}</strong> for {format(new Date(scheduleToDelete.date), "MMMM d, yyyy")}? This action cannot be undone.
                        </>
                    ) : undefined
                }
            />
        </AppLayout>
    );
}

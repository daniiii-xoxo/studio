"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';

// ── Service Schedules ─────────────────────────────────────────────────────────

export async function getServiceSchedules() {
    return prisma.serviceSchedule.findMany({
        orderBy: { date: 'desc' },
        include: {
            assignments: true,
        },
    });
}

export async function getServiceSchedule(id: string) {
    return prisma.serviceSchedule.findUnique({
        where: { id },
        include: {
            assignments: {
                orderBy: [{ ministryId: 'asc' }, { order: 'asc' }],
            },
        },
    });
}

export async function createServiceSchedule(data: {
    date: Date;
    title?: string;
    notes?: string;
    createdBy: string;
}) {
    const schedule = await prisma.serviceSchedule.create({
        data: {
            date: data.date,
            title: data.title || 'Sunday Service',
            notes: data.notes,
            createdBy: data.createdBy,
        },
    });
    revalidatePath('/schedule');
    return schedule;
}

export async function updateServiceSchedule(id: string, data: {
    title?: string;
    notes?: string;
    status?: string;
}) {
    const schedule = await prisma.serviceSchedule.update({
        where: { id },
        data,
    });
    revalidatePath('/schedule');
    revalidatePath(`/schedule/${id}`);
    return schedule;
}

export async function deleteServiceSchedule(id: string) {
    await prisma.serviceSchedule.delete({ where: { id } });
    revalidatePath('/schedule');
}

// ── Schedule Assignments ──────────────────────────────────────────────────────

export async function upsertAssignment(data: {
    scheduleId: string;
    ministryId: string;
    roleName: string;
    workerId?: string | null;
    workerName?: string | null;
    notes?: string | null;
    order?: number;
}) {
    // Find existing slot for this schedule + ministry + role + order
    const existing = await prisma.scheduleAssignment.findFirst({
        where: {
            scheduleId: data.scheduleId,
            ministryId: data.ministryId,
            roleName: data.roleName,
            order: data.order ?? 0,
        },
    });

    if (existing) {
        return prisma.scheduleAssignment.update({
            where: { id: existing.id },
            data: {
                workerId: data.workerId ?? null,
                workerName: data.workerName ?? null,
                notes: data.notes ?? null,
            },
        });
    }

    return prisma.scheduleAssignment.create({ data: {
        scheduleId: data.scheduleId,
        ministryId: data.ministryId,
        roleName: data.roleName,
        workerId: data.workerId ?? null,
        workerName: data.workerName ?? null,
        notes: data.notes ?? null,
        order: data.order ?? 0,
    }});
}

export async function deleteAssignment(id: string) {
    await prisma.scheduleAssignment.delete({ where: { id } });
}

export async function applyTemplateToSchedule(scheduleId: string, templateId: string) {
    const template = await prisma.serviceTemplate.findUnique({
        where: { id: templateId },
        include: { roles: { orderBy: { order: 'asc' } } },
    });
    if (!template) throw new Error('Template not found');

    // Remove existing assignments for this ministry on this schedule
    await prisma.scheduleAssignment.deleteMany({
        where: { scheduleId, ministryId: template.ministryId },
    });

    // Create blank slots from template
    await prisma.scheduleAssignment.createMany({
        data: template.roles.flatMap(role =>
            Array.from({ length: role.count }, (_, i) => ({
                scheduleId,
                ministryId: template.ministryId,
                roleName: role.roleName,
                order: i,
                notes: role.notes ?? null,
            }))
        ),
    });

    revalidatePath(`/schedule/${scheduleId}`);
}

// ── Service Templates ─────────────────────────────────────────────────────────

export async function getServiceTemplates(ministryId?: string) {
    return prisma.serviceTemplate.findMany({
        where: ministryId ? { ministryId } : undefined,
        include: { roles: { orderBy: { order: 'asc' } } },
        orderBy: [{ ministryId: 'asc' }, { name: 'asc' }],
    });
}

export async function createServiceTemplate(data: {
    ministryId: string;
    name: string;
    isDefault?: boolean;
    createdBy: string;
    roles: { roleName: string; count: number; notes?: string; order?: number }[];
}) {
    const template = await prisma.serviceTemplate.create({
        data: {
            ministryId: data.ministryId,
            name: data.name,
            isDefault: data.isDefault ?? false,
            createdBy: data.createdBy,
            roles: {
                create: data.roles.map((r, i) => ({
                    roleName: r.roleName,
                    count: r.count,
                    notes: r.notes ?? null,
                    order: r.order ?? i,
                })),
            },
        },
        include: { roles: true },
    });
    revalidatePath('/schedule/templates');
    return template;
}

export async function updateServiceTemplate(id: string, data: {
    name?: string;
    isDefault?: boolean;
    roles?: { roleName: string; count: number; notes?: string; order?: number }[];
}) {
    if (data.roles) {
        await prisma.templateRole.deleteMany({ where: { templateId: id } });
        await prisma.templateRole.createMany({
            data: data.roles.map((r, i) => ({
                templateId: id,
                roleName: r.roleName,
                count: r.count,
                notes: r.notes ?? null,
                order: r.order ?? i,
            })),
        });
    }

    const template = await prisma.serviceTemplate.update({
        where: { id },
        data: {
            name: data.name,
            isDefault: data.isDefault,
        },
        include: { roles: { orderBy: { order: 'asc' } } },
    });
    revalidatePath('/schedule/templates');
    return template;
}

export async function deleteServiceTemplate(id: string) {
    await prisma.serviceTemplate.delete({ where: { id } });
    revalidatePath('/schedule/templates');
}

// ── Publish & Notify ──────────────────────────────────────────────────────────

export async function publishScheduleAndNotify(scheduleId: string, publishedBy: string) {
    const schedule = await prisma.serviceSchedule.update({
        where: { id: scheduleId },
        data: { status: 'Published' },
        include: { assignments: true },
    });

    void publishedBy; // reserved for audit log

    // Get unique worker IDs that are assigned
    const workerIds = [...new Set(
        schedule.assignments
            .filter(a => a.workerId)
            .map(a => a.workerId as string)
    )];

    // Email notifications disabled — return count of workers who would be notified
    revalidatePath(`/schedule/${scheduleId}`);
    revalidatePath('/schedule');
    return { schedule, notified: workerIds.length };
}

// ── Confirm Assignment ────────────────────────────────────────────────────────

export async function confirmAssignment(assignmentId: string, confirmedBy: string) {
    const assignment = await (prisma.scheduleAssignment as any).update({
        where: { id: assignmentId },
        data: {
            acknowledgedAt: new Date(),
            acknowledgedBy: confirmedBy,
            attendanceStatus: 'Confirmed',
        },
    });
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

export async function setAttendanceStatus(assignmentId: string, status: 'Confirmed' | 'Pending' | 'Not Attending', updatedBy: string) {
    const assignment = await (prisma.scheduleAssignment as any).update({
        where: { id: assignmentId },
        data: {
            attendanceStatus: status,
            acknowledgedAt: status !== 'Pending' ? new Date() : null,
            acknowledgedBy: status !== 'Pending' ? updatedBy : null,
        },
    });
    revalidatePath(`/schedule/${assignment.scheduleId}`);
    return assignment;
}

export async function getScheduleConfirmationStatus(scheduleId: string) {
    const assignments = await prisma.scheduleAssignment.findMany({
        where: { scheduleId, workerId: { not: null } },
        select: {
            id: true, workerId: true, workerName: true,
            roleName: true, ministryId: true,
            acknowledgedAt: true, acknowledgedBy: true,
            attendanceStatus: true,
        },
    });
    return assignments;
}

// ── Worker ID lookup for assignment ──────────────────────────────────────────

export async function findWorkerByWorkerId(workerId: string) {
    return prisma.worker.findFirst({
        where: { workerId },
        select: { id: true, firstName: true, lastName: true, majorMinistryId: true, status: true },
    });
}

// ── Conflict Detection ────────────────────────────────────────────────────────

export async function getWorkerConflicts(scheduleId: string) {
    const assignments = await prisma.scheduleAssignment.findMany({
        where: { scheduleId, workerId: { not: null } },
        select: { id: true, workerId: true, workerName: true, ministryId: true, roleName: true },
    });

    // Find workers assigned to more than one ministry in this schedule
    const byWorker: Record<string, typeof assignments> = {};
    for (const a of assignments) {
        if (!a.workerId) continue;
        if (!byWorker[a.workerId]) byWorker[a.workerId] = [];
        byWorker[a.workerId].push(a);
    }

    return Object.entries(byWorker)
        .filter(([, slots]) => {
            const ministries = new Set(slots.map(s => s.ministryId));
            return ministries.size > 1;
        })
        .map(([workerId, slots]) => ({ workerId, workerName: slots[0].workerName, slots }));
}

// ── Public Schedule ───────────────────────────────────────────────────────────

export async function togglePublicSchedule(id: string, isPublic: boolean) {
    const token = isPublic ? crypto.randomUUID() : null;
    const schedule = await (prisma.serviceSchedule as any).update({
        where: { id },
        data: { isPublic, publicToken: token },
    });
    revalidatePath(`/schedule/${id}`);
    return schedule;
}

export async function getPublicSchedule(token: string) {
    return (prisma.serviceSchedule as any).findUnique({
        where: { publicToken: token, isPublic: true },
        include: {
            assignments: {
                orderBy: [{ ministryId: 'asc' }, { order: 'asc' }],
            },
        },
    });
}

// ── History ───────────────────────────────────────────────────────────────────

export async function getScheduleHistory() {
    const now = new Date();
    return prisma.serviceSchedule.findMany({
        where: { date: { lt: now } },
        orderBy: { date: 'desc' },
        include: { assignments: true },
        take: 20,
    });
}

// ── Scheduler Assignment ──────────────────────────────────────────────────────

// ── Worship Slots ─────────────────────────────────────────────────────────────

export async function getWorshipSlots(scheduleId: string) {
    return prisma.worshipSlot.findMany({
        where: { scheduleId },
        include: { workers: { orderBy: { createdAt: 'asc' } } },
        orderBy: { order: 'asc' },
    });
}

export async function createWorshipSlot(data: {
    scheduleId: string;
    slotName: string;
    notes?: string;
    order?: number;
}) {
    const isTws = data.slotName.toUpperCase() === 'TWS';
    const slot = await prisma.worshipSlot.create({
        data: {
            scheduleId: data.scheduleId,
            slotName: data.slotName,
            isTws,
            notes: data.notes ?? null,
            order: data.order ?? 0,
        },
        include: { workers: true },
    });
    revalidatePath(`/schedule/${data.scheduleId}`);
    return slot;
}

export async function updateWorshipSlot(id: string, data: { slotName?: string; notes?: string; order?: number }) {
    const updateData: any = { ...data };
    if (data.slotName !== undefined) {
        updateData.isTws = data.slotName.toUpperCase() === 'TWS';
    }
    const slot = await prisma.worshipSlot.update({ where: { id }, data: updateData, include: { workers: true } });
    revalidatePath(`/schedule/${slot.scheduleId}`);
    return slot;
}

export async function deleteWorshipSlot(id: string) {
    const slot = await prisma.worshipSlot.delete({ where: { id } });
    revalidatePath(`/schedule/${slot.scheduleId}`);
}

export async function addWorkerToWorshipSlot(slotId: string, workerId: string, workerName: string, role?: string) {
    const entry = await prisma.worshipSlotWorker.create({
        data: { slotId, workerId, workerName, role: role ?? null },
    });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: slotId } });
    if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
    return entry;
}

export async function removeWorkerFromWorshipSlot(id: string) {
    const entry = await prisma.worshipSlotWorker.delete({ where: { id } });
    const slot = await prisma.worshipSlot.findUnique({ where: { id: entry.slotId } });
    if (slot) revalidatePath(`/schedule/${slot.scheduleId}`);
}

// ── Scheduler Assignment ──────────────────────────────────────────────────────

export async function assignMinistryScheduler(ministryId: string, workerId: string | null, actorId?: string) {
    if (actorId) {
        const { getActorMinistryAccess } = await import('@/actions/db');
        const access = await getActorMinistryAccess(actorId);
        if (!access.isSuperAdmin && access.allowedMinistryIds !== null) {
            if (!access.allowedMinistryIds.includes(ministryId)) {
                throw new Error('Unauthorized: cannot assign a scheduler to a ministry outside your assigned ministries.');
            }
        }
    }
    await (prisma.ministry as any).update({
        where: { id: ministryId },
        data: { schedulerId: workerId },
    });
    revalidatePath('/schedule');
}

export async function getMinistrySchedulers() {
    const ministries = await (prisma.ministry as any).findMany({
        select: { id: true, name: true, schedulerId: true },
    });
    return ministries as { id: string; name: string; schedulerId: string | null }[];
}

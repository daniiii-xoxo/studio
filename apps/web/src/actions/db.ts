"use server";

import { prisma } from '@studio/database/prisma';
import { revalidatePath } from 'next/cache';
import { NotificationService } from '@/services/notification-service';
import { getSupabaseAdminClient } from '@/lib/supabase-admin';
import { EmailService } from '@/services/email-service';
import { type AttendanceShiftSettings, DEFAULT_ATTENDANCE_SETTINGS } from '@/lib/attendance-config';

export type { AttendanceShiftSettings };

const DEPARTMENT_NAME_TO_CODE: Record<string, string> = {
    Worship: 'W',
    Outreach: 'O',
    Relationship: 'R',
    Discipleship: 'D',
    Administration: 'A',
};

const DEPARTMENT_CODE_TO_NAME: Record<string, string> = {
    W: 'Worship',
    O: 'Outreach',
    R: 'Relationship',
    D: 'Discipleship',
    A: 'Administration',
};

function normalizeDepartmentCode(input: string | null | undefined): string {
    if (!input) return 'D';
    const trimmed = input.trim();
    if (!trimmed) return 'D';

    if (trimmed.length === 1) {
        const code = trimmed.toUpperCase();
        return DEPARTMENT_CODE_TO_NAME[code] ? code : 'D';
    }

    return DEPARTMENT_NAME_TO_CODE[trimmed] || 'D';
}

function mapMinistryForClient(ministry: any) {
    const departmentCode = ministry.departmentCode;
    return {
        ...ministry,
        department: DEPARTMENT_CODE_TO_NAME[departmentCode] || 'Discipleship',
        departmentCode,
    };
}

// --- Roles ---

export async function getRoles() {
    return await prisma.role.findMany({
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
        orderBy: { name: 'asc' },
    });
}

export async function getRoleById(id: string) {
    return await prisma.role.findUnique({
        where: { id },
        include: {
            rolePermissions: {
                include: { permission: true },
            },
        },
    });
}

// --- Permissions ---

export async function getPermissions() {
    return await prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
    });
}

export async function setRolePermissions(roleId: string, permissionIds: string[]) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    if (permissionIds.length > 0) {
        await prisma.rolePermission.createMany({
            data: permissionIds.map(permissionId => ({ roleId, permissionId })),
        });
    }
    revalidatePath('/settings/roles');
}

/** Set permissions using "module:action" strings instead of UUIDs. */
export async function setRolePermissionsByKeys(roleId: string, permKeys: string[]) {
    if (permKeys.length === 0) {
        // Just clear all permissions for this role
        await prisma.rolePermission.deleteMany({ where: { roleId } });
        revalidatePath('/settings/roles');
        return;
    }

    // Fetch all permissions from DB
    const allPerms = await prisma.permission.findMany();
    const permMap = new Map(allPerms.map(p => [`${p.module}:${p.action}`, p.id]));

    // Upsert any permissions that don't exist yet (e.g. newly added inventory:manage)
    const missing = permKeys.filter(k => !permMap.has(k));
    for (const key of missing) {
        const [module, ...actionParts] = key.split(':');
        const action = actionParts.join(':');
        if (!module || !action) continue;
        const created = await prisma.permission.upsert({
            where: { module_action: { module, action } },
            update: {},
            create: { module, action },
        });
        permMap.set(key, created.id);
    }

    const ids = permKeys.map(k => permMap.get(k)).filter(Boolean) as string[];
    return await setRolePermissions(roleId, ids);
}

// --- WorkerRole ---

export async function getWorkerRoles(workerId: string) {
    return await prisma.workerRole.findMany({
        where: { workerId },
        include: {
            role: {
                include: {
                    rolePermissions: { include: { permission: true } },
                },
            },
        },
    });
}

export async function assignRolesToWorker(workerId: string, roleIds: string[], assignedBy?: string) {
    // Remove roles not in the new list
    await prisma.workerRole.deleteMany({
        where: { workerId, roleId: { notIn: roleIds } },
    });
    // Add any new roles
    for (const roleId of roleIds) {
        await prisma.workerRole.upsert({
            where: { workerId_roleId: { workerId, roleId } },
            update: {},
            create: { workerId, roleId, assignedBy },
        });
    }
    // Keep legacy roleId in sync (use first role as primary)
    if (roleIds.length > 0) {
        await prisma.worker.update({
            where: { id: workerId },
            data: { roleId: roleIds[0] },
        });
    }
    revalidatePath('/workers');
}

export async function createRole(data: any) {
    const role = await prisma.role.create({ data });
    revalidatePath('/settings/roles');
    return role;
}

export async function upsertRole(id: string, data: { name: string; permissions: string[]; isSuperAdmin?: boolean; isSystemRole?: boolean }) {
    return prisma.role.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
    });
}

export async function updateRole(id: string, data: any) {
    const role = await prisma.role.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/roles');
    return role;
}

export async function deleteRole(id: string) {
    await prisma.role.delete({ where: { id } });
    revalidatePath('/settings/roles');
}

// --- Workers ---

export async function getWorkers() {
    return await prisma.worker.findMany({
        include: {
            role: true,
            roles: { include: { role: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getPaginatedWorkers(
    page: number = 1,
    limit: number = 25,
    filters: {
        search?: string;
        searchMode?: 'workerId' | 'name';
        ministryIds?: string[];
        sortField?: string;
        sortDir?: 'asc' | 'desc';
    } = {}
) {
    const where: any = {};
    if (filters.ministryIds && filters.ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: filters.ministryIds } },
            { minorMinistryId: { in: filters.ministryIds } }
        ];
    }
    if (filters.search) {
        const q = filters.search.trim();
        const mode = filters.searchMode || 'workerId';
        where.AND = [{
            OR: mode === 'workerId'
                ? [{ workerId: { contains: q, mode: 'insensitive' } }]
                : [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } },
                ]
        }];
    }

    const sortField = filters.sortField || 'workerId';
    const sortDir = filters.sortDir || 'asc';
    const offset = (page - 1) * limit;

    // Build ORDER BY — workerId sorts numerically via CAST to avoid "10 < 2" string ordering
    let orderByClause: string;
    if (sortField === 'workerId') {
        orderByClause = `NULLIF(regexp_replace("workerId", '[^0-9]', '', 'g'), '')::bigint ${sortDir.toUpperCase()} NULLS LAST`;
    } else if (sortField === 'name') {
        orderByClause = `"firstName" ${sortDir.toUpperCase()}, "lastName" ${sortDir.toUpperCase()}`;
    } else if (sortField === 'status') {
        orderByClause = `"status" ${sortDir.toUpperCase()}`;
    } else {
        orderByClause = `"createdAt" DESC`;
    }

    // Build WHERE conditions for raw query
    const conditions: string[] = [];
    const queryParams: any[] = [];
    let paramIdx = 1;

    if (filters.ministryIds && filters.ministryIds.length > 0) {
        const ids = filters.ministryIds;
        const majorPlaceholders = ids.map(() => `$${paramIdx++}`).join(', ');
        const minorPlaceholders = ids.map(() => `$${paramIdx++}`).join(', ');
        conditions.push(`("majorMinistryId" IN (${majorPlaceholders}) OR "minorMinistryId" IN (${minorPlaceholders}))`);
        queryParams.push(...ids, ...ids);
    }

    if (filters.search) {
        const q = `%${filters.search.trim()}%`;
        if (filters.searchMode === 'name') {
            conditions.push(`("firstName" ILIKE $${paramIdx} OR "lastName" ILIKE $${paramIdx})`);
            queryParams.push(q);
            paramIdx++;
        } else {
            conditions.push(`"workerId" ILIKE $${paramIdx}`);
            queryParams.push(q);
            paramIdx++;
        }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Run count + paginated fetch in parallel
    const [countResult, workers] = await Promise.all([
        prisma.$queryRawUnsafe<[{ count: bigint }]>(
            `SELECT COUNT(*) as count FROM "Worker" ${whereClause}`,
            ...queryParams
        ),
        prisma.$queryRawUnsafe<any[]>(
            `SELECT id, "workerId", "firstName", "lastName", email, phone, "roleId", status,
                    "avatarUrl", "majorMinistryId", "minorMinistryId", "employmentType",
                    "passwordChangeRequired", "qrToken", "createdAt"
             FROM "Worker"
             ${whereClause}
             ORDER BY ${orderByClause}
             LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
            ...queryParams, limit, offset
        ),
    ]);

    const total = Number(countResult[0]?.count ?? 0);
    return { total, workers, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getWorkerStats(ministryIds?: string[]) {
    const where: any = {};
    if (ministryIds && ministryIds.length > 0) {
        where.OR = [
            { majorMinistryId: { in: ministryIds } },
            { minorMinistryId: { in: ministryIds } }
        ];
    }

    // Use DB-level counts — much faster than fetching all rows
    const [total, active, inactive] = await prisma.$transaction([
        prisma.worker.count({ where }),
        prisma.worker.count({ where: { ...where, status: 'Active' } }),
        prisma.worker.count({ where: { ...where, status: 'Inactive' } }),
    ]);
    const secondary = 0; // legacy field — skip expensive query

    let ministryStats: { ministryId: string; total: number; active: number; inactive: number; secondary: number }[] = [];

    if (ministryIds?.length) {
        const [allW, activeW] = await prisma.$transaction([
            prisma.worker.findMany({
                where: { OR: [{ majorMinistryId: { in: ministryIds } }, { minorMinistryId: { in: ministryIds } }] },
                select: { majorMinistryId: true, minorMinistryId: true, status: true },
            }),
            prisma.worker.findMany({
                where: { OR: [{ majorMinistryId: { in: ministryIds } }, { minorMinistryId: { in: ministryIds } }], status: 'Active' },
                select: { majorMinistryId: true, minorMinistryId: true },
            }),
        ]);

        ministryStats = ministryIds.map(id => {
            const mw = allW.filter((w: any) => w.majorMinistryId === id || w.minorMinistryId === id);
            const ma = activeW.filter((w: any) => w.majorMinistryId === id || w.minorMinistryId === id);
            return { ministryId: id, total: mw.length, active: ma.length, inactive: mw.length - ma.length, secondary: 0 };
        });
    }

    return { total, active, inactive, secondary, ministryStats };
}

export async function getWorkerById(id: string) {
    try {
        return await prisma.worker.findUnique({
            where: { id },
            include: {
                role: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
    } catch {
        // Fallback if rolePermissions table doesn't exist yet
        return await prisma.worker.findUnique({
            where: { id },
            include: { role: true },
        });
    }
}

export async function getWorkerByEmail(email: string) {
    try {
        return await prisma.worker.findUnique({
            where: { email },
            include: {
                role: true,
                roles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: { include: { permission: true } },
                            },
                        },
                    },
                },
            },
        });
    } catch {
        return await prisma.worker.findUnique({
            where: { email },
            include: { role: true },
        });
    }
}

export async function createWorker(data: any) {
    const worker = await prisma.worker.create({
        data: {
            ...data,
            createdAt: new Date(),
        },
    });
    revalidatePath('/workers');
    return worker;
}

export async function createWorkerWithAuth(data: any, roleIds: string[], assignedBy?: string) {
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: "Password123",
      email_confirm: true,
      user_metadata: {
        firstName: data.firstName,
        lastName: data.lastName
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        throw new Error('Email is already registered. Please use another email.');
      }
      throw new Error(`Failed to create Auth user: ${authError.message}`);
    }

    // Now create in DB
    const { roleId, role, roles, approvals, attendanceRecords, bookings, venueBookings, InventoryBorrowing, InventoryLog, mealStubs, legacyMigratedAt, legacyMigratedFrom, createdAt, updatedAt, ...dbData } = data;
    
    const workerData = {
        ...dbData,
        id: authData.user.id,
        createdAt: new Date(),
    };
    if (roleIds && roleIds.length > 0) {
        workerData.roleId = roleIds[0];
    }

    const worker = await prisma.worker.create({
        data: workerData,
    });

    // Assign roles
    if (roleIds && roleIds.length > 0) {
        await assignRolesToWorker(worker.id, roleIds, assignedBy);
    }
    
    revalidatePath('/workers');
    return worker;
}

export async function updateWorker(id: string, data: any) {
    // Strip relation objects and fields not in the DB schema to avoid Prisma validation errors
    const {
        role, roles, approvals, attendanceRecords, bookings,
        venueBookings, InventoryBorrowing, InventoryLog, mealStubs,
        legacyMigratedAt, legacyMigratedFrom,
        createdAt, updatedAt,
        ...safeData
    } = data;

    // roleId may not exist in DB yet — use raw update to handle it gracefully
    const { roleId, ...dataWithoutRoleId } = safeData;

    const updateData: any = { ...dataWithoutRoleId };
    if (roleId !== undefined) updateData.roleId = roleId;

    const worker = await prisma.worker.update({
        where: { id },
        data: updateData,
    });
    revalidatePath('/workers');
    return worker;
}

export async function deleteWorker(id: string) {
    const supabaseAdmin = getSupabaseAdminClient();
    try {
        await supabaseAdmin.auth.admin.deleteUser(id);
    } catch (e) {
        console.error('Failed to delete auth user:', e);
    }

    await prisma.worker.delete({
        where: { id },
    });
    revalidatePath('/workers');
}

export async function deleteWorkers(ids: string[]) {
    const supabaseAdmin = getSupabaseAdminClient();
    for (const id of ids) {
        try {
            await supabaseAdmin.auth.admin.deleteUser(id);
        } catch (e) {
            console.error('Failed to delete auth user:', e);
        }
    }

    await prisma.worker.deleteMany({
        where: { id: { in: ids } },
    });
    revalidatePath('/workers');
}

// --- Approvals ---

export async function createApproval(data: any) {
    const approval = await prisma.approvalRequest.create({
        data: {
            ...data,
            date: new Date(),
        },
    });

    // Trigger async notification
    NotificationService.notifyNewRequest(approval);

    return approval;
}

export async function getApprovals() {
    return await prisma.approvalRequest.findMany({
        orderBy: {
            date: 'desc',
        },
    });
}

export async function updateApproval(id: string, data: any) {
    const approval = await prisma.approvalRequest.update({
        where: { id },
        data,
    });

    const status = data.status;

    // Handle side-effects for Room Bookings
    if (approval.type === 'Room Booking' && approval.reservationId) {
        await prisma.booking.update({
            where: { id: approval.reservationId },
            data: { status },
        }).catch(err => {
            console.error('Failed to update booking status:', err);
        });
    }

    // Handle final approval side-effects for workers
    if (status === 'Approved') {
        if (approval.type === 'New Worker' && approval.workerId) {
            await prisma.worker.update({
                where: { id: approval.workerId },
                data: { status: 'Active' },
            }).catch(err => {
                console.error('Failed to activate worker status:', err);
            });
        }

        if (approval.type === 'Ministry Change' && approval.workerId) {
            await prisma.worker.update({
                where: { id: approval.workerId },
                data: {
                    majorMinistryId: approval.newMajorId || '',
                    minorMinistryId: approval.newMinorId || '',
                },
            }).catch(err => {
                console.error('Failed to update worker ministry:', err);
            });
        }
    }

    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return approval;
}

// --- Ministries ---

export async function getMinistries() {
    const ministries = await prisma.ministry.findMany({
        include: {
            department: true,
        },
        orderBy: [
            { department: { weight: 'asc' } },
            { weight: 'asc' },
            { name: 'asc' },
        ],
    });

    return ministries.map(mapMinistryForClient);
}

export async function createMinistry(data: any) {
    const departmentCode = normalizeDepartmentCode(data.departmentCode || data.department);
    const { department, departmentCode: _departmentCode, ...rest } = data;
    const ministry = await prisma.ministry.create({
        data: {
            ...rest,
            department: {
                connect: { code: departmentCode },
            },
        },
        include: {
            department: true,
        },
    });
    revalidatePath('/settings/ministries');
    return mapMinistryForClient(ministry);
}

export async function updateMinistry(id: string, data: any) {
    const departmentCode = data.department || data.departmentCode
        ? normalizeDepartmentCode(data.departmentCode || data.department)
        : null;

    const { department, departmentCode: _departmentCode, ...rest } = data;
    const updateData: any = { ...rest };

    if (departmentCode) {
        updateData.department = {
            connect: { code: departmentCode },
        };
    }

    const ministry = await prisma.ministry.update({
        where: { id },
        data: updateData,
        include: {
            department: true,
        },
    });
    revalidatePath('/settings/ministries');
    return mapMinistryForClient(ministry);
}

export async function createMinistries(data: any[]) {
    let createdCount = 0;

    for (const row of data) {
        const departmentCode = normalizeDepartmentCode(row.departmentCode || row.department);
        const { department, departmentCode: _departmentCode, ...rest } = row;

        const existing = await prisma.ministry.findFirst({
            where: {
                OR: [
                    { id: rest.id },
                    { name: { equals: rest.name, mode: 'insensitive' } },
                ],
            },
            select: { id: true },
        });

        if (existing) continue;

        await prisma.ministry.create({
            data: {
                ...rest,
                department: {
                    connect: { code: departmentCode },
                },
            },
        });
        createdCount++;
    }

    revalidatePath('/settings/ministries');
    return { count: createdCount };
}

export async function deleteMinistry(id: string) {
    await prisma.ministry.delete({ where: { id } });
    revalidatePath('/settings/ministries');
}

// --- Bookings ---

export async function getBookings(filters: {
    workerProfileId?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    roomId?: string;
    status?: string;
} = {}) {
    const where: any = {};
    if (filters.workerProfileId) {
        where.workerProfileId = filters.workerProfileId;
    }
    if (filters.roomId) {
        where.roomId = filters.roomId;
    }
    if (filters.status) {
        where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
        where.start = {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        };
    }

    return await prisma.booking.findMany({
        where,
        include: {
            room: true,
            worker: true,
        },
        orderBy: {
            start: 'asc',
        },
    });
}

export async function getBookingsForRoomOnDate(roomId: string, date: Date | string) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    return prisma.booking.findMany({
        where: {
            roomId,
            start: { gte: startOfDay, lte: endOfDay },
        },
    });
}

export async function createBooking(data: any) {
    const { workerProfileId, roomId, ...rest } = data;
    if (!workerProfileId) throw new Error('workerProfileId is required to create a booking');
    if (!roomId) throw new Error('roomId is required to create a booking');

    if (rest.start) {
        const startDate = new Date(rest.start);
        if (startDate < new Date()) {
            throw new Error('Cannot reserve a room for a past date or time.');
        }
    }

    // Strip fields not in the Booking schema to avoid Prisma validation errors
    const {
        requesterEmail: _re, dateRequested: _dr,
        ...cleanRest
    } = rest;

    try {
        const booking = await prisma.booking.create({
            data: { ...cleanRest, workerProfileId, roomId },
        });
        revalidatePath('/reservations');
        revalidatePath('/dashboard');
        return booking;
    } catch (err: any) {
        console.error('[createBooking] Prisma error:', err);
        throw new Error(`Failed to create booking: ${err.message || 'Unknown error'}`);
    }
}

export async function updateBooking(id: string, data: any) {
    const booking = await prisma.booking.update({
        where: { id },
        data,
    });
    revalidatePath('/reservations');
    revalidatePath('/dashboard');
    return booking;
}

export async function deleteBooking(id: string) {
    await prisma.booking.delete({ where: { id } });
    revalidatePath('/reservations');
    revalidatePath('/dashboard');
}

// --- Meal Stubs ---

export async function getMealStubs(filters: { workerId?: string; dateFrom?: Date | string; dateTo?: Date | string } = {}) {
    const where: any = {};
    if (filters.workerId) where.workerId = filters.workerId;
    if (filters.dateFrom || filters.dateTo) {
        where.date = {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        };
    }

    return await prisma.mealStub.findMany({
        where,
        orderBy: {
            date: 'desc',
        },
    });
}

export async function createMealStub(data: {
    workerId: string;
    workerName: string;
    status: string;
    stubType?: string;
    assignedBy?: string;
    assignedByName?: string;
    date?: Date; // Optional: allow passing a custom date (e.g. for Sunday mode)
}) {
    return await prisma.mealStub.create({
        data: {
            ...data,
            date: data.date || new Date(),
        },
    });
}

export async function updateMealStub(id: string, data: any) {
    const stub = await prisma.mealStub.update({
        where: { id },
        data,
    });
    revalidatePath('/meals');
    return stub;
}

export async function deleteMealStub(id: string) {
    await prisma.mealStub.delete({ where: { id } });
    revalidatePath('/meals');
}

// --- Attendance ---

export async function getAttendanceRecords(filters: { workerProfileId?: string; dateFrom?: Date | string; dateTo?: Date | string } = {}) {
    const where: any = {};
    if (filters.workerProfileId) where.workerProfileId = filters.workerProfileId;
    if (filters.dateFrom || filters.dateTo) {
        where.time = {
            ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
            ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
        };
    }

    return await prisma.attendanceRecord.findMany({
        where,
        include: {
            worker: true,
        },
        orderBy: {
            time: 'desc',
        },
    });
}

export async function seedAttendanceData() {
    const workers = await prisma.worker.findMany();
    if (!workers.length) return { count: 0 };

    const today = new Date();
    const currentDay = today.getDay();
    const diffToMonday = (currentDay + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    let inserted = 0;
    for (const worker of workers) {
        // Mon in/out (On Time: 7:45 AM - 5:15 PM)
        const monIn = new Date(monday); monIn.setHours(7, 45, 0, 0);
        const monOut = new Date(monday); monOut.setHours(17, 15, 0, 0);

        // Tue in/out (Late: 8:45 AM - 5:00 PM)
        const tueIn = new Date(monday); tueIn.setDate(monday.getDate() + 1); tueIn.setHours(8, 45, 0, 0);
        const tueOut = new Date(monday); tueOut.setDate(monday.getDate() + 1); tueOut.setHours(17, 0, 0, 0);

        // Wed in/out (On Time: 7:55 AM - 5:30 PM)
        const wedIn = new Date(monday); wedIn.setDate(monday.getDate() + 2); wedIn.setHours(7, 55, 0, 0);
        const wedOut = new Date(monday); wedOut.setDate(monday.getDate() + 2); wedOut.setHours(17, 30, 0, 0);

        await prisma.attendanceRecord.createMany({
            data: [
                { workerProfileId: worker.id, type: 'Clock In', time: monIn },
                { workerProfileId: worker.id, type: 'Clock Out', time: monOut },
                { workerProfileId: worker.id, type: 'Clock In', time: tueIn },
                { workerProfileId: worker.id, type: 'Clock Out', time: tueOut },
                { workerProfileId: worker.id, type: 'Clock In', time: wedIn },
                { workerProfileId: worker.id, type: 'Clock Out', time: wedOut },
            ]
        });
        inserted += 6;
    }

    revalidatePath('/attendance');
    return { count: inserted };
}

export async function createAttendanceRecord(data: { workerProfileId: string; type: string }) {
    const record = await prisma.attendanceRecord.create({
        data: {
            ...data,
            time: new Date(),
        },
    });

    if (data.type === 'Clock In') {
        const worker = await prisma.worker.findUnique({ where: { id: data.workerProfileId } });
        if (worker) {
            const today = new Date();
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(today);
            endOfDay.setHours(23, 59, 59, 999);

            const existingStub = await prisma.mealStub.findFirst({
                where: {
                    workerId: worker.id,
                    date: { gte: startOfDay, lte: endOfDay }
                }
            });

            if (!existingStub) {
                await prisma.mealStub.create({
                    data: {
                        workerId: worker.id,
                        workerName: `${worker.firstName} ${worker.lastName}`,
                        status: 'Issued',
                        stubType: 'daily',
                        assignedBy: 'system',
                        assignedByName: 'Auto-Assigned (Clock In)',
                        date: new Date()
                    }
                });
            }
        }
    }

    revalidatePath('/attendance');
    revalidatePath('/meals');
    return record;
}

export async function getAttendanceSettings(): Promise<AttendanceShiftSettings> {
    try {
        const setting = await prisma.setting.findUnique({
            where: { id: 'attendance_shift_settings' },
        });
        if (setting?.data) {
            const data = typeof setting.data === 'string' ? JSON.parse(setting.data) : setting.data;
            return {
                ...DEFAULT_ATTENDANCE_SETTINGS,
                ...data,
            };
        }
    } catch (e) {
        console.error("Failed to load attendance settings from DB", e);
    }
    return DEFAULT_ATTENDANCE_SETTINGS;
}

export async function updateAttendanceSettings(data: Partial<AttendanceShiftSettings>) {
    const current = await getAttendanceSettings();
    const updated: AttendanceShiftSettings = {
        ...current,
        ...data,
    };
    await prisma.setting.upsert({
        where: { id: 'attendance_shift_settings' },
        update: { data: updated as any },
        create: { id: 'attendance_shift_settings', data: updated as any },
    });
    revalidatePath('/settings');
    revalidatePath('/settings/attendance');
    revalidatePath('/attendance/scanner');
    return updated;
}

export async function recordAutoAttendance(workerProfileId: string) {
    const worker = await prisma.worker.findUnique({ where: { id: workerProfileId } });
    if (!worker) {
        throw new Error("Worker not found");
    }

    // Load dynamic shift settings from database
    const settings = await getAttendanceSettings();

    // Parse shift start time (e.g. "09:00" -> 9 hours, 0 mins)
    const [startHStr, startMStr] = (settings.shiftStartTime || "09:00").split(':');
    const shiftStartHour = parseInt(startHStr, 10) || 9;
    const shiftStartMin = parseInt(startMStr, 10) || 0;
    const graceMinutes = typeof settings.gracePeriodMinutes === 'number' ? settings.gracePeriodMinutes : 15;

    // Parse shift end time (e.g. "17:00" -> 17 hours, 0 mins)
    const [endHStr, endMStr] = (settings.shiftEndTime || "17:00").split(':');
    const shiftEndHour = parseInt(endHStr, 10) || 17;
    const shiftEndMin = parseInt(endMStr, 10) || 0;
    const cooldownMins = typeof settings.cooldownMinutes === 'number' ? settings.cooldownMinutes : 5;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const todayRecords = await prisma.attendanceRecord.findMany({
        where: {
            workerProfileId: worker.id,
            time: { gte: startOfDay, lte: endOfDay }
        },
        orderBy: { time: 'desc' }
    });

    const latestRecord = todayRecords[0];
    const workerData = {
        id: worker.id,
        firstName: worker.firstName,
        lastName: worker.lastName,
        avatarUrl: worker.avatarUrl,
        roleId: worker.roleId,
        employmentType: worker.employmentType
    };

    const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();
    const startCutoffTotalMinutes = shiftStartHour * 60 + shiftStartMin + graceMinutes;
    const endCutoffTotalMinutes = shiftEndHour * 60 + shiftEndMin;

    // Case 1: No attendance record yet today -> CLOCK IN
    if (!latestRecord) {
        const isOnTime = currentTotalMinutes <= startCutoffTotalMinutes;
        const status = isOnTime ? 'On Time' : 'Late';
        const statusBadgeColor = isOnTime ? 'emerald' : 'amber';

        const record = await createAttendanceRecord({
            workerProfileId: worker.id,
            type: 'Clock In'
        });

        return {
            success: true,
            action: 'Clock In' as const,
            status,
            statusBadgeColor,
            record,
            time: now,
            message: `Timed In successfully (${status})`,
            worker: workerData
        };
    }

    // Check cooldown time from the latest record
    const diffMs = now.getTime() - new Date(latestRecord.time).getTime();
    const diffMinutes = diffMs / (1000 * 60);

    // Case 2: Latest record is Clock In
    if (latestRecord.type === 'Clock In') {
        // Dynamic cooldown check (default 5 minutes buffer)
        if (diffMinutes < cooldownMins) {
            const recordedTimeStr = new Date(latestRecord.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            return {
                success: false,
                action: 'Cooldown' as const,
                status: 'Cooldown',
                statusBadgeColor: 'amber',
                record: latestRecord,
                time: latestRecord.time,
                message: `Already Timed In at ${recordedTimeStr}.`,
                worker: workerData
            };
        }

        // Past cooldown -> CLOCK OUT
        const isCompleted = currentTotalMinutes >= endCutoffTotalMinutes;
        const status = isCompleted ? 'Shift Completed' : 'Undertime';
        const statusBadgeColor = isCompleted ? 'emerald' : 'amber';

        const record = await createAttendanceRecord({
            workerProfileId: worker.id,
            type: 'Clock Out'
        });

        return {
            success: true,
            action: 'Clock Out' as const,
            status,
            statusBadgeColor,
            record,
            time: now,
            message: `Timed Out successfully (${status})`,
            worker: workerData
        };
    }

    // Case 3: Latest record is Clock Out
    if (latestRecord.type === 'Clock Out') {
        // Cooldown check
        if (diffMinutes < cooldownMins) {
            const recordedTimeStr = new Date(latestRecord.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            return {
                success: false,
                action: 'Cooldown' as const,
                status: 'Cooldown',
                statusBadgeColor: 'amber',
                record: latestRecord,
                time: latestRecord.time,
                message: `Already Timed Out at ${recordedTimeStr}.`,
                worker: workerData
            };
        }

        // Past cooldown -> Re-entry or Overtime CLOCK IN
        const isOvertime = currentTotalMinutes >= endCutoffTotalMinutes;
        const status = isOvertime ? 'Overtime In' : 'Re-entry In';
        const statusBadgeColor = 'blue';

        const record = await createAttendanceRecord({
            workerProfileId: worker.id,
            type: 'Clock In'
        });

        return {
            success: true,
            action: 'Clock In' as const,
            status,
            statusBadgeColor,
            record,
            time: now,
            message: `Timed In for ${status}`,
            worker: workerData
        };
    }

    throw new Error('Unhandled attendance state');
}

// --- Rooms, Areas, Branches ---

export async function getRooms() {
    return await prisma.room.findMany({
        include: {
            area: {
                include: {
                    branch: true,
                },
            },
        },
        orderBy: {
            weight: 'asc',
        },
    });
}

export async function createRoom(data: any) {
    const room = await prisma.room.create({ data });
    revalidatePath('/settings/rooms');
    return room;
}

export async function updateRoom(id: string, data: any) {
    const room = await prisma.room.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return room;
}

export async function deleteRoom(id: string) {
    await prisma.room.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

export async function createRooms(data: any[]) {
    await prisma.room.createMany({ data });
    revalidatePath('/settings/rooms');
}

export async function getAreas() {
    return await prisma.area.findMany({
        include: {
            branch: true,
        },
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createArea(data: any) {
    const area = await prisma.area.create({ data });
    revalidatePath('/settings/rooms');
    return area;
}

export async function updateArea(id: string, data: any) {
    const area = await prisma.area.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return area;
}

export async function deleteArea(id: string) {
    await prisma.area.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

export async function createAreas(data: any[]) {
    await prisma.area.createMany({ data });
    revalidatePath('/settings/rooms');
}

export async function getBranches() {
    return await prisma.branch.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createBranch(data: any) {
    const branch = await prisma.branch.create({ data });
    revalidatePath('/settings/rooms');
    return branch;
}

export async function updateBranch(id: string, data: any) {
    const branch = await prisma.branch.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/rooms');
    return branch;
}

export async function deleteBranch(id: string) {
    await prisma.branch.delete({ where: { id } });
    revalidatePath('/settings/rooms');
}

// --- Scan Logs ---

export async function getScanLogs(limit: number = 100) {
    return await prisma.scanLog.findMany({
        take: limit,
        orderBy: {
            timestamp: 'desc',
        },
    });
}

export async function createScanLog(data: any) {
    return await prisma.scanLog.create({
        data: {
            ...data,
            timestamp: new Date(),
        },
    });
}

// --- C2S ---

export async function getC2SGroups() {
    return await prisma.c2SGroup.findMany({
        include: {
            mentees: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function getC2SMentees() {
    return await prisma.c2SMentee.findMany({
        include: {
            group: true,
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function createC2SGroup(data: {
    name: string;
    mentorId: string;
    menteeIds?: string[];
}) {
    const group = await prisma.c2SGroup.create({
        data: {
            name: data.name,
            mentorId: data.mentorId,
            menteeIds: data.menteeIds ?? [],
        },
    });
    revalidatePath('/c2s');
    return group;
}

export async function updateC2SGroup(id: string, data: { name?: string; mentorId?: string; menteeIds?: string[] }) {
    const group = await prisma.c2SGroup.update({
        where: { id },
        data,
    });
    revalidatePath('/c2s');
    return group;
}

export async function deleteC2SGroup(id: string) {
    await prisma.c2SGroup.delete({ where: { id } });
    revalidatePath('/c2s');
}

export async function createC2SMentee(data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    status: string;
    groupId?: string;
    mentorId: string;
}) {
    let finalGroupId = data.groupId;
    if (!finalGroupId) {
        let group = await prisma.c2SGroup.findFirst({
            where: { mentorId: data.mentorId },
        });
        if (!group) {
            group = await prisma.c2SGroup.create({
                data: {
                    name: "Default Group",
                    mentorId: data.mentorId,
                    menteeIds: [],
                },
            });
        }
        finalGroupId = group.id;
    }

    const mentee = await prisma.c2SMentee.create({
        data: {
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
            phone: data.phone,
            status: data.status,
            groupId: finalGroupId,
            mentorId: data.mentorId,
        },
    });
    revalidatePath('/c2s');
    return mentee;
}

export async function updateC2SMentee(id: string, data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    status?: string;
    groupId?: string;
    mentorId?: string;
}) {
    const mentee = await prisma.c2SMentee.update({
        where: { id },
        data,
    });
    revalidatePath('/c2s');
    return mentee;
}

export async function deleteC2SMentee(id: string) {
    await prisma.c2SMentee.delete({ where: { id } });
    revalidatePath('/c2s');
}

export async function getC2SDevotionRecords(params?: {
    mentorId?: string;
    groupId?: string;
    clusterName?: string;
}) {
    try {
        const where: any = {};
        if (params?.mentorId) {
            where.mentorId = params.mentorId;
        }
        if (params?.groupId) {
            where.groupId = params.groupId;
        }
        if (params?.clusterName && params.clusterName !== 'all') {
            where.clusterName = params.clusterName;
        }

        const records = await prisma.c2SDevotionRecord.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });
        return records || [];
    } catch (e: any) {
        console.error("Error fetching devotion records:", e);
        return [];
    }
}

export async function createC2SDevotionRecord(data: {
    manualType?: string;
    moduleName?: string;
    lessonName?: string;
    topic: string;
    scripture?: string;
    devotionDate?: Date | string;
    groupId?: string;
    clusterName: string;
    mentorId: string;
    mentorName?: string;
    mentorRole?: string;
    attendeeNames?: string[];
    attendeeCount?: number;
    reflectionNotes: string;
    prayerRequests?: string;
    photoUrl?: string;
    photoUrls?: string[];
    status?: string;
}) {
    let validGroupId: string | null = null;
    if (data.groupId) {
        try {
            const groupExists = await prisma.c2SGroup.findUnique({
                where: { id: data.groupId },
            });
            if (groupExists) {
                validGroupId = data.groupId;
            }
        } catch (e) {
            validGroupId = null;
        }
    }

    // Upload photos to Supabase Storage if they are base64 strings
    let uploadedPhotoUrls: string[] = [];
    if (data.photoUrls && data.photoUrls.length > 0) {
        const { uploadBase64ToSupabase } = await import('@/lib/upload-to-supabase');
        for (const photoUrl of data.photoUrls) {
            if (photoUrl.startsWith('data:image')) {
                // This is a base64 string, upload to Supabase
                try {
                    const publicUrl = await uploadBase64ToSupabase(photoUrl, 'Devotion-Photos', 'c2s');
                    uploadedPhotoUrls.push(publicUrl);
                } catch (error) {
                    console.error('Error uploading photo to Supabase:', error);
                    // Fallback to base64 if upload fails
                    uploadedPhotoUrls.push(photoUrl);
                }
            } else {
                // Already a URL, keep it
                uploadedPhotoUrls.push(photoUrl);
            }
        }
    } else if (data.photoUrl && data.photoUrl.startsWith('data:image')) {
        // Upload single photo
        const { uploadBase64ToSupabase } = await import('@/lib/upload-to-supabase');
        try {
            const publicUrl = await uploadBase64ToSupabase(data.photoUrl, 'Devotion-Photos', 'c2s');
            uploadedPhotoUrls.push(publicUrl);
        } catch (error) {
            console.error('Error uploading photo to Supabase:', error);
            uploadedPhotoUrls.push(data.photoUrl);
        }
    }

    const finalPhotoUrl = uploadedPhotoUrls[0] || data.photoUrl || null;
    const finalPhotoUrls = uploadedPhotoUrls.length > 0 ? uploadedPhotoUrls : (data.photoUrls || (data.photoUrl ? [data.photoUrl] : []));

    const payload = {
        manualType: data.manualType || 'C2S Devotional Manual',
        moduleName: data.moduleName || null,
        lessonName: data.lessonName || null,
        topic: data.topic,
        scripture: data.scripture || null,
        devotionDate: data.devotionDate ? new Date(data.devotionDate) : new Date(),
        groupId: validGroupId,
        clusterName: data.clusterName || 'Cluster 1',
        mentorId: data.mentorId || 'mentor-default',
        mentorName: data.mentorName || null,
        mentorRole: data.mentorRole || 'Mentor',
        attendeeNames: data.attendeeNames || [],
        attendeeCount: data.attendeeCount ?? (data.attendeeNames ? data.attendeeNames.length : 0),
        reflectionNotes: data.reflectionNotes,
        prayerRequests: data.prayerRequests || null,
        photoUrl: finalPhotoUrl,
        photoUrls: finalPhotoUrls,
        status: data.status || 'Submitted',
    };

    try {
        const record = await prisma.c2SDevotionRecord.create({
            data: payload,
        });
        revalidatePath('/c2s');
        return record;
    } catch (err: any) {
        console.error("Error creating C2SDevotionRecord in DB:", err);
        console.error("Payload:", JSON.stringify(payload, null, 2));
        // Throw the error instead of returning a mock object
        throw new Error(`Failed to create devotion record: ${err.message}`);
    }
}

export async function updateC2SDevotionRecord(id: string, data: {
    manualType?: string;
    moduleName?: string;
    lessonName?: string;
    topic?: string;
    scripture?: string;
    devotionDate?: Date | string;
    groupId?: string;
    clusterName?: string;
    mentorId?: string;
    mentorName?: string;
    mentorRole?: string;
    attendeeNames?: string[];
    attendeeCount?: number;
    reflectionNotes?: string;
    prayerRequests?: string;
    photoUrl?: string | null;
    photoUrls?: string[];
    status?: string;
}) {
    // Upload photos to Supabase Storage if they are base64 strings
    let uploadedPhotoUrls: string[] = [];
    if (data.photoUrls && data.photoUrls.length > 0) {
        const { uploadBase64ToSupabase } = await import('@/lib/upload-to-supabase');
        for (const photoUrl of data.photoUrls) {
            if (photoUrl.startsWith('data:image')) {
                // This is a base64 string, upload to Supabase
                try {
                    const publicUrl = await uploadBase64ToSupabase(photoUrl, 'Devotion-Photos', 'c2s');
                    uploadedPhotoUrls.push(publicUrl);
                } catch (error) {
                    console.error('Error uploading photo to Supabase:', error);
                    // Fallback to base64 if upload fails
                    uploadedPhotoUrls.push(photoUrl);
                }
            } else {
                // Already a URL, keep it
                uploadedPhotoUrls.push(photoUrl);
            }
        }
    } else if (data.photoUrl && data.photoUrl.startsWith('data:image')) {
        // Upload single photo
        const { uploadBase64ToSupabase } = await import('@/lib/upload-to-supabase');
        try {
            const publicUrl = await uploadBase64ToSupabase(data.photoUrl, 'Devotion-Photos', 'c2s');
            uploadedPhotoUrls.push(publicUrl);
        } catch (error) {
            console.error('Error uploading photo to Supabase:', error);
            uploadedPhotoUrls.push(data.photoUrl);
        }
    }

    const updateData: any = {};
    if (data.manualType !== undefined) updateData.manualType = data.manualType;
    if (data.moduleName !== undefined) updateData.moduleName = data.moduleName;
    if (data.lessonName !== undefined) updateData.lessonName = data.lessonName;
    if (data.topic !== undefined) updateData.topic = data.topic;
    if (data.scripture !== undefined) updateData.scripture = data.scripture;
    if (data.devotionDate !== undefined) updateData.devotionDate = new Date(data.devotionDate);
    if (data.groupId !== undefined) updateData.groupId = data.groupId;
    if (data.clusterName !== undefined) updateData.clusterName = data.clusterName;
    if (data.mentorId !== undefined) updateData.mentorId = data.mentorId;
    if (data.mentorName !== undefined) updateData.mentorName = data.mentorName;
    if (data.mentorRole !== undefined) updateData.mentorRole = data.mentorRole;
    if (data.attendeeNames !== undefined) {
        updateData.attendeeNames = data.attendeeNames;
        updateData.attendeeCount = data.attendeeCount ?? data.attendeeNames.length;
    }
    if (data.reflectionNotes !== undefined) updateData.reflectionNotes = data.reflectionNotes;
    if (data.prayerRequests !== undefined) updateData.prayerRequests = data.prayerRequests;
    
    // Use uploaded URLs if available
    if (uploadedPhotoUrls.length > 0) {
        updateData.photoUrls = uploadedPhotoUrls;
        updateData.photoUrl = uploadedPhotoUrls[0];
    } else if (data.photoUrls !== undefined) {
        updateData.photoUrls = data.photoUrls;
        updateData.photoUrl = data.photoUrl || (data.photoUrls.length > 0 ? data.photoUrls[0] : null);
    } else if (data.photoUrl !== undefined) {
        updateData.photoUrl = data.photoUrl;
        updateData.photoUrls = data.photoUrl ? [data.photoUrl] : [];
    }
    
    if (data.status !== undefined) updateData.status = data.status;

    const record = await prisma.c2SDevotionRecord.update({
        where: { id },
        data: updateData,
        include: {
            group: true,
        },
    });
    revalidatePath('/c2s');
    return record;
}

export async function deleteC2SDevotionRecord(id: string) {
    await prisma.c2SDevotionRecord.delete({ where: { id } });
    revalidatePath('/c2s');
}


// --- Venue Elements ---

export async function getVenueElements() {
    return await prisma.venueElement.findMany({
        orderBy: {
            name: 'asc',
        },
    });
}

export async function createVenueElement(data: any) {
    const element = await prisma.venueElement.create({ data });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
    return element;
}

export async function updateVenueElement(id: string, data: any) {
    const element = await prisma.venueElement.update({
        where: { id },
        data,
    });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
    return element;
}

export async function deleteVenueElement(id: string) {
    await prisma.venueElement.delete({ where: { id } });
    revalidatePath('/settings/venue-elements');
    revalidatePath('/settings/rooms');
}

// --- Batch Ministry Update ---

export async function updateWorkersMinistries(
    ids: string[],
    majorMinistryId?: string,
    minorMinistryId?: string,
) {
    const data: any = {};
    if (majorMinistryId !== undefined) data.majorMinistryId = majorMinistryId;
    if (minorMinistryId !== undefined) data.minorMinistryId = minorMinistryId;

    await prisma.worker.updateMany({
        where: { id: { in: ids } },
        data,
    });
    revalidatePath('/workers');
}

// --- Settings ---

export async function getSetting(id: string) {
    const setting = await prisma.setting.findUnique({
        where: { id },
    });
    return (setting?.data as any) || null;
}

export async function updateSetting(id: string, data: any) {
    const setting = await prisma.setting.upsert({
        where: { id },
        update: { data },
        create: { id, data },
    });
    revalidatePath('/settings');
    return setting.data;
}

// --- Department Settings ---

export async function getDepartmentSettings() {
    return await prisma.departmentSetting.findMany({
        orderBy: {
            id: 'asc',
        },
    });
}

export async function getDepartmentSetting(id: string) {
    return await prisma.departmentSetting.findUnique({
        where: { id },
    });
}

export async function createDepartmentSetting(data: any) {
    return await prisma.departmentSetting.create({
        data,
    });
}

export async function updateDepartmentSetting(id: string, data: any) {
    return await prisma.departmentSetting.update({
        where: { id },
        data,
    });
}

export async function upsertDepartmentSetting(id: string, data: any) {
    return await prisma.departmentSetting.upsert({
        where: { id },
        update: data,
        create: { id, ...data },
    });
}

export async function deleteDepartmentSetting(id: string) {
    return await prisma.departmentSetting.delete({
        where: { id },
    });
}

// --- Transaction Logs ---

export async function createTransactionLog(data: any) {
    return await prisma.transactionLog.create({
        data,
    });
}

export async function getTransactionLogs() {
    return await prisma.transactionLog.findMany({
        orderBy: { timestamp: 'desc' },
        take: 200,
    });
}

export async function getWorkerLogs(workerId: string) {
    return await prisma.transactionLog.findMany({
        where: {
            OR: [
                { targetId: workerId },
                { userId: workerId }
            ]
        },
        orderBy: {
            timestamp: 'desc',
        },
        take: 50,
    });
}

export async function adminForcePasswordReset(workerId: string) {
    const supabaseAdmin = getSupabaseAdminClient();
    
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker) throw new Error("Worker not found");

    const defaultPassword = "StudioUser2026!";
    const { error } = await supabaseAdmin.auth.admin.updateUserById(
      workerId,
      { password: defaultPassword }
    );

    if (error) {
       throw new Error(`Failed to forcibly reset password: ${error.message}`);
    }

    // Force sign out the user from all sessions so they have to login again
    await supabaseAdmin.auth.admin.signOut(workerId);

    return defaultPassword;
}

export async function adminSendPasswordResetEmail(workerId: string, appUrl: string) {
    const supabaseAdmin = getSupabaseAdminClient();
    
    // Get worker to find their email
    const worker = await prisma.worker.findUnique({ where: { id: workerId } });
    if (!worker || !worker.email) {
        throw new Error("Worker does not have an email address set");
    }

    // Generate the recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: worker.email,
        options: {
            redirectTo: `${appUrl}/auth/update-password`
        }
    });

    if (linkError) {
        throw new Error(`Failed to generate reset link: ${linkError.message}`);
    }
    
    // Send email using Resend
    const link = linkData.properties.action_link;
    await EmailService.sendEmail({
        to: worker.email,
        subject: 'Password Reset Request',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="font-size: 24px; margin-bottom: 24px;">Reset your password</h2>
                <p>Hello ${worker.firstName},</p>
                <p>We received a request to reset your password. You can reset it by clicking the button below:</p>
                <div style="margin: 32px 0;">
                    <a href="${link}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't request a password reset, you can safely ignore this email.</p>
            </div>
        `,
        text: `You have requested to reset your password. Reset it here: ${link}`
    });
    
    return true;
}

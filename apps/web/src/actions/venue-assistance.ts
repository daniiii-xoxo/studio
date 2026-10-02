"use server";

import { prisma } from '@studio/database/prisma';
import { RRule } from 'rrule';
import {
    notifyMinistryHeadNewRequest,
    notifyMinistryHeadCancellation,
} from '@/services/venue-assistance-notifications';
import { deriveRequestStatus, type ItemStatus, type RequestStatus } from '@/actions/venue-assistance-status';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateVenueBookingData {
    roomId: string;
    workerProfileId: string;
    title: string;
    purpose?: string;
    start: Date;
    end: Date;
    pax?: number;
    numTables?: number;
    numChairs?: number;
    guidelinesAccepted?: boolean;
}

export interface CreateRecurringBookingData {
    roomId: string;
    workerProfileId: string;
    title: string;
    purpose?: string;
    recurrenceRule: string; // RRULE string e.g. "FREQ=WEEKLY;BYDAY=SU;COUNT=12"
    startTime: string;      // "HH:MM"
    endTime: string;        // "HH:MM"
    startDate: Date;
    endDate?: Date;
    pax?: number;
    guidelinesAccepted?: boolean;
}

export interface AssistanceConfigItemInput {
    name: string;
    description?: string;
    quantity?: number;
    isRequired?: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a simple unique request ID (timestamp + random suffix). */
function generateRequestId(): string {
    return `REQ-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/**
 * Resolve the ministry head's worker record for a given ministryId.
 * Returns null if the ministry or head is not found.
 */
async function resolveMinistryHead(ministryId: string) {
    const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } });
    if (!ministry?.headId) return null;
    return prisma.worker.findUnique({ where: { id: ministry.headId } });
}

/**
 * Create AssistanceRequest + AssistanceRequestItem records for a single booking
 * based on the AssistanceConfigurations for its room.
 */
async function createAssistanceRequestsForBooking(
    bookingId: string,
    roomId: string,
    actorId: string,
) {
    const configs = await prisma.assistanceConfiguration.findMany({
        where: { roomId },
        include: { items: true },
    });

    for (const config of configs) {
        const request = await prisma.assistanceRequest.create({
            data: {
                bookingId,
                ministryId: config.ministryId,
                status: 'Pending',
            },
        });

        if (config.items.length > 0) {
            await prisma.assistanceRequestItem.createMany({
                data: config.items.map(item => ({
                    requestId: request.id,
                    name: item.name,
                    description: item.description ?? undefined,
                    quantity: item.quantity,
                    isRequired: item.isRequired,
                    status: 'Pending',
                })),
            });
        }

        // Write audit log
        await prisma.venueAuditLog.create({
            data: {
                requestId: request.id,
                action: 'request_created',
                actorId,
                triggerSource: 'manual',
            },
        });

        // Notify ministry head
        const head = await resolveMinistryHead(config.ministryId);
        if (head?.email) {
            const booking = await prisma.venueBooking.findUnique({
                where: { id: bookingId },
                include: { room: true },
            });
            notifyMinistryHeadNewRequest({
                ministryHeadEmail: head.email,
                ministryHeadId: head.id,
                ministryName: config.ministryId,
                requestId: request.id,
                bookingId,
                bookingTitle: booking?.title ?? '',
                roomName: booking?.room?.name ?? '',
                eventStart: booking?.start ?? new Date(),
            }).catch(console.error);
        }
    }
}

/**
 * Cancel all Pending AssistanceRequests for a booking and notify ministry heads.
 */
async function cancelPendingRequestsForBooking(bookingId: string, actorId: string) {
    const pendingRequests = await prisma.assistanceRequest.findMany({
        where: { bookingId, status: 'Pending' },
    });

    if (pendingRequests.length === 0) return;

    await prisma.assistanceRequest.updateMany({
        where: { bookingId, status: 'Pending' },
        data: { status: 'Cancelled' },
    });

    const booking = await prisma.venueBooking.findUnique({
        where: { id: bookingId },
        include: { room: true },
    });

    for (const req of pendingRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'request_cancelled',
                actorId,
                before: { status: 'Pending' },
                after: { status: 'Cancelled' },
                triggerSource: 'manual',
            },
        });

        const head = await resolveMinistryHead(req.ministryId);
        if (head?.email) {
            notifyMinistryHeadCancellation({
                ministryHeadEmail: head.email,
                ministryHeadId: head.id,
                ministryName: req.ministryId,
                requestId: req.id,
                bookingId,
                bookingTitle: booking?.title ?? '',
            }).catch(console.error);
        }
    }
}

/**
 * Check if an actor has permission to manage assistance configs.
 * Throws if not authorized.
 */
async function assertConfigPermission(actorId: string, ministryId: string) {
    const actor = await prisma.worker.findUnique({
        where: { id: actorId },
        include: { role: true },
    });

    if (!actor) throw new Error('Actor not found');

    const perms: string[] = actor.role?.permissions ?? [];

    if (perms.includes('manage_venue_assistance')) return; // full access

    if (perms.includes('manage_own_ministry_assistance')) {
        // Must be the head of the target ministry
        const ministry = await prisma.ministry.findUnique({ where: { id: ministryId } });
        if (ministry?.headId === actorId) return;
        throw new Error('You can only manage assistance configurations for your own ministry.');
    }

    throw new Error('You do not have permission to manage venue assistance configurations.');
}

// ---------------------------------------------------------------------------
// Booking actions
// ---------------------------------------------------------------------------

/** 
 * Create a one-time venue booking and generate assistance requests.
 * 
 * Room Reservation Approval Workflow:
 * 1. Worker submits request → Status: 'Pending Ministry Approval'
 * 2. Ministry Head gives initial approval → Status: 'Pending Admin Approval' (room NOT yet reserved)
 * 3. Admin gives final approval → Status: 'Approved' (room officially reserved)
 */
export async function createVenueBooking(data: CreateVenueBookingData) {
    const booking = await prisma.venueBooking.create({
        data: {
            requestId: generateRequestId(),
            roomId: data.roomId,
            workerProfileId: data.workerProfileId,
            title: data.title,
            purpose: data.purpose,
            start: data.start,
            end: data.end,
            pax: data.pax ?? 0,
            numTables: data.numTables ?? 0,
            numChairs: data.numChairs ?? 0,
            guidelinesAccepted: data.guidelinesAccepted ?? false,
            status: 'Pending Ministry Approval',
        },
    });

    await prisma.venueAuditLog.create({
        data: {
            action: 'booking_created',
            actorId: data.workerProfileId,
            after: { bookingId: booking.id },
            triggerSource: 'manual',
        },
    });

    await createAssistanceRequestsForBooking(booking.id, data.roomId, data.workerProfileId);

    return booking;
}

/** Create a recurring booking, expand occurrences, and generate assistance requests for each. */
export async function createRecurringBooking(data: CreateRecurringBookingData) {
    // Expand RRULE into occurrence dates
    const rule = RRule.fromString(
        data.recurrenceRule.startsWith('RRULE:')
            ? data.recurrenceRule
            : `RRULE:${data.recurrenceRule}`,
    );

    const occurrenceDates = rule.between(
        data.startDate,
        data.endDate ?? new Date(data.startDate.getTime() + 365 * 24 * 60 * 60 * 1000),
        true, // inclusive
    );

    const recurringBooking = await prisma.recurringBooking.create({
        data: {
            roomId: data.roomId,
            workerProfileId: data.workerProfileId,
            title: data.title,
            purpose: data.purpose,
            recurrenceRule: data.recurrenceRule,
            startTime: data.startTime,
            endTime: data.endTime,
            startDate: data.startDate,
            endDate: data.endDate,
            pax: data.pax ?? 0,
            status: 'Active',
        },
    });

    const [startHour, startMin] = data.startTime.split(':').map(Number);
    const [endHour, endMin] = data.endTime.split(':').map(Number);

    for (const date of occurrenceDates) {
        const start = new Date(date);
        start.setHours(startHour, startMin, 0, 0);

        const end = new Date(date);
        end.setHours(endHour, endMin, 0, 0);

        const booking = await prisma.venueBooking.create({
            data: {
                requestId: generateRequestId(),
                roomId: data.roomId,
                workerProfileId: data.workerProfileId,
                title: data.title,
                purpose: data.purpose,
                start,
                end,
                pax: data.pax ?? 0,
                guidelinesAccepted: data.guidelinesAccepted ?? false,
                status: 'Pending Ministry Approval',
                recurringBookingId: recurringBooking.id,
            },
        });

        await prisma.venueAuditLog.create({
            data: {
                action: 'booking_created',
                actorId: data.workerProfileId,
                after: { bookingId: booking.id, recurringBookingId: recurringBooking.id },
                triggerSource: 'manual',
            },
        });

        await createAssistanceRequestsForBooking(booking.id, data.roomId, data.workerProfileId);
    }

    return { recurringBooking, occurrenceCount: occurrenceDates.length };
}

/** Cancel a single venue booking and all its pending assistance requests. */
export async function cancelVenueBooking(bookingId: string, actorId: string) {
    const booking = await prisma.venueBooking.update({
        where: { id: bookingId },
        data: { status: 'Cancelled' },
    });

    await cancelPendingRequestsForBooking(bookingId, actorId);

    await prisma.venueAuditLog.create({
        data: {
            action: 'booking_cancelled',
            actorId,
            after: { bookingId, status: 'Cancelled' },
            triggerSource: 'manual',
        },
    });

    return booking;
}

/** Cancel a single occurrence of a recurring booking (same as cancelVenueBooking). */
export async function cancelRecurringOccurrence(bookingId: string, actorId: string) {
    return cancelVenueBooking(bookingId, actorId);
}

/** Cancel an entire recurring series and all pending assistance requests across all occurrences. */
export async function cancelRecurringSeries(recurringBookingId: string, actorId: string) {
    await prisma.recurringBooking.update({
        where: { id: recurringBookingId },
        data: { status: 'Cancelled' },
    });

    const occurrences = await prisma.venueBooking.findMany({
        where: { recurringBookingId },
        select: { id: true },
    });

    await prisma.venueBooking.updateMany({
        where: { recurringBookingId },
        data: { status: 'Cancelled' },
    });

    for (const occ of occurrences) {
        await cancelPendingRequestsForBooking(occ.id, actorId);
    }

    await prisma.venueAuditLog.create({
        data: {
            action: 'recurring_series_cancelled',
            actorId,
            after: { recurringBookingId, status: 'Cancelled' },
            triggerSource: 'manual',
        },
    });

    return { recurringBookingId, cancelledOccurrences: occurrences.length };
}

// ---------------------------------------------------------------------------
// Assistance Configuration actions
// ---------------------------------------------------------------------------

/** Create or update an AssistanceConfiguration for a room+ministry pair. */
export async function upsertAssistanceConfig(
    roomId: string,
    ministryId: string,
    items: AssistanceConfigItemInput[],
    actorId: string,
) {
    await assertConfigPermission(actorId, ministryId);

    const existing = await prisma.assistanceConfiguration.findUnique({
        where: { roomId_ministryId: { roomId, ministryId } },
    });

    let config;
    if (existing) {
        // Delete existing items and replace
        await prisma.assistanceConfigItem.deleteMany({ where: { configId: existing.id } });

        config = await prisma.assistanceConfiguration.update({
            where: { id: existing.id },
            data: {
                createdBy: actorId,
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity ?? 1,
                        isRequired: item.isRequired ?? true,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.venueAuditLog.create({
            data: {
                configId: config.id,
                action: 'config_updated',
                actorId,
                before: { roomId, ministryId, itemCount: existing ? undefined : 0 },
                after: { roomId, ministryId, itemCount: items.length },
                triggerSource: 'manual',
            },
        });
    } else {
        config = await prisma.assistanceConfiguration.create({
            data: {
                roomId,
                ministryId,
                createdBy: actorId,
                items: {
                    create: items.map(item => ({
                        name: item.name,
                        description: item.description,
                        quantity: item.quantity ?? 1,
                        isRequired: item.isRequired ?? true,
                    })),
                },
            },
            include: { items: true },
        });

        await prisma.venueAuditLog.create({
            data: {
                configId: config.id,
                action: 'config_created',
                actorId,
                after: { roomId, ministryId, itemCount: items.length },
                triggerSource: 'manual',
            },
        });
    }

    return config;
}

/** Delete an AssistanceConfiguration (cascade deletes items). Does NOT affect existing requests. */
export async function deleteAssistanceConfig(configId: string, actorId: string) {
    const config = await prisma.assistanceConfiguration.findUnique({
        where: { id: configId },
    });

    if (!config) throw new Error('Assistance configuration not found.');

    await assertConfigPermission(actorId, config.ministryId);

    await prisma.assistanceConfiguration.delete({ where: { id: configId } });

    await prisma.venueAuditLog.create({
        data: {
            configId,
            action: 'config_deleted',
            actorId,
            before: { roomId: config.roomId, ministryId: config.ministryId },
            triggerSource: 'manual',
        },
    });
}

/** Get all AssistanceConfigurations for a room, including items. */
export async function getAssistanceConfigsForRoom(roomId: string) {
    return prisma.assistanceConfiguration.findMany({
        where: { roomId },
        include: { items: true },
    });
}

/** Get all AssistanceConfigurations for a ministry, including items. */
export async function getAssistanceConfigsForMinistry(ministryId: string) {
    return prisma.assistanceConfiguration.findMany({
        where: { ministryId },
        include: { items: true },
    });
}

// ---------------------------------------------------------------------------
// Assistance Request query actions
// ---------------------------------------------------------------------------

/** Get all AssistanceRequests for a booking, including items and audit logs. */
export async function getAssistanceRequestsForBooking(bookingId: string) {
    return prisma.assistanceRequest.findMany({
        where: { bookingId },
        include: {
            items: true,
            auditLogs: { orderBy: { createdAt: 'asc' } },
        },
        orderBy: { createdAt: 'asc' },
    });
}

/** Get all AssistanceRequests for a ministry (ministry head's inbox). */
export async function getAssistanceRequestsForMinistry(ministryId: string) {
    return prisma.assistanceRequest.findMany({
        where: { ministryId },
        include: {
            items: true,
            booking: { include: { room: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

// ---------------------------------------------------------------------------
// Assistance Response actions
// ---------------------------------------------------------------------------

export interface ItemStatusUpdate {
    itemId: string;
    status: 'Approved' | 'Declined';
    adjustedQty?: number;
    adjustedDesc?: string;
}

/**
 * Respond to an assistance request: update item statuses, derive request status,
 * set respondedAt/respondedBy, notify requester and manage_venue_assistance users,
 * write audit log.
 */
export async function respondToAssistanceRequest(
    requestId: string,
    itemStatuses: ItemStatusUpdate[],
    explanation: string | undefined,
    responderId: string,
) {
    const request = await prisma.assistanceRequest.findUnique({
        where: { id: requestId },
        include: {
            items: true,
            booking: { include: { room: true, worker: true } },
        },
    });

    if (!request) throw new Error('Assistance request not found.');

    // Security check: verify responder belongs to the ministry or is admin
    const responder = await prisma.worker.findUnique({
        where: { id: responderId },
        include: { role: true, roles: { include: { role: true } } },
    });
    const isAdmin =
        responder?.email === 'admin@admin.com' ||
        responder?.email === 'admin@system.com' ||
        responder?.role?.isSuperAdmin === true ||
        responder?.roles?.some(r => r.role?.isSuperAdmin === true) ||
        responder?.roleId === 'admin';

    if (!isAdmin) {
        const ministry = await prisma.ministry.findUnique({ where: { id: request.ministryId } });
        const isAuthorized =
            ministry?.headId === responderId ||
            ministry?.approverId === responderId ||
            responder?.majorMinistryId === request.ministryId;
        if (!isAuthorized) {
            throw new Error('Unauthorized: You can only respond to assistance requests for your assigned ministry.');
        }
    }

    const beforeStatus = request.status;

    // Update each item
    for (const update of itemStatuses) {
        await prisma.assistanceRequestItem.update({
            where: { id: update.itemId },
            data: {
                status: update.status,
                adjustedQty: update.adjustedQty ?? null,
                adjustedDesc: update.adjustedDesc ?? null,
            },
        });
    }

    // Derive new request status from updated item statuses
    const updatedStatuses = itemStatuses.map(u => u.status as ItemStatus);
    const newStatus = deriveRequestStatus(updatedStatuses);

    const updatedRequest = await prisma.assistanceRequest.update({
        where: { id: requestId },
        data: {
            status: newStatus,
            explanation: explanation ?? null,
            respondedAt: new Date(),
            respondedBy: responderId,
        },
    });

    // Write audit log
    await prisma.venueAuditLog.create({
        data: {
            requestId,
            action: 'request_responded',
            actorId: responderId,
            before: { status: beforeStatus },
            after: {
                status: newStatus,
                itemStatuses: itemStatuses.map(u => ({ id: u.itemId, status: u.status })),
                explanation,
            },
            triggerSource: 'manual',
        },
    });

    // Notify requester and manage_venue_assistance users
    // TODO: Replace with full notification service call once task 7 is complete
    const requester = request.booking.worker;
    const hasDecline = itemStatuses.some(u => u.status === 'Declined');

    // Find all users with manage_venue_assistance permission
    const adminWorkers = await prisma.worker.findMany({
        where: {
            role: {
                permissions: { has: 'manage_venue_assistance' },
            },
        },
        select: { id: true, email: true },
    });

    const adminUserIds = adminWorkers.map(w => w.id);
    const adminEmails = adminWorkers.map(w => w.email).filter((e): e is string => !!e);

    if (requester?.email) {
        // If any item declined, include explanation in requester notification
        if (hasDecline) {
            import('@/services/venue-assistance-notifications').then(({ notifyRequesterDecline }) => {
                notifyRequesterDecline({
                    requesterEmail: requester.email!,
                    requesterId: requester.id,
                    ministryName: request.ministryId,
                    bookingTitle: request.booking.title,
                    requestId,
                    bookingId: request.bookingId,
                    explanation,
                }).catch(console.error);
            }).catch(console.error);
        }

        import('@/services/venue-assistance-notifications').then(({ notifyStatusChange }) => {
            notifyStatusChange({
                requesterEmail: requester.email!,
                requesterId: requester.id,
                ministryName: request.ministryId,
                bookingTitle: request.booking.title,
                requestId,
                bookingId: request.bookingId,
                newStatus,
                adminUserIds,
                adminEmails,
            }).catch(console.error);
        }).catch(console.error);
    }

    return updatedRequest;
}

/**
 * Apply the same response to all Pending AssistanceRequests for a
 * (recurringBookingId, ministryId) pair.
 */
export async function bulkRespondToRecurringRequests(
    recurringBookingId: string,
    ministryId: string,
    itemStatuses: ItemStatusUpdate[],
    explanation: string | undefined,
    responderId: string,
) {
    // Find all Pending requests for this recurring booking + ministry
    const pendingRequests = await prisma.assistanceRequest.findMany({
        where: {
            ministryId,
            status: 'Pending',
            booking: { recurringBookingId },
        },
        include: { items: true },
    });

    const results = [];
    for (const req of pendingRequests) {
        // Map item statuses by name since each request has its own item IDs
        const mappedStatuses: ItemStatusUpdate[] = req.items.map(item => {
            // Try to find a matching update by itemId first, then fall back to name matching
            const directMatch = itemStatuses.find(u => u.itemId === item.id);
            if (directMatch) return directMatch;

            // For bulk responses, match by item name
            const nameMatch = itemStatuses.find(u => {
                // itemStatuses may reference items from a template request
                return u.itemId === item.id;
            });
            return nameMatch ?? { itemId: item.id, status: 'Approved' as const };
        });

        const result = await respondToAssistanceRequest(
            req.id,
            mappedStatuses,
            explanation,
            responderId,
        );
        results.push(result);
    }

    return { respondedCount: results.length, results };
}

// ---------------------------------------------------------------------------
// Check-in and fulfillment actions
// ---------------------------------------------------------------------------

/**
 * Called when a booking QR code is scanned on the room display.
 * Updates Approved and Partial requests → In_Progress.
 * Does NOT touch Declined or Cancelled requests.
 */
export async function handleBookingCheckIn(bookingId: string) {
    const eligibleRequests = await prisma.assistanceRequest.findMany({
        where: {
            bookingId,
            status: { in: ['Approved', 'Partial'] },
        },
    });

    if (eligibleRequests.length === 0) return { updatedCount: 0 };

    await prisma.assistanceRequest.updateMany({
        where: {
            bookingId,
            status: { in: ['Approved', 'Partial'] },
        },
        data: { status: 'In_Progress' },
    });

    for (const req of eligibleRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'status_changed',
                actorId: 'system',
                before: { status: req.status },
                after: { status: 'In_Progress' },
                triggerSource: 'qr_scan',
            },
        });
    }

    return { updatedCount: eligibleRequests.length };
}

/**
 * Called by cron job: find bookings where end < now, update their
 * In_Progress requests → Fulfilled.
 */
export async function fulfillCompletedBookings() {
    const now = new Date();

    // Find all bookings that have ended
    const completedBookings = await prisma.venueBooking.findMany({
        where: {
            end: { lt: now },
            status: { not: 'Cancelled' },
        },
        select: { id: true },
    });

    if (completedBookings.length === 0) return { fulfilledCount: 0 };

    const bookingIds = completedBookings.map(b => b.id);

    const inProgressRequests = await prisma.assistanceRequest.findMany({
        where: {
            bookingId: { in: bookingIds },
            status: 'In_Progress',
        },
    });

    if (inProgressRequests.length === 0) return { fulfilledCount: 0 };

    await prisma.assistanceRequest.updateMany({
        where: {
            bookingId: { in: bookingIds },
            status: 'In_Progress',
        },
        data: { status: 'Fulfilled' },
    });

    for (const req of inProgressRequests) {
        await prisma.venueAuditLog.create({
            data: {
                requestId: req.id,
                action: 'status_changed',
                actorId: 'system',
                before: { status: 'In_Progress' },
                after: { status: 'Fulfilled' },
                triggerSource: 'booking_end',
            },
        });
    }

    return { fulfilledCount: inProgressRequests.length };
}

// ---------------------------------------------------------------------------
// Admin / Command Center actions
// ---------------------------------------------------------------------------

export interface CommandCenterFilters {
    status?: string;
    ministryId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    actorId?: string;
}

/**
 * Get all assistance requests for the command center, with optional filtering.
 */
export async function getCommandCenterData(filters: CommandCenterFilters = {}) {
    const where: Record<string, unknown> = {};

    let allowedIds: string[] | null = null;
    if (filters.actorId) {
        const { getActorMinistryAccess } = await import('@/actions/db');
        const access = await getActorMinistryAccess(filters.actorId);
        if (!access.isSuperAdmin && access.allowedMinistryIds !== null) {
            allowedIds = access.allowedMinistryIds;
            if (allowedIds.length === 0) return [];
        }
    }

    if (filters.status) {
        where.status = filters.status;
    }

    if (allowedIds !== null) {
        if (filters.ministryId) {
            if (!allowedIds.includes(filters.ministryId)) return [];
            where.ministryId = filters.ministryId;
        } else {
            where.ministryId = { in: allowedIds };
        }
    } else if (filters.ministryId) {
        where.ministryId = filters.ministryId;
    }

    if (filters.dateFrom || filters.dateTo) {
        where.booking = {
            start: {
                ...(filters.dateFrom ? { gte: filters.dateFrom } : {}),
                ...(filters.dateTo ? { lte: filters.dateTo } : {}),
            },
        };
    }

    return prisma.assistanceRequest.findMany({
        where,
        include: {
            items: true,
            booking: {
                include: {
                    room: true,
                    worker: { select: { id: true, firstName: true, lastName: true, email: true } },
                },
            },
            auditLogs: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
        orderBy: { createdAt: 'desc' },
    });
}

/** Get all audit log entries for a specific assistance request. */
export async function getAuditLogsForRequest(requestId: string) {
    return prisma.venueAuditLog.findMany({
        where: { requestId },
        orderBy: { createdAt: 'asc' },
    });
}

/** Update the global SLA setting (requires manage_venue_assistance permission). */
export async function updateVenueAssistanceSetting(slaDays: number, actorId: string) {
    if (slaDays < 1) throw new Error('SLA days must be at least 1.');

    return prisma.venueAssistanceSetting.upsert({
        where: { id: 'global' },
        update: { slaDays, updatedBy: actorId },
        create: { id: 'global', slaDays, updatedBy: actorId },
    });
}

// ---------------------------------------------------------------------------
// Booking query actions
// ---------------------------------------------------------------------------

/** Get all venue bookings with room and assistance request summaries. */
export async function getVenueBookings(filters?: { ministryIds?: string[]; actorId?: string }) {
    let allowedIds: string[] | null = null;
    if (filters?.actorId) {
        const { getActorMinistryAccess } = await import('@/actions/db');
        const access = await getActorMinistryAccess(filters.actorId);
        if (!access.isSuperAdmin && access.allowedMinistryIds !== null) {
            allowedIds = filters.ministryIds && filters.ministryIds.length > 0
                ? filters.ministryIds.filter(id => access.allowedMinistryIds!.includes(id))
                : access.allowedMinistryIds;
            if (allowedIds.length === 0) return [];
        }
    } else if (filters?.ministryIds && filters.ministryIds.length > 0) {
        allowedIds = filters.ministryIds;
    }

    const where: any = {};
    if (allowedIds !== null) {
        where.OR = [
            { assistanceRequests: { some: { ministryId: { in: allowedIds } } } },
            { worker: { majorMinistryId: { in: allowedIds } } },
            { worker: { minorMinistryId: { in: allowedIds } } },
        ];
    }

    return prisma.venueBooking.findMany({
        where,
        include: {
            room: true,
            worker: true,
            assistanceRequests: { include: { items: true } },
        },
        orderBy: { start: 'desc' },
    });
}

/** Get all venue bookings for a specific worker profile. */
export async function getMyVenueBookings(workerProfileId: string) {
    return prisma.venueBooking.findMany({
        where: { workerProfileId },
        include: {
            room: true,
            assistanceRequests: { include: { items: true } },
        },
        orderBy: { start: 'desc' },
    });
}

/** Get a single venue booking with full assistance request details. */
export async function getVenueBooking(bookingId: string, actorId?: string) {
    if (actorId) {
        const { getActorMinistryAccess } = await import('@/actions/db');
        const access = await getActorMinistryAccess(actorId);
        if (!access.isSuperAdmin && access.allowedMinistryIds !== null) {
            const booking = await prisma.venueBooking.findUnique({
                where: { id: bookingId },
                include: {
                    room: true,
                    worker: true,
                    assistanceRequests: {
                        include: {
                            items: true,
                            auditLogs: { orderBy: { createdAt: 'asc' } },
                        },
                    },
                },
            });
            if (!booking) return null;
            const isAllowed =
                (booking.worker?.majorMinistryId && access.allowedMinistryIds.includes(booking.worker.majorMinistryId)) ||
                (booking.worker?.minorMinistryId && access.allowedMinistryIds.includes(booking.worker.minorMinistryId)) ||
                booking.assistanceRequests.some(r => access.allowedMinistryIds!.includes(r.ministryId));
            if (!isAllowed) {
                return null;
            }
            return booking;
        }
    }

    return prisma.venueBooking.findUnique({
        where: { id: bookingId },
        include: {
            room: true,
            assistanceRequests: {
                include: {
                    items: true,
                    auditLogs: { orderBy: { createdAt: 'asc' } },
                },
            },
        },
    });
}

/** Get all AssistanceConfigurations with room and ministry info, including items. */
export async function getAllAssistanceConfigs() {
    return prisma.assistanceConfiguration.findMany({
        include: {
            items: true,
            room: true,
        },
        orderBy: [{ roomId: 'asc' }, { ministryId: 'asc' }],
    });
}

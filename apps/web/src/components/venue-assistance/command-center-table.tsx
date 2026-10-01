"use client";

import React, { useState, useMemo } from "react";
import { Badge } from "@studio/ui";
import { Button } from "@studio/ui";
import { Input } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@studio/ui";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@studio/ui";
import { ChevronDown, ChevronRight, AlertTriangle, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useCommandCenterData } from "@/hooks/use-assistance-requests";
import type { CommandCenterFilters } from "@/actions/venue-assistance";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

import type { getCommandCenterData } from "@/actions/venue-assistance";
type CommandCenterRequest = Awaited<ReturnType<typeof getCommandCenterData>>[number];

// ---------------------------------------------------------------------------
// Color coding helpers
// ---------------------------------------------------------------------------

/**
 * Returns the row color class for a request:
 * - red: SLA exceeded (Pending for > slaDays without response)
 * - amber: event within 3 days and not Approved/Partial
 * - green: all approved
 */
function getRowColorClass(
    request: CommandCenterRequest,
    slaDays: number,
): string {
    const now = new Date();
    const eventStart = new Date(request.booking.start);
    const createdAt = new Date(request.createdAt);
    const daysUntilEvent = differenceInDays(eventStart, now);
    const daysSinceCreated = differenceInDays(now, createdAt);

    // Red: SLA exceeded — Pending for longer than slaDays
    if (request.status === "Pending" && daysSinceCreated >= slaDays) {
        return "bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-500";
    }

    // Amber: event within 3 days and not Approved/Partial
    if (
        daysUntilEvent >= 0 &&
        daysUntilEvent <= 3 &&
        request.status !== "Approved" &&
        request.status !== "Partial"
    ) {
        return "bg-amber-50 dark:bg-amber-950/20 border-l-4 border-l-amber-500";
    }

    // Green: approved
    if (request.status === "Approved") {
        return "bg-green-50 dark:bg-green-950/20 border-l-4 border-l-green-500";
    }

    return "";
}

function isSlaExceeded(request: CommandCenterRequest, slaDays: number): boolean {
    if (request.status !== "Pending") return false;
    const daysSinceCreated = differenceInDays(new Date(), new Date(request.createdAt));
    return daysSinceCreated >= slaDays;
}

function isEventSoon(request: CommandCenterRequest): boolean {
    const now = new Date();
    const eventStart = new Date(request.booking.start);
    const daysUntilEvent = differenceInDays(eventStart, now);
    return (
        daysUntilEvent >= 0 &&
        daysUntilEvent <= 3 &&
        request.status !== "Approved" &&
        request.status !== "Partial"
    );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "Approved": return "default";
        case "Partial": return "secondary";
        case "Declined": return "destructive";
        case "Cancelled": return "destructive";
        case "In_Progress": return "default";
        case "Fulfilled": return "secondary";
        case "Pending":
        default: return "outline";
    }
}

function statusLabel(status: string): string {
    if (status === "In_Progress") return "In Progress";
    return status;
}

// ---------------------------------------------------------------------------
// Group requests by booking
// ---------------------------------------------------------------------------

function groupByBooking(requests: CommandCenterRequest[]) {
    const map = new Map<string, { booking: CommandCenterRequest["booking"]; requests: CommandCenterRequest[] }>();
    for (const req of requests) {
        const bookingId = req.bookingId;
        if (!map.has(bookingId)) {
            map.set(bookingId, { booking: req.booking, requests: [] });
        }
        map.get(bookingId)!.requests.push(req);
    }
    return Array.from(map.values());
}

// ---------------------------------------------------------------------------
// Filter bar
// ---------------------------------------------------------------------------

const STATUS_OPTIONS = [
    "All",
    "Pending",
    "Approved",
    "Partial",
    "Declined",
    "Cancelled",
    "In_Progress",
    "Fulfilled",
];

interface FilterBarProps {
    filters: CommandCenterFilters;
    ministries: { id: string; name: string }[];
    onChange: (filters: CommandCenterFilters) => void;
}

function FilterBar({ filters, ministries, onChange }: FilterBarProps) {
    return (
        <div className="flex flex-wrap gap-3 items-end">
            {/* Status filter */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Status</label>
                <Select
                    value={filters.status ?? "All"}
                    onValueChange={(v) =>
                        onChange({ ...filters, status: v === "All" ? undefined : v })
                    }
                >
                    <SelectTrigger className="w-36">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                            <SelectItem key={s} value={s}>
                                {s === "In_Progress" ? "In Progress" : s}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Ministry filter */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">Ministry</label>
                <Select
                    value={filters.ministryId ?? "All"}
                    onValueChange={(v) =>
                        onChange({ ...filters, ministryId: v === "All" ? undefined : v })
                    }
                >
                    <SelectTrigger className="w-44">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="All">All Ministries</SelectItem>
                        {ministries.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                                {m.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Date from */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">From</label>
                <Input
                    type="date"
                    className="w-36"
                    value={filters.dateFrom ? format(filters.dateFrom, "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            dateFrom: e.target.value ? new Date(e.target.value) : undefined,
                        })
                    }
                />
            </div>

            {/* Date to */}
            <div className="space-y-1">
                <label className="text-xs text-muted-foreground font-medium">To</label>
                <Input
                    type="date"
                    className="w-36"
                    value={filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""}
                    onChange={(e) =>
                        onChange({
                            ...filters,
                            dateTo: e.target.value ? new Date(e.target.value) : undefined,
                        })
                    }
                />
            </div>

            {/* Clear */}
            {(filters.status || filters.ministryId || filters.dateFrom || filters.dateTo) && (
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onChange({})}
                    className="self-end"
                >
                    Clear filters
                </Button>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface CommandCenterTableProps {
    /** SLA days from settings (default 3) */
    slaDays?: number;
    /** Called when a request row is selected */
    onSelectRequest?: (request: CommandCenterRequest) => void;
    /** Selected request ID for highlighting */
    selectedRequestId?: string | null;
    /** Ministry list for filter dropdown */
    ministries?: { id: string; name: string }[];
}

export function CommandCenterTable({
    slaDays = 3,
    onSelectRequest,
    selectedRequestId,
    ministries = [],
}: CommandCenterTableProps) {
    const [filters, setFilters] = useState<CommandCenterFilters>({});
    const [expandedBookings, setExpandedBookings] = useState<Set<string>>(new Set());

    const { requests, isLoading } = useCommandCenterData(filters);

    const grouped = useMemo(() => groupByBooking(requests), [requests]);

    const toggleBooking = (bookingId: string) => {
        setExpandedBookings((prev) => {
            const next = new Set(prev);
            if (next.has(bookingId)) {
                next.delete(bookingId);
            } else {
                next.add(bookingId);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            <FilterBar filters={filters} ministries={ministries} onChange={setFilters} />

            {isLoading ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                    Loading…
                </div>
            ) : grouped.length === 0 ? (
                <div className="py-10 text-center text-muted-foreground text-sm">
                    No assistance requests found.
                </div>
            ) : (
                <div className="rounded-md border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8" />
                                <TableHead>Booking</TableHead>
                                <TableHead>Room</TableHead>
                                <TableHead>Event Date</TableHead>
                                <TableHead>Requests</TableHead>
                                <TableHead>Requester</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {grouped.map(({ booking, requests: bookingRequests }) => {
                                const isExpanded = expandedBookings.has(booking.id);
                                const hasSlaIssue = bookingRequests.some((r) =>
                                    isSlaExceeded(r, slaDays)
                                );
                                const hasSoonEvent = bookingRequests.some((r) =>
                                    isEventSoon(r)
                                );
                                const allApproved =
                                    bookingRequests.length > 0 &&
                                    bookingRequests.every((r) => r.status === "Approved");

                                // Booking row color
                                let bookingRowClass = "";
                                if (hasSlaIssue) bookingRowClass = "bg-red-50 dark:bg-red-950/20";
                                else if (hasSoonEvent) bookingRowClass = "bg-amber-50 dark:bg-amber-950/20";
                                else if (allApproved) bookingRowClass = "bg-green-50 dark:bg-green-950/20";

                                const requester = booking.worker;
                                const requesterName = requester
                                    ? `${requester.firstName ?? ""} ${requester.lastName ?? ""}`.trim() ||
                                      requester.email
                                    : "—";

                                return (
                                    <React.Fragment key={booking.id}>
                                        {/* Booking row */}
                                        <TableRow
                                            className={`cursor-pointer hover:bg-muted/50 ${bookingRowClass}`}
                                            onClick={() => toggleBooking(booking.id)}
                                        >
                                            <TableCell className="py-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                ) : (
                                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    {booking.title}
                                                    {hasSlaIssue && (
                                                        <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
                                                    )}
                                                    {!hasSlaIssue && hasSoonEvent && (
                                                        <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {booking.room?.name ?? "—"}
                                            </TableCell>
                                            <TableCell className="text-sm whitespace-nowrap">
                                                {format(new Date(booking.start), "PPP")}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap gap-1">
                                                    {bookingRequests.map((r) => (
                                                        <Badge
                                                            key={r.id}
                                                            variant={statusVariant(r.status)}
                                                            className="text-xs"
                                                        >
                                                            {statusLabel(r.status)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {requesterName}
                                            </TableCell>
                                        </TableRow>

                                        {/* Expanded: per-ministry request rows */}
                                        {isExpanded &&
                                            bookingRequests.map((request) => {
                                                const rowColor = getRowColorClass(request, slaDays);
                                                const isSelected = selectedRequestId === request.id;
                                                const lastLog = request.auditLogs?.[0];

                                                return (
                                                    <TableRow
                                                        key={request.id}
                                                        className={`cursor-pointer transition-colors ${rowColor} ${
                                                            isSelected
                                                                ? "ring-2 ring-inset ring-primary"
                                                                : "hover:bg-muted/40"
                                                        }`}
                                                        onClick={() => onSelectRequest?.(request)}
                                                    >
                                                        <TableCell />
                                                        <TableCell className="pl-8 text-sm">
                                                            <div className="flex items-center gap-2">
                                                                {isSlaExceeded(request, slaDays) && (
                                                                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                                                )}
                                                                {!isSlaExceeded(request, slaDays) &&
                                                                    isEventSoon(request) && (
                                                                        <Clock className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                                                                    )}
                                                                <span className="font-medium">
                                                                    {request.ministryId}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell />
                                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {request.respondedAt
                                                                ? `Responded ${format(new Date(request.respondedAt), "PP")}`
                                                                : `Created ${format(new Date(request.createdAt), "PP")}`}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant={statusVariant(request.status)}
                                                                className="text-xs"
                                                            >
                                                                {statusLabel(request.status)}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                                                            {lastLog
                                                                ? format(new Date(lastLog.createdAt), "PP p")
                                                                : "—"}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </React.Fragment>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
        </div>
    );
}

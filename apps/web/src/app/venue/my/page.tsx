"use client";

import React from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Badge } from "@studio/ui";
import { usePermissionsStore } from "@studio/store";
import { useShallow } from "zustand/react/shallow";
import { useMyVenueBookings } from "@/hooks/use-venue-bookings";
import { LoaderCircle, PlusCircle, CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bookingStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "Pending Ministry Approval": return "secondary";
        case "Approved": return "default";
        case "Cancelled": return "destructive";
        default: return "outline";
    }
}

function assistanceStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "Approved": return "default";
        case "Partial": return "secondary";
        case "Declined": return "destructive";
        case "Pending": return "outline";
        case "In_Progress": return "default";
        case "Fulfilled": return "secondary";
        case "Cancelled": return "destructive";
        default: return "outline";
    }
}

function assistanceStatusLabel(status: string): string {
    if (status === "In_Progress") return "In Progress";
    return status;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MyVenuePage() {
    const { isLoading: isPermissionsLoading, workerProfile } = usePermissionsStore(
        useShallow((s) => ({
            isLoading: s.isLoading,
            workerProfile: s.workerProfile,
        }))
    );

    const { bookings, isLoading: isBookingsLoading } = useMyVenueBookings(
        workerProfile?.id ?? ""
    );

    const isLoading = isPermissionsLoading || isBookingsLoading;

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
                        My Bookings
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        Your venue bookings and their assistance statuses.
                    </p>
                </div>
                <Button asChild className="self-start sm:self-auto">
                    <Link href="/venue">
                        <PlusCircle className="mr-2 h-4 w-4" /> New Booking
                    </Link>
                </Button>
            </div>

            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {bookings.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground mb-4">You have no bookings yet.</p>
                        <Button asChild variant="outline">
                            <Link href="/venue">Book a Venue</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {bookings.map((booking) => (
                        <Card key={booking.id}>
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <CardTitle className="text-base truncate">
                                            <Link
                                                href={`/venue/${booking.id}`}
                                                className="hover:underline"
                                            >
                                                {booking.title}
                                            </Link>
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {booking.room?.name ?? "Unknown room"}
                                        </CardDescription>
                                    </div>
                                    <Badge variant={bookingStatusVariant(booking.status)} className="shrink-0">
                                        {booking.status}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Date & time */}
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1.5">
                                        <CalendarDays className="h-3.5 w-3.5" />
                                        {format(new Date(booking.start), "PPP")}
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="h-3.5 w-3.5" />
                                        {format(new Date(booking.start), "p")} –{" "}
                                        {format(new Date(booking.end), "p")}
                                    </span>
                                </div>

                                {/* Assistance request status badges */}
                                {booking.assistanceRequests.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {booking.assistanceRequests.map((req) => (
                                            <Badge
                                                key={req.id}
                                                variant={assistanceStatusVariant(req.status)}
                                                className="text-xs"
                                            >
                                                {assistanceStatusLabel(req.status)}
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/venue/${booking.id}`}>View details →</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
            </div>
        </AppLayout>
    );
}

"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import { Badge } from "@studio/ui";
import { Card, CardContent } from "@studio/ui";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@studio/ui";
import { usePermissionsStore } from "@studio/store";
import { useShallow } from "zustand/react/shallow";
import { useVenueBooking } from "@/hooks/use-venue-bookings";
import { useAssistanceRequestsForBooking } from "@/hooks/use-assistance-requests";
import { cancelVenueBooking } from "@/actions/venue-assistance";
import { AssistanceRequestCard } from "@/components/venue-assistance/assistance-request-card";
import { useToast } from "@/hooks/use-toast";
import { LoaderCircle, ArrowLeft, CalendarDays, Clock, Users } from "lucide-react";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { venueBookingKeys } from "@/hooks/use-venue-bookings";
import { assistanceRequestKeys } from "@/hooks/use-assistance-requests";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function bookingStatusVariant(
    status: string,
): "default" | "secondary" | "destructive" | "outline" {
    switch (status) {
        case "Approved":
            return "default";
        case "Cancelled":
            return "destructive";
        case "Pending Ministry Approval":
            return "secondary";
        default:
            return "outline";
    }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function BookingDetailPage() {
    const params = useParams();
    const bookingId = params.bookingId as string;
    const router = useRouter();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isCancelling, setIsCancelling] = useState(false);

    const { workerProfile, canManageVenueAssistance, canManageOwnMinistryAssistance, myMinistryIds } =
        usePermissionsStore(
            useShallow((s) => ({
                workerProfile: s.workerProfile,
                canManageVenueAssistance: s.canManageVenueAssistance,
                canManageOwnMinistryAssistance: s.canManageOwnMinistryAssistance,
                myMinistryIds: s.myMinistryIds,
            })),
        );

    const { booking, isLoading: isBookingLoading } = useVenueBooking(bookingId);
    const { requests, isLoading: isRequestsLoading } = useAssistanceRequestsForBooking(bookingId);

    const isLoading = isBookingLoading || isRequestsLoading;

    const isRequester = booking?.workerProfileId === workerProfile?.id;
    const canCancel =
        isRequester &&
        booking?.status !== "Cancelled" &&
        booking?.status !== "Fulfilled";

    const handleCancel = async () => {
        if (!workerProfile) return;
        setIsCancelling(true);
        try {
            await cancelVenueBooking(bookingId, workerProfile.id);
            toast({ title: "Booking cancelled", description: "The booking has been cancelled." });
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: venueBookingKeys.detail(bookingId) });
            queryClient.invalidateQueries({ queryKey: venueBookingKeys.mine(workerProfile.id) });
            queryClient.invalidateQueries({
                queryKey: assistanceRequestKeys.forBooking(bookingId),
            });
            router.push("/venue/my");
        } catch (err: any) {
            toast({
                variant: "destructive",
                title: "Cancellation failed",
                description: err?.message ?? "Could not cancel booking.",
            });
        } finally {
            setIsCancelling(false);
        }
    };

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center py-10">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            </AppLayout>
        );
    }

    if (!booking) {
        return (
            <AppLayout>
                <div className="py-10 text-center">
                    <p className="text-muted-foreground mb-4">Booking not found.</p>
                    <Button asChild variant="outline">
                        <Link href="/venue/my">Back to My Bookings</Link>
                    </Button>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            {/* Back link */}
            <div className="mb-4">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                    <Link href="/venue/my">
                        <ArrowLeft className="mr-1 h-4 w-4" /> My Bookings
                    </Link>
                </Button>
            </div>

            {/* Booking header */}
            <div className="flex items-start justify-between gap-4 mb-6">
                <div className="min-w-0">
                    <h1 className="text-2xl font-headline font-bold truncate">{booking.title}</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {booking.room?.name ?? "Unknown room"}
                    </p>
                </div>
                <Badge variant={bookingStatusVariant(booking.status)} className="shrink-0">
                    {booking.status}
                </Badge>
            </div>

            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Booking details */}
                <Card>
                <CardContent className="pt-4 space-y-3">
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <CalendarDays className="h-4 w-4" />
                            {format(new Date(booking.start), "PPP")}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {format(new Date(booking.start), "p")} –{" "}
                            {format(new Date(booking.end), "p")}
                        </span>
                        {booking.pax > 0 && (
                            <span className="flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                {booking.pax} attendees
                            </span>
                        )}
                    </div>
                    {booking.purpose && (
                        <p className="text-sm text-muted-foreground">{booking.purpose}</p>
                    )}
                </CardContent>
            </Card>

            {/* Assistance requests */}
            <div className="mb-4">
                <h2 className="text-lg font-semibold">Ministry Assistance</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Status of each ministry&apos;s assistance commitment for this booking.
                </p>
            </div>

            {requests.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                            No assistance requests for this booking.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => {
                        // Ministry head can respond if they manage this ministry
                        const isMinistryHead =
                            canManageOwnMinistryAssistance &&
                            myMinistryIds.includes(request.ministryId);
                        const canRespond = canManageVenueAssistance || isMinistryHead;

                        return (
                            <AssistanceRequestCard
                                key={request.id}
                                request={request}
                                ministryName={request.ministryId}
                                canRespond={canRespond}
                                responderId={workerProfile?.id}
                                bookingId={bookingId}
                                recurringBookingId={booking.recurringBookingId ?? null}
                            />
                        );
                    })}
                </div>
            )}

            {/* Cancel button (requester only) */}
            {canCancel && (
                <div className="mt-6 flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isCancelling}>
                                {isCancelling ? (
                                    <>
                                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                                        Cancelling…
                                    </>
                                ) : (
                                    "Cancel Booking"
                                )}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This will cancel the booking and notify all ministries with
                                    pending assistance requests. This action cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Keep booking</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleCancel}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                    Yes, cancel
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
            </div>
        </AppLayout>
    );
}

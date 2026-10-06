"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
  Checkbox,
  DatePicker,
} from "@studio/ui";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  LoaderCircle,
  XCircle,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUserRole } from "@/hooks/use-user-role";
import { useAuthStore } from "@studio/store";
import { useQuery } from "@tanstack/react-query";
import {
  getRooms,
  getAreas,
  getMinistries,
  getVenueElements,
  getBookingsForRoomOnDate,
  createBooking,
  createApproval,
} from "@/actions/db";
import { useToast } from "@/hooks/use-toast";
import type { Room, Area, Ministry, VenueElement } from "@studio/types";

export default function NewReservationPage() {
  const { user } = useAuthStore();
  const { workerProfile, isSuperAdmin, isMinistryHead, myMinistryIds, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const router = useRouter();

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState("");

  // Form states
  const [requesterName, setRequesterName] = useState("");
  const [ministryId, setMinistryId] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    format(new Date(), "yyyy-MM-dd")
  );
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [roomId, setRoomId] = useState("");
  const [pax, setPax] = useState("");
  const [numTables, setNumTables] = useState("");
  const [numChairs, setNumChairs] = useState("");
  const [requestedElements, setRequestedElements] = useState<string[]>([]);
  const [guidelinesAccepted, setGuidelinesAccepted] = useState(false);

  // Initialize Request ID and User defaults
  useEffect(() => {
    setGeneratedRequestId(
      `REQ-${Math.floor(1000 + Math.random() * 9000)}`
    );
  }, []);

  useEffect(() => {
    if (workerProfile) {
      setRequesterName(
        `${workerProfile.firstName} ${workerProfile.lastName}`
      );
      setEmail(workerProfile.email || user?.email || "");
      if (workerProfile.majorMinistryId) {
        setMinistryId(workerProfile.majorMinistryId);
      } else if (myMinistryIds && myMinistryIds.length > 0) {
        setMinistryId(myMinistryIds[0]);
      }
    } else if (user) {
      setRequesterName(user.email?.split("@")[0] || "System Admin");
      setEmail(user.email || "admin@gmail.com");
    }
  }, [workerProfile, user, myMinistryIds]);

  // Data fetching
  const { data: rooms } = useQuery({
    queryKey: ["rooms"],
    queryFn: getRooms,
  });

  const { data: areas } = useQuery({
    queryKey: ["areas"],
    queryFn: getAreas,
  });

  const { data: ministries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const userMinistry = useMemo(() => {
    if (!ministries || ministries.length === 0) return null;
    const targetId =
      ministryId ||
      workerProfile?.majorMinistryId ||
      (myMinistryIds && myMinistryIds.length > 0 ? myMinistryIds[0] : null);
    if (targetId) {
      return ministries.find((m: any) => m.id === targetId);
    }
    return ministries[0] || null;
  }, [ministries, ministryId, workerProfile, myMinistryIds]);

  useEffect(() => {
    if (!ministryId && ministries && ministries.length > 0) {
      const targetId =
        workerProfile?.majorMinistryId ||
        (myMinistryIds && myMinistryIds.length > 0 ? myMinistryIds[0] : null) ||
        ministries[0].id;
      if (targetId) {
        setMinistryId(targetId);
      }
    }
  }, [ministryId, ministries, workerProfile, myMinistryIds]);

  const { data: venueElements } = useQuery({
    queryKey: ["venue-elements"],
    queryFn: getVenueElements,
  });

  const selectedRoom = useMemo(() => {
    return rooms?.find((r) => r.id === roomId);
  }, [rooms, roomId]);

  // Fetch existing bookings for selected room on selected date
  const { data: existingBookings = [], isLoading: isCheckingBookings } = useQuery({
    queryKey: ["room-bookings", roomId, selectedDate],
    queryFn: async () => {
      if (!roomId || !selectedDate) return [];
      const [y, m, d] = selectedDate.split("-").map(Number);
      const parsedDate = new Date(y, m - 1, d);
      return getBookingsForRoomOnDate(roomId, parsedDate);
    },
    enabled: !!roomId && !!selectedDate,
  });

  // Calculate booked minute ranges (excluding Rejected)
  const bookedRanges = useMemo(() => {
    if (!existingBookings || existingBookings.length === 0) return [];
    return (existingBookings as any[])
      .filter((res) => res.status !== "Rejected")
      .map((res) => {
        const resStart = new Date(res.start);
        const resEnd = new Date(res.end);
        const startMin = resStart.getHours() * 60 + resStart.getMinutes();
        const endMin = resEnd.getHours() * 60 + resEnd.getMinutes();
        return {
          startMin,
          endMin,
          name: res.name || "Reserved",
          status: res.status || "Reserved",
          title: res.title || res.purpose || "Reservation",
        };
      });
  }, [existingBookings]);

  const timeToMinutes = (timeVal: string) => {
    if (!timeVal) return 0;
    const [h, m] = timeVal.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime12 = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const period = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
  };

  // Reset startTime/endTime if the newly selected room/date makes them unavailable
  useEffect(() => {
    if (startTime && bookedRanges.length > 0) {
      const startMin = timeToMinutes(startTime);
      const isStartBooked = bookedRanges.some(
        (r) => startMin >= r.startMin && startMin < r.endMin
      );
      if (isStartBooked) {
        setStartTime("");
        setEndTime("");
        toast({
          variant: "destructive",
          title: "Time Slot Reset",
          description: "The selected time slot is already reserved for this room. Please pick an available time.",
        });
      }
    }
  }, [roomId, selectedDate, bookedRanges, startTime, toast]);

  useEffect(() => {
    if (startTime && endTime) {
      const startMin = timeToMinutes(startTime);
      const endMin = timeToMinutes(endTime);
      const isConflict =
        endMin <= startMin ||
        bookedRanges.some((r) => startMin < r.endMin && endMin > r.startMin);
      if (isConflict) {
        setEndTime("");
      }
    }
  }, [startTime, endTime, bookedRanges]);

  // Time slots from 8:00 AM to 8:00 PM (in 30-min intervals)
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let h = 8; h <= 20; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === 20 && m > 0) continue;
        const hour24 = h.toString().padStart(2, "0");
        const minute = m.toString().padStart(2, "0");
        const val = `${hour24}:${minute}`;

        const period = h >= 12 ? "PM" : "AM";
        const h12 = h % 12 === 0 ? 12 : h % 12;
        const disp = `${h12}:${minute} ${period}`;
        slots.push({ value: val, display: disp });
      }
    }
    return slots;
  }, []);

  // Check if selected date is in the past (before today)
  const isDateInPast = useMemo(() => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const resDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return resDate < todayStart;
  }, [selectedDate]);

  // Helper to check if a specific time slot on the selected date is in the past
  const isSlotInPast = (timeVal: string) => {
    if (!selectedDate) return false;
    const [y, m, d] = selectedDate.split("-").map(Number);
    const resDate = new Date(y, m - 1, d);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (resDate < todayStart) return true;
    if (resDate.getTime() === todayStart.getTime()) {
      const [h, min] = timeVal.split(":").map(Number);
      const slotTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, min, 0, 0);
      return slotTime <= now;
    }
    return false;
  };

  // Check if current start time is already in the past
  const isTimeInPast = useMemo(() => {
    if (!startTime) return false;
    return isSlotInPast(startTime);
  }, [selectedDate, startTime]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!requesterName.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Requester Name",
        description: "Please enter the requester name.",
      });
      return;
    }

    const effectiveMinistryId =
      ministryId ||
      userMinistry?.id ||
      workerProfile?.majorMinistryId ||
      (myMinistryIds && myMinistryIds[0]) ||
      (ministries && ministries[0]?.id) ||
      "";

    if (!effectiveMinistryId) {
      toast({
        variant: "destructive",
        title: "Missing Ministry",
        description: "Your worker profile does not have an assigned ministry.",
      });
      return;
    }

    if (!email.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Email",
        description: "Please provide an email address.",
      });
      return;
    }

    if (!purpose.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Purpose",
        description: "Please provide the purpose of your reservation.",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        variant: "destructive",
        title: "Missing Date",
        description: "Please select a date for the reservation.",
      });
      return;
    }

    if (isDateInPast) {
      toast({
        variant: "destructive",
        title: "Past Date Not Allowed",
        description: "Room reservations cannot be made for past dates. Please pick today or a future date.",
      });
      return;
    }

    if (!startTime || !endTime) {
      toast({
        variant: "destructive",
        title: "Missing Time",
        description: "Please specify both start and end times.",
      });
      return;
    }

    if (isTimeInPast) {
      toast({
        variant: "destructive",
        title: "Past Time Not Allowed",
        description: "The selected reservation start time has already passed. Please select an upcoming time slot.",
      });
      return;
    }

    if (!roomId) {
      toast({
        variant: "destructive",
        title: "Missing Room",
        description: "Please select a floor and room.",
      });
      return;
    }

    const paxNum = parseInt(pax);
    if (!pax || isNaN(paxNum) || paxNum <= 0) {
      toast({
        variant: "destructive",
        title: "Missing Pax",
        description: "Please enter the number of attendees (Pax).",
      });
      return;
    }

    if (selectedRoom && paxNum > selectedRoom.capacity) {
      toast({
        variant: "destructive",
        title: "Capacity Exceeded",
        description: `This room holds a maximum of ${selectedRoom.capacity} people. Please pick a larger room.`,
      });
      return;
    }

    const tablesNum = parseInt(numTables);
    if (numTables === "" || isNaN(tablesNum) || tablesNum < 0) {
      toast({
        variant: "destructive",
        title: "Missing Tables Count",
        description: "Please specify the number of tables (enter 0 if none).",
      });
      return;
    }
    if (tablesNum > 5) {
      toast({
        variant: "destructive",
        title: "Tables Limit Exceeded",
        description: "Maximum of 5 tables allowed per reservation.",
      });
      return;
    }

    const chairsNum = parseInt(numChairs);
    if (numChairs === "" || isNaN(chairsNum) || chairsNum < 0) {
      toast({
        variant: "destructive",
        title: "Missing Chairs Count",
        description: "Please specify the number of chairs (enter 0 if none).",
      });
      return;
    }
    if (chairsNum > 60) {
      toast({
        variant: "destructive",
        title: "Chairs Limit Exceeded",
        description: "Maximum of 60 chairs allowed per reservation.",
      });
      return;
    }

    if (!guidelinesAccepted) {
      toast({
        variant: "destructive",
        title: "Guidelines Required",
        description:
          "Please accept the ORS Guidelines before submitting your request.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);

      const [y, m, d] = selectedDate.split("-").map(Number);
      const parsedDate = new Date(y, m - 1, d);
      const start = new Date(y, m - 1, d, startH, startM, 0, 0);
      const end = new Date(y, m - 1, d, endH, endM, 0, 0);

      if (start <= new Date()) {
        toast({
          variant: "destructive",
          title: "Invalid Start Time",
          description: "The reservation start time has already passed. Please select a future time slot.",
        });
        setIsSubmitting(false);
        return;
      }

      if (start >= end) {
        toast({
          variant: "destructive",
          title: "Invalid Time",
          description: "End time must be after start time.",
        });
        setIsSubmitting(false);
        return;
      }

      // Check conflicts - Block ANY reservation (Approved or Pending) in the same time slot
      const existingReservations = await getBookingsForRoomOnDate(
        roomId,
        parsedDate
      );
      let hasConflict = false;
      let conflictingStatus = "";
      let conflictingRequester = "";

      for (const res of existingReservations) {
        if (res.status === "Rejected") continue;

        const resStart = new Date(res.start);
        const resEnd = new Date(res.end);

        if (resStart && resEnd && start < resEnd && end > resStart) {
          hasConflict = true;
          conflictingStatus = res.status;
          conflictingRequester = res.name;
          break;
        }
      }

      if (hasConflict) {
        toast({
          variant: "destructive",
          title: "Time Slot Unavailable",
          description: `This room is already reserved (${conflictingStatus}) by ${conflictingRequester} for this time slot. Please choose a different time or room.`,
        });
        setIsSubmitting(false);
        return;
      }

      const effectiveWorkerId =
        workerProfile?.id || "worker-system-admin";

      const bookingData = {
        requestId: generatedRequestId,
        roomId,
        title: purpose,
        purpose,
        start,
        end,
        status: "Pending Ministry Approval",
        workerProfileId: effectiveWorkerId,
        name: requesterName || "System Admin",
        ministryId: effectiveMinistryId,
        email: email || "admin@gmail.com",
        pax: paxNum || 0,
        numTables: parseInt(numTables) || 0,
        numChairs: parseInt(numChairs) || 0,
        requestedElements,
        equipment_TV: false,
        equipment_Mic: false,
        equipment_Speakers: false,
        guidelinesAccepted: true,
      };

      const newBooking = await createBooking(bookingData);

      if (newBooking?.id) {
        await createApproval({
          requester: requesterName || "System Admin",
          type: "Room Booking",
          details: `"${purpose}" for room: ${selectedRoom?.name}`,
          date: new Date(),
          status: "Pending Ministry Approval",
          roomId,
          reservationId: newBooking.id,
          workerId: effectiveWorkerId,
          requestId: generatedRequestId,
        });

        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Error submitting reservation:", error);
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description:
          error?.message ||
          "There was an error submitting your request. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <AppLayout>
        <div className="w-full max-w-2xl mx-auto py-12">
          <div className="bg-white dark:bg-card rounded-2xl border border-border/60 p-8 text-center shadow-card-dark space-y-6">
            <div className="flex justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-headline text-gray-900 dark:text-white">
                Request Submitted!
              </h2>
              <p className="text-sm text-muted-foreground">
                Your room reservation request (
                <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">
                  {generatedRequestId}
                </span>
                ) has been submitted and is now pending approval.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                className="rounded-xl px-5 h-9 text-xs font-semibold"
                onClick={() => router.push("/reservations/masterview/daily")}
              >
                View Calendar
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-5 h-9 text-xs font-semibold shadow-xs"
                onClick={() => router.push("/reservations/my")}
              >
                Go to My Reservations
              </Button>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="w-full space-y-6 pb-12">
        {/* Header Section */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
            Reserve a Room
          </h1>
          <p className="text-sm text-muted-foreground">
            Fill out the form below to request a facility for your event or ministry.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 p-6 sm:p-8 shadow-card-dark w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Card Title & Notice */}
          <div className="mb-6 space-y-0.5">
            <h2 className="text-xl font-bold font-headline text-gray-900 dark:text-white">
              Request Information
            </h2>
            <p className="text-xs italic text-red-500 font-medium">
              All fields are required to be filled out.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {/* Row 1: Request ID & Date Requested */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Request ID
                </label>
                <Input
                  value={generatedRequestId || "REQ-1000"}
                  disabled
                  className="bg-slate-50/90 dark:bg-muted/30 border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 rounded-xl h-10 text-xs font-medium cursor-not-allowed shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Date Requested
                </label>
                <Input
                  value={format(new Date(), "MMM d, yyyy")}
                  disabled
                  className="bg-slate-50/90 dark:bg-muted/30 border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 rounded-xl h-10 text-xs font-medium cursor-not-allowed shadow-2xs"
                />
              </div>
            </div>

            {/* Row 2: Requester Name & Ministry */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Requester Name <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  required
                  value={requesterName}
                  onChange={(e) => setRequesterName(e.target.value)}
                  placeholder="System Admin"
                  className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Ministry
                </label>
                <Input
                  value={userMinistry?.name || "General Ministry"}
                  disabled
                  className="bg-slate-50/90 dark:bg-muted/30 border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 rounded-xl h-10 text-xs font-medium cursor-not-allowed shadow-2xs"
                />
              </div>
            </div>

            {/* Row 3: Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Email <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@gmail.com"
                className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
              />
            </div>

            {/* Row 4: Purpose of Reservation */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Purpose of Reservation <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Textarea
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="Describe the event or meeting...."
                className="bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-xl min-h-[110px] p-3 text-xs leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
              />
            </div>

            {/* Row 5: Floor / Room */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Floor / Room <span className="text-red-500 ml-0.5">*</span>
              </label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all">
                  <SelectValue placeholder="Select floor / room" />
                </SelectTrigger>
                <SelectContent>
                  {areas?.map((area) => {
                    const areaRooms = (rooms || []).filter(
                      (r) => r.areaId === area.id || r.areaId === area.areaId
                    );
                    if (areaRooms.length === 0) return null;

                    return (
                      <SelectGroup key={area.id}>
                        <SelectLabel className="text-xs font-bold text-gray-500">
                          {area.name}
                        </SelectLabel>
                        {areaRooms.map((room) => (
                          <SelectItem
                            key={room.id}
                            value={room.id}
                            className="text-xs"
                          >
                            {area.name} – {room.name} (Cap: {room.capacity})
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Row 6: Select Date, Start Time, End Time */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Select Date <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <DatePicker
                    value={selectedDate}
                    onChange={(d) => {
                      setSelectedDate(d);
                      if (startTime && isSlotInPast(startTime)) {
                        setStartTime("");
                      }
                      if (endTime && isSlotInPast(endTime)) {
                        setEndTime("");
                      }
                    }}
                    disablePastDates={true}
                    className="w-full h-10 rounded-xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 shadow-2xs"
                    align="start"
                  />
                  {isDateInPast && (
                    <p className="text-[11px] font-semibold text-red-500 mt-1 flex items-center gap-1">
                      <XCircle className="h-3.5 w-3.5 shrink-0" />
                      Past dates are not allowed.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Start Time <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Select value={startTime} onValueChange={setStartTime}>
                    <SelectTrigger className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all">
                      <SelectValue placeholder="Start" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => {
                        const passed = isSlotInPast(slot.value);
                        const slotMin = timeToMinutes(slot.value);
                        const conflicting = bookedRanges.find(
                          (r) => slotMin >= r.startMin && slotMin < r.endMin
                        );
                        const isBooked = !!conflicting;
                        const isDisabled = passed || isBooked;

                        return (
                          <SelectItem
                            key={`start-${slot.value}`}
                            value={slot.value}
                            disabled={isDisabled}
                            className={cn(
                              "text-xs",
                              isBooked && "text-red-500/80 bg-red-50/40 dark:bg-red-950/20"
                            )}
                          >
                            <span className="flex items-center justify-between w-full gap-2">
                              <span className={cn(isBooked && "line-through opacity-70")}>
                                {slot.display}
                              </span>
                              {isBooked ? (
                                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50 shrink-0">
                                  Reserved ({conflicting.status})
                                </span>
                              ) : passed ? (
                                <span className="text-[10px] text-muted-foreground italic shrink-0">
                                  Passed
                                </span>
                              ) : null}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {isTimeInPast && (
                    <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      Time has already passed.
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    End Time <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Select value={endTime} onValueChange={setEndTime}>
                    <SelectTrigger className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all">
                      <SelectValue placeholder="End" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((slot) => {
                        const passed = isSlotInPast(slot.value);
                        const slotMin = timeToMinutes(slot.value);
                        let isBooked = false;
                        let isBeforeOrEqualStart = false;

                        if (startTime) {
                          const startMin = timeToMinutes(startTime);
                          if (slotMin <= startMin) {
                            isBeforeOrEqualStart = true;
                          } else {
                            isBooked = bookedRanges.some(
                              (r) => startMin < r.endMin && slotMin > r.startMin
                            );
                          }
                        } else {
                          isBooked = bookedRanges.some(
                            (r) => slotMin > r.startMin && slotMin <= r.endMin
                          );
                        }

                        const isDisabled = passed || isBeforeOrEqualStart || isBooked;

                        return (
                          <SelectItem
                            key={`end-${slot.value}`}
                            value={slot.value}
                            disabled={isDisabled}
                            className={cn(
                              "text-xs",
                              isBooked && "text-red-500/80 bg-red-50/40 dark:bg-red-950/20"
                            )}
                          >
                            <span className="flex items-center justify-between w-full gap-2">
                              <span className={cn((isBooked || isBeforeOrEqualStart) && "line-through opacity-70")}>
                                {slot.display}
                              </span>
                              {isBooked ? (
                                <span className="text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900/50 shrink-0">
                                  Unavailable
                                </span>
                              ) : isBeforeOrEqualStart && startTime ? (
                                <span className="text-[10px] text-muted-foreground italic shrink-0">
                                  ≤ Start
                                </span>
                              ) : passed ? (
                                <span className="text-[10px] text-muted-foreground italic shrink-0">
                                  Passed
                                </span>
                              ) : null}
                            </span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs italic text-red-500 font-medium mt-1.5">
                Note: Room reservations are until 8:00 pm only.
              </p>

              {/* Live Room Schedule / Reserved Times Summary */}
              {roomId && selectedDate && (
                <div className="mt-2.5">
                  {isCheckingBookings ? (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse py-1">
                      <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                      <span>Checking room schedule...</span>
                    </div>
                  ) : bookedRanges.length > 0 ? (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 dark:border-amber-900/50 dark:bg-amber-950/25 p-3 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-900 dark:text-amber-300">
                        <Info className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Already reserved for {selectedRoom?.name || "this room"} on {selectedDate}:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {bookedRanges.map((range, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white dark:bg-card border border-amber-200/90 dark:border-amber-800/80 text-[11px] font-medium text-gray-800 dark:text-gray-200 shadow-2xs"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />
                            <span className="font-semibold text-red-600 dark:text-red-400">
                              {formatTime12(range.startMin)} – {formatTime12(range.endMin)}
                            </span>
                            <span className="text-muted-foreground text-[10px]">
                              ({range.status} – {range.name})
                            </span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium py-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{selectedRoom?.name || "This room"} is fully available on this date.</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 7: Pax, No. of Tables, No. of Chairs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  Pax <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min={1}
                  value={pax}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    const maxCapacity = selectedRoom?.capacity || 999;
                    if (val <= maxCapacity || e.target.value === "") {
                      setPax(e.target.value);
                    }
                  }}
                  placeholder="Number of people"
                  max={selectedRoom?.capacity || undefined}
                  className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                />
                {selectedRoom && (
                  <p className="text-[11px] font-medium mt-1 text-muted-foreground">
                    Max room capacity: {selectedRoom.capacity}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No. of Tables <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={numTables}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val <= 5 || e.target.value === "") {
                      setNumTables(e.target.value);
                    }
                  }}
                  placeholder="0"
                  max={5}
                  className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                />
                <p className="text-[11px] font-medium text-muted-foreground mt-1">
                  Maximum: 5 tables
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  No. of Chairs <span className="text-red-500 ml-0.5">*</span>
                </label>
                <Input
                  type="number"
                  required
                  min={0}
                  value={numChairs}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (val <= 60 || e.target.value === "") {
                      setNumChairs(e.target.value);
                    }
                  }}
                  placeholder="0"
                  max={60}
                  className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                />
                <p className="text-[11px] font-medium mt-1 text-muted-foreground">
                  Maximum: 60 chairs
                </p>
              </div>
            </div>

            {/* Optional Facility Elements */}
            {selectedRoom &&
              selectedRoom.elements &&
              selectedRoom.elements.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-gray-100 dark:border-border/60">
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Requested Equipment & Facility Elements
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {selectedRoom.elements.map((elementId: string) => {
                      const element = venueElements?.find(
                        (e) => e.id === elementId
                      );
                      if (!element) return null;
                      return (
                        <div
                          key={element.id}
                          className="flex items-center space-x-2.5 bg-slate-50/80 dark:bg-muted/30 p-2.5 rounded-xl border border-slate-200/70 dark:border-border/60 hover:border-sidebar/30 transition-all"
                        >
                          <Checkbox
                            id={`element-${element.id}`}
                            checked={requestedElements.includes(element.id)}
                            onCheckedChange={(c) => {
                              if (c) {
                                setRequestedElements((prev) => [
                                  ...prev,
                                  element.id,
                                ]);
                              } else {
                                setRequestedElements((prev) =>
                                  prev.filter((id) => id !== element.id)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={`element-${element.id}`}
                            className="cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300 select-none"
                          >
                            {element.name}
                          </label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* ORS Guidelines Section (Retained before Submit & Cancel buttons) */}
            <div className="bg-slate-50/90 dark:bg-muted/30 p-4 rounded-xl border border-slate-200/90 dark:border-border space-y-2.5 mt-6 shadow-2xs">
              <div className="font-bold text-xs text-slate-900 dark:text-white">
                ORS Guidelines
              </div>
              <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                1. Rooms must be left clean and tidy after use.
                <br />
                2. Switch off all lights, AC, and equipment before leaving.
                <br />
                3. Report any damage immediately to the facilities manager.
              </p>
              <div className="flex items-center space-x-2 pt-2 border-t border-slate-200/70 dark:border-border/60">
                <Checkbox
                  id="guidelines"
                  checked={guidelinesAccepted}
                  onCheckedChange={(c) => setGuidelinesAccepted(!!c)}
                />
                <label
                  htmlFor="guidelines"
                  className="text-xs font-semibold cursor-pointer text-slate-800 dark:text-slate-200 hover:text-slate-950 dark:hover:text-white select-none transition-colors"
                >
                  I understand and will follow the ORS guidelines
                </label>
              </div>
            </div>

            {/* Footer Buttons (Cancel & Submit) */}
            <div className="pt-4 border-t border-gray-100 dark:border-border/60 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="rounded-xl px-6 h-10 text-xs font-semibold border-slate-200/90 dark:border-border hover:bg-slate-100 dark:hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !guidelinesAccepted || isDateInPast || isTimeInPast}
                className={cn(
                  "rounded-xl px-7 h-10 text-xs font-bold shadow-xs gap-1.5 transition-all",
                  guidelinesAccepted && !isDateInPast && !isTimeInPast
                    ? "bg-sidebar hover:bg-sidebar/90 text-white cursor-pointer shadow-sm"
                    : "bg-sidebar/40 text-white dark:bg-sidebar/40 dark:text-white/80 cursor-not-allowed"
                )}
              >
                {isSubmitting && (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                )}
                Submit
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}

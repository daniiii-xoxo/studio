"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@studio/ui";
import { format } from "date-fns";
import { useQueryClient } from "@tanstack/react-query";
import { updateBooking } from "@/actions/db";
import { useToast } from "@/hooks/use-toast";
import { toJsDate } from "@/lib/utils";
import type { Booking, Ministry, Worker } from "@studio/types";
import { LoaderCircle } from "lucide-react";

interface EditReservationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | any | null;
  ministries: Ministry[];
  workers: Worker[];
}

export function EditReservationDialog({
  isOpen,
  onClose,
  booking,
  ministries,
  workers,
}: EditReservationDialogProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [requesterName, setRequesterName] = useState("");
  const [ministryId, setMinistryId] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (booking) {
      const worker = workers?.find((w) => w.id === booking.workerProfileId);
      const name = worker
        ? `${worker.firstName} ${worker.lastName}`
        : booking.name || "";

      setRequesterName(name);
      setMinistryId(booking.ministryId || "");
      setEmail(worker?.email || booking.email || "");
      setPurpose(booking.purpose || "");
    }
  }, [booking, workers]);

  if (!booking) return null;

  const dateRequested = booking.dateRequested
    ? toJsDate(booking.dateRequested)
    : toJsDate(booking.start);

  const formattedDateRequested = format(dateRequested, "MMM d, yyyy");
  const requestId = booking.requestId || `REQ-${booking.id?.slice(0, 4) || "1000"}`;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateBooking(booking.id, {
        name: requesterName,
        ministryId,
        email,
        purpose,
      });

      await queryClient.invalidateQueries({ queryKey: ["bookings"] });

      toast({
        title: "Reservation Updated",
        description: "The reservation details have been updated successfully.",
      });

      onClose();
    } catch (error: any) {
      console.error("Failed to update booking:", error);
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update reservation.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-6 rounded-2xl bg-white dark:bg-card border shadow-xl">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-xl font-bold font-headline text-gray-900 dark:text-white">
            Edit Reservation
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update the reservation details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          {/* Row 1: Request ID & Date Requested */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Request ID
              </label>
              <Input
                value={requestId}
                disabled
                className="bg-slate-50/90 dark:bg-muted/30 border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 rounded-xl h-10 text-xs font-medium cursor-not-allowed shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Date Requested
              </label>
              <Input
                value={formattedDateRequested}
                disabled
                className="bg-slate-50/90 dark:bg-muted/30 border border-slate-200/80 dark:border-border text-slate-600 dark:text-slate-300 rounded-xl h-10 text-xs font-medium cursor-not-allowed shadow-2xs"
              />
            </div>
          </div>

          {/* Row 2: Requester Name & Ministry */}
          <div className="grid grid-cols-2 gap-3.5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Requester Name
              </label>
              <Input
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                placeholder="Requester Name"
                className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Ministry
              </label>
              <Select value={ministryId} onValueChange={setMinistryId}>
                <SelectTrigger className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all">
                  <SelectValue placeholder="Select Ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministries.map((m) => (
                    <SelectItem key={m.id} value={m.id} className="text-xs">
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 3: Email */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Email
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="bg-background dark:bg-muted/30 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-xl h-10 text-xs font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
            />
          </div>

          {/* Row 4: Purpose of Reservation */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
              Purpose of Reservation
            </label>
            <Textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Describe the event or meeting...."
              className="bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-xl min-h-[100px] p-3 text-xs leading-relaxed text-slate-800 dark:text-slate-100 placeholder:text-slate-400 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
            />
          </div>

          {/* Footer Actions */}
          <DialogFooter className="pt-3 border-t border-slate-100 dark:border-border/60 flex items-center justify-end gap-2.5 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5 h-9 text-xs font-semibold border-slate-200/90 dark:border-border hover:bg-slate-100 dark:hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl px-5 h-9 text-xs font-semibold shadow-xs gap-1.5 cursor-pointer"
            >
              {isSaving && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

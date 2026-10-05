"use client";

import React from "react";
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

interface ExportConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
}

export function ExportConfirmDialog({
  open,
  onOpenChange,
  title = "Export Report?",
  description = "Do you want to export this report as an Excel file (.xlsx) with clean, organized formatting?",
  onConfirm,
}: ExportConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[420px] rounded-2xl border border-border/80 shadow-2xl p-6">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-lg font-bold text-foreground">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2 pt-2">
          <AlertDialogCancel className="rounded-xl px-4 text-xs font-medium cursor-pointer">
            No
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="rounded-xl px-4 text-xs font-semibold bg-sidebar hover:bg-sidebar/90 text-white cursor-pointer"
          >
            Yes
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

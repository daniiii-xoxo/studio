"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
} from "@studio/ui";
import { Trash2 } from "lucide-react";

export interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: React.ReactNode;
  itemName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  variant?: "destructive" | "default" | "primary";
  icon?: React.ReactNode;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete Item",
  description,
  itemName,
  confirmLabel,
  cancelLabel = "Cancel",
  isLoading = false,
  variant = "destructive",
  icon,
}: DeleteConfirmationDialogProps) {
  const isDestructive = variant === "destructive";
  const defaultConfirmLabel = confirmLabel || (isDestructive ? "Delete" : "Confirm");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-sm rounded-2xl p-6 text-center">
        <div
          className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-2 ${
            isDestructive
              ? "bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-400"
              : "bg-primary/10 text-primary"
          }`}
        >
          {icon || <Trash2 className="h-6 w-6" />}
        </div>
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-base font-bold text-center text-foreground font-headline">
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs text-center text-muted-foreground mt-1 leading-relaxed">
            {description ? (
              description
            ) : itemName ? (
              <>
                Are you sure you want to proceed with <strong className="text-foreground font-semibold">{itemName}</strong>? This action cannot be undone.
              </>
            ) : (
              "Are you sure you want to proceed? This action cannot be undone."
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex flex-row gap-2 sm:justify-center mt-4">
          <Button
            type="button"
            variant="outline"
            disabled={isLoading}
            className="flex-1 rounded-xl text-xs h-9 cursor-pointer"
            onClick={onClose}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            className={`flex-1 rounded-xl text-xs h-9 font-bold cursor-pointer ${
              isDestructive
                ? "bg-rose-500 hover:bg-rose-600 text-white"
                : "bg-primary hover:bg-primary/90 text-primary-foreground"
            }`}
            onClick={onConfirm}
          >
            {isLoading ? "Processing..." : defaultConfirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

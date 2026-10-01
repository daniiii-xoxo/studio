"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@studio/ui";
import {
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@studio/ui";
import { Label } from "@studio/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@studio/ui";
import type { Ministry } from "@studio/types";

interface BatchMinistrySheetProps {
  selectedCount: number;
  ministries: Ministry[];
  onSave: (major: string, minor: string) => void;
  onClose: () => void;
}

export function BatchMinistrySheet({
  selectedCount,
  ministries,
  onSave,
  onClose,
}: BatchMinistrySheetProps) {
  const [major, setMajor] = useState("unchanged");
  const [minor, setMinor] = useState("unchanged");

  const groupedMinistries = useMemo(() => {
    const groups: Record<string, Ministry[]> = {};
    ministries.forEach((m) => {
      const dept = m.department || "Other";
      if (!groups[dept]) groups[dept] = [];
      groups[dept].push(m);
    });
    return groups;
  }, [ministries]);

  const MinistrySelect = ({
    value,
    onChange,
    keepLabel,
  }: {
    value: string;
    onChange: (v: string) => void;
    keepLabel: string;
  }) => (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
      <SelectContent>
        <SelectItem value="unchanged">{keepLabel}</SelectItem>
        <SelectItem value="none">Set to None</SelectItem>
        {Object.entries(groupedMinistries).map(([dept, mins]) => (
          <SelectGroup key={dept}>
            <SelectLabel className="text-muted-foreground uppercase text-xs tracking-wider">{dept}</SelectLabel>
            {mins.map((m) => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-headline">Update Ministries</SheetTitle>
        <SheetDescription>
          Select new ministries for {selectedCount} worker(s). Leave blank to keep current assignments, or select "None" to remove them.
        </SheetDescription>
      </SheetHeader>
      <div className="py-4 space-y-4">
        <div className="space-y-2">
          <Label>Ministry</Label>
          <MinistrySelect value={major} onChange={setMajor} keepLabel="Keep current ministry" />
        </div>
      </div>
      <SheetFooter>
        <SheetClose asChild>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </SheetClose>
        <Button onClick={() => onSave(major, minor)}>Apply Changes</Button>
      </SheetFooter>
    </>
  );
}

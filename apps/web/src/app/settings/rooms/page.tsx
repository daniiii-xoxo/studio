
"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@studio/ui";
import {
    Table,
    TableHeader,
    TableRow,
    TableHead,
    TableBody,
    TableCell,
} from "@studio/ui";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@studio/ui";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@studio/ui";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@studio/ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@studio/ui";
import { MoreHorizontal, PlusCircle, LoaderCircle, MapPin, Search, Pencil, Trash2, X, Layers, ArrowLeft, Building, Building2 } from "lucide-react";
import { Label } from "@studio/ui";
import { Input } from "@studio/ui";
import { Checkbox } from "@studio/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel,
} from "@studio/ui";
import type { Room, Branch, Area, VenueElement } from "@studio/types";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/use-user-role";
import { useRooms } from "@/hooks/use-rooms";
import { useVenueElements } from "@/hooks/use-venue-elements";
import { Badge } from "@studio/ui";
import { Textarea } from "@studio/ui";
import { cn } from "@/lib/utils";

// --- Satellite (Branch) Management ---

const BranchForm = ({ branch, onSave, onClose }: { branch: Partial<Branch> | null; onSave: (data: Partial<Branch>) => void; onClose: () => void; }) => {
    const [name, setName] = useState(branch?.name || '');

    return (
        <div className="space-y-6">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:bg-sidebar/25 flex items-center justify-center shrink-0">
                        <Building className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-headline">
                            {branch ? 'Edit Satellite' : 'Add New Satellite'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            {branch ? 'Update satellite campus details and building location.' : 'Register a new physical satellite or campus.'}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="branch-name" className="text-xs font-bold text-foreground">
                            Satellite Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="branch-name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g., Main Campus, North Annex"
                            className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
                        />
                    </div>
                </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-5 text-xs font-semibold">
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave({ ...branch, name })}
                    disabled={!name.trim()}
                    className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs"
                >
                    {branch ? 'Update Satellite' : 'Create Satellite'}
                </Button>
            </DialogFooter>
        </div>
    );
};

const BranchesTab = ({ branches, areas, isLoading, onAdd, onEdit, onDelete }: { branches: Branch[], areas: Area[], isLoading: boolean, onAdd: () => void, onEdit: (loc: Branch) => void, onDelete: (loc: Branch) => void }) => {
    const getAreaCount = (branchId: string) => areas.filter(a => a.branchId === branchId).length;

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Satellites</CardTitle>
                    <CardDescription>Manage physical satellites and buildings.</CardDescription>
                </div>
                <Button onClick={onAdd}><PlusCircle className="mr-2 h-4 w-4" /> Add Satellite</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Areas</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && <TableRow><TableCell colSpan={3} className="text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin" /></TableCell></TableRow>}
                        {branches.map(branch => {
                            const areaCount = getAreaCount(branch.id);
                            return (
                                <TableRow key={branch.id}>
                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                    <TableCell>{areaCount}</TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onEdit(branch), 100)} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onSelect={() => setTimeout(() => onDelete(branch), 100)} disabled={areaCount > 0} className="text-destructive cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 focus:text-destructive focus:bg-destructive/10">
                                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
};



const AreaForm = ({ area, branches, onSave, onClose }: { area: Partial<Area> | null; branches: Branch[]; onSave: (data: Partial<Area>) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState<Partial<Area>>({
        id: area?.id,
        areaId: area?.areaId || '',
        name: area?.name || '',
        branchId: area?.branchId || ''
    });

    return (
        <div className="space-y-6">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:bg-sidebar/25 flex items-center justify-center shrink-0">
                        <Layers className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-headline">
                            {area ? 'Edit Area' : 'Add New Area'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            {area ? 'Modify area details and satellite mapping.' : 'Add a floor, wing, or section to a satellite campus.'}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="area-name" className="text-xs font-bold text-foreground">
                            Area Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="area-name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Second Floor, Youth Wing"
                            className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="area-branch" className="text-xs font-bold text-foreground">
                            Satellite Campus <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.branchId} onValueChange={value => setFormData({ ...formData, branchId: value })}>
                            <SelectTrigger id="area-branch" className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs">
                                <SelectValue placeholder="Select a satellite" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {branches.map(branch => (
                                    <SelectItem key={branch.id} value={branch.id} className="text-xs cursor-pointer">
                                        {branch.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-5 text-xs font-semibold">
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(formData)}
                    disabled={!formData.name?.trim() || !formData.branchId}
                    className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs"
                >
                    {area ? 'Update Area' : 'Create Area'}
                </Button>
            </DialogFooter>
        </div>
    );
};

const AreasTab = ({ areas, branches, rooms, isLoading, onAdd, onEdit, onDelete }: { areas: Area[], branches: Branch[], rooms: Room[], isLoading: boolean, onAdd: () => void, onEdit: (area: Area) => void, onDelete: (area: Area) => void }) => {
    const getBranchName = (branchId: string) => branches.find(b => b.id === branchId)?.name || 'N/A';
    const getRoomCount = (areaId: string) => rooms.filter(r => r.areaId === areaId).length;

    const [search, setSearch] = useState('');

    const filtered = areas.filter(area => {
        const matchesSearch = !search || area.name.toLowerCase().includes(search.toLowerCase()) || (area.areaId || area.id).toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
            {/* Top Toolbar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search areas..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Right Actions & Filters */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">

                    {/* Add Area Button */}
                    <Button
                        type="button"
                        onClick={onAdd}
                        className="bg-sidebar hover:bg-sidebar/90 text-white shadow-xs font-semibold text-xs h-10 px-4 gap-1.5 rounded-2xl shrink-0 transition-colors cursor-pointer"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>Add Area</span>
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card mt-1">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[22%]">AREA ID</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[32%]">NAME</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[24%]">SATELLITE</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-center w-[12%]">ROOMS</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-center w-[10%]">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="py-14 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-14 text-center text-sm text-muted-foreground">No areas found.</TableCell></TableRow>
                            ) : filtered.map(area => {
                                const roomCount = getRoomCount(area.id);
                                return (
                                    <TableRow key={area.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                        <TableCell className="px-5 py-3.5 align-middle">
                                            <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-muted/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-border">
                                                {area.areaId || area.id}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                                                    <Layers className="h-4 w-4" />
                                                </div>
                                                <span className="font-bold text-foreground text-xs sm:text-sm">{area.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 align-middle">
                                            <Badge variant="outline" className="text-[11px] font-semibold bg-slate-100 dark:bg-muted/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border rounded-lg px-2.5 py-0.5">
                                                {getBranchName(area.branchId)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center align-middle">
                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                {roomCount} {roomCount === 1 ? 'room' : 'rooms'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center align-middle">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(area)}
                                                        className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Area
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(area)}
                                                        disabled={roomCount > 0}
                                                        className="text-destructive cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 focus:text-destructive focus:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};




const RoomForm = ({ room, areas, branches, venueElements, onSave, onClose }: { room: Partial<Room> | null; areas: Area[]; branches: Branch[]; venueElements: VenueElement[]; onSave: (data: Partial<Room>) => void; onClose: () => void; }) => {
    const [formData, setFormData] = useState<Partial<Room>>({
        id: room?.id,
        name: room?.name || '',
        capacity: room?.capacity || 0,
        elements: room?.elements || [],
        areaId: room?.areaId || '',
        weight: room?.weight || 0,
    });

    const handleElementChange = (elementId: string, checked: boolean) => {
        setFormData(prev => {
            const currentElements = prev.elements || [];
            if (checked) {
                return { ...prev, elements: [...currentElements, elementId] };
            } else {
                return { ...prev, elements: currentElements.filter(id => id !== elementId) };
            }
        });
    };

    const groupedAreas = useMemo(() => {
        return branches.map(branch => ({
            branchName: branch.name,
            areas: areas.filter(area => area.branchId === branch.id)
        })).filter(group => group.areas.length > 0);
    }, [areas, branches]);

    return (
        <div className="space-y-6">
            <DialogHeader>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sidebar/10 text-sidebar dark:bg-sidebar/25 flex items-center justify-center shrink-0">
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold tracking-tight text-foreground font-headline">
                            {room ? 'Edit Room' : 'Add New Room'}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                            {room ? 'Update room capacity, location, and equipment configuration.' : 'Configure a new room for reservation and scheduling.'}
                        </DialogDescription>
                    </div>
                </div>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
                {/* Basic Details Card */}
                <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="room-name" className="text-xs font-bold text-foreground">
                            Room Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="room-name"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Conference Room A, Main Hall"
                            className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="room-area" className="text-xs font-bold text-foreground">
                            Area / Location <span className="text-destructive">*</span>
                        </Label>
                        <Select value={formData.areaId} onValueChange={value => setFormData({ ...formData, areaId: value })}>
                            <SelectTrigger id="room-area" className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs">
                                <SelectValue placeholder="Select an area" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl max-h-72 overflow-y-auto">
                                {groupedAreas.map(group => (
                                    <SelectGroup key={group.branchName}>
                                        <SelectLabel className="font-bold text-[11px] text-muted-foreground uppercase tracking-wider">{group.branchName}</SelectLabel>
                                        {group.areas.map(area => (
                                            <SelectItem key={area.id} value={area.id} className="text-xs cursor-pointer">
                                                {area.name}
                                            </SelectItem>
                                        ))}
                                    </SelectGroup>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="room-capacity" className="text-xs font-bold text-foreground">
                                Seating Capacity <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="room-capacity"
                                type="number"
                                min={0}
                                value={formData.capacity}
                                onChange={e => setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })}
                                className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="room-weight" className="text-xs font-bold text-foreground">
                                Weight (Sort Priority)
                            </Label>
                            <Input
                                id="room-weight"
                                type="number"
                                value={formData.weight}
                                onChange={e => setFormData({ ...formData, weight: parseInt(e.target.value, 10) || 0 })}
                                placeholder="0"
                                className="h-10 text-xs rounded-xl border-slate-200/90 dark:border-border bg-background shadow-2xs"
                            />
                        </div>
                    </div>
                </div>

                {/* Venue Elements Card */}
                <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-foreground">
                            Included Venue Elements / Amenities
                        </Label>
                        <Badge variant="outline" className="text-[10px] font-semibold">
                            {formData.elements?.length || 0} selected
                        </Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                        {venueElements.map(item => {
                            const isChecked = formData.elements?.includes(item.id);
                            return (
                                <label
                                    key={item.id}
                                    htmlFor={`elem-${item.id}`}
                                    className={cn(
                                        "flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-xs",
                                        isChecked
                                            ? "bg-primary/5 border-primary/40 text-foreground font-semibold shadow-2xs"
                                            : "bg-background border-slate-200/80 dark:border-border text-muted-foreground hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id={`elem-${item.id}`}
                                            checked={isChecked}
                                            onCheckedChange={(checked) => handleElementChange(item.id, !!checked)}
                                            className="rounded-md"
                                        />
                                        <span className="truncate max-w-[140px]">{item.name}</span>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0">
                                        {item.category}
                                    </Badge>
                                </label>
                            );
                        })}
                    </div>
                </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={onClose} className="rounded-xl h-10 px-5 text-xs font-semibold">
                    Cancel
                </Button>
                <Button
                    onClick={() => onSave(formData)}
                    disabled={!formData.name?.trim() || !formData.areaId}
                    className="bg-sidebar hover:bg-sidebar/90 text-white rounded-xl h-10 px-5 text-xs font-bold shadow-xs"
                >
                    {room ? 'Update Room' : 'Create Room'}
                </Button>
            </DialogFooter>
        </div>
    );
};

const RoomsTab = ({ rooms, areas, branches, venueElements, isLoading, onAdd, onEdit, onDelete }: { rooms: Room[], areas: Area[], branches: Branch[], venueElements: VenueElement[], isLoading: boolean, onAdd: () => void, onEdit: (room: Room) => void, onDelete: (room: Room) => void }) => {
    const getAreaAndBranch = (areaIdValue: string) => {
        const area = areas.find(a => a.id === areaIdValue);
        if (!area) return { areaName: 'N/A', branchName: 'N/A' };
        const branch = branches.find(b => b.id === area.branchId);
        return { areaName: area.name, branchName: branch ? branch.name : 'N/A' };
    };

    const [search, setSearch] = useState('');
    const [areaFilter, setAreaFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const filtered = rooms.filter(room => {
        const matchesSearch = !search || room.name.toLowerCase().includes(search.toLowerCase());
        const matchesArea = areaFilter === 'all' || room.areaId === areaFilter;
        const roomStatus = (room as any).status || 'Active';
        const matchesStatus = statusFilter === 'all' || roomStatus === statusFilter;
        return matchesSearch && matchesArea && matchesStatus;
    });

    return (
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
            {/* Top Toolbar Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] sm:max-w-xs">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    <Input
                        type="text"
                        placeholder="Search rooms..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                    />
                    {search && (
                        <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>

                {/* Right Actions & Filters */}
                <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Area Filter */}
                    <Select value={areaFilter} onValueChange={setAreaFilter}>
                        <SelectTrigger className="h-10 w-[140px] sm:w-40 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                            <SelectValue placeholder="All Areas" />
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                            <SelectItem value="all" className="text-xs font-semibold text-primary cursor-pointer">
                                All Areas
                            </SelectItem>
                            {areas.map(a => (
                                <SelectItem key={a.id} value={a.id} className="text-xs cursor-pointer">
                                    {a.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="h-10 w-[130px] sm:w-36 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                            <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all" className="text-xs cursor-pointer">All Statuses</SelectItem>
                            <SelectItem value="Active" className="text-xs cursor-pointer">Active</SelectItem>
                            <SelectItem value="Maintenance" className="text-xs cursor-pointer">Maintenance</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Add Room Button */}
                    <Button
                        type="button"
                        onClick={onAdd}
                        className="bg-sidebar hover:bg-sidebar/90 text-white shadow-xs font-semibold text-xs h-10 px-4 gap-1.5 rounded-2xl shrink-0 transition-colors cursor-pointer"
                    >
                        <PlusCircle className="h-4 w-4" />
                        <span>Add Room</span>
                    </Button>
                </div>
            </div>

            {/* Table Container */}
            <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card mt-1">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[28%]">NAME</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[24%]">LOCATION</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-center w-[16%]">CAPACITY</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-center w-[16%]">STATUS</TableHead>
                                <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-center w-[16%]">ACTIONS</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow><TableCell colSpan={5} className="py-14 text-center"><LoaderCircle className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow><TableCell colSpan={5} className="py-14 text-center text-sm text-muted-foreground">No rooms found.</TableCell></TableRow>
                            ) : filtered.map(room => {
                                const { areaName, branchName } = getAreaAndBranch(room.areaId);
                                const status = (room as any).status || 'Active';
                                const isMaintenance = status === 'Maintenance';
                                return (
                                    <TableRow key={room.id} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                                        <TableCell className="px-5 py-3.5 align-middle">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-xs sm:text-sm leading-tight">{room.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{branchName !== 'N/A' ? branchName : 'Main Campus'}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 align-middle">
                                            <Badge variant="outline" className="text-[11px] font-semibold bg-slate-100 dark:bg-muted/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border rounded-lg px-2.5 py-0.5">
                                                {areaName}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center align-middle">
                                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                {room.capacity} seats
                                            </span>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center align-middle">
                                            <Badge
                                                variant="secondary"
                                                className={cn(
                                                    "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1.5",
                                                    isMaintenance
                                                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                                )}
                                            >
                                                <span className={cn("w-1.5 h-1.5 rounded-full", isMaintenance ? "bg-amber-500" : "bg-emerald-500")} />
                                                {status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="px-5 py-3.5 text-center align-middle">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        type="button"
                                                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                                    <DropdownMenuItem
                                                        onClick={() => onEdit(room)}
                                                        className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Room
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onDelete(room)}
                                                        className="text-destructive cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 focus:text-destructive focus:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export default function RoomManagementPage() {
    const { canManageFacilities, isLoading: isRoleLoading } = useUserRole();
    const { toast } = useToast();

    // SQL Hooks
    const {
        rooms, areas, branches, isLoading: roomsDataLoading,
        createRoom, updateRoom, deleteRoom, createRooms,
        createArea, updateArea, deleteArea, createAreas,
        createBranch, updateBranch, deleteBranch
    } = useRooms();
    const { venueElements, isLoading: venueElementsLoading } = useVenueElements();

    // State for forms and dialogs
    const [isBranchSheetOpen, setIsBranchSheetOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

    const [isAreaSheetOpen, setIsAreaSheetOpen] = useState(false);
    const [selectedArea, setSelectedArea] = useState<Area | null>(null);
    const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);

    const [isRoomSheetOpen, setIsRoomSheetOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [roomToDelete, setRoomToDelete] = useState<Room | null>(null);
    const [activeTab, setActiveTab] = useState<'rooms' | 'areas'>('rooms');

    const isLoading = roomsDataLoading || isRoleLoading || venueElementsLoading;

    // --- Branch Handlers ---
    const handleSaveBranch = async (data: Partial<Branch>) => {
        try {
            if (data.id) {
                await updateBranch({ id: data.id, data });
                toast({ title: 'Satellite Updated' });
            } else {
                const customId = `B-${data.name!.trim().replace(/\s+/g, ' ')}`;
                await createBranch({ ...data, id: customId });
                toast({ title: 'Satellite Added' });
            }
            setIsBranchSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save satellite.' });
        }
    };

    const handleDeleteBranch = async () => {
        if (!branchToDelete) return;
        try {
            await deleteBranch(branchToDelete.id);
            toast({ title: 'Satellite Deleted' });
            setBranchToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete satellite.' });
        }
    };

    // --- Area Handlers ---
    const handleSaveArea = async (data: Partial<Area>) => {
        try {
            if (data.id) {
                await updateArea({ id: data.id, data });
                toast({ title: 'Area Updated' });
            } else {
                if (!data.name || !data.branchId) {
                    toast({ variant: 'destructive', title: 'Missing Fields', description: 'Please fill out Name and Satellite.' });
                    return;
                }
                const branchName = branches?.find(b => b.id === data.branchId)?.name || 'X';
                const branchInitial = branchName.charAt(0).toUpperCase();
                const customId = `${branchInitial}-${data.name!.trim()}`;

                await createArea({
                    ...data,
                    id: customId,
                    areaId: customId
                });
                toast({ title: 'Area Added' });
            }
            setIsAreaSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save area.' });
        }
    };



    const handleDeleteArea = async () => {
        if (!areaToDelete) return;
        try {
            await deleteArea(areaToDelete.id);
            toast({ title: 'Area Deleted' });
            setAreaToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete area.' });
        }
    };




    const handleSaveRoom = async (data: Partial<Room>) => {
        try {
            if (data.id) {
                await updateRoom({ id: data.id, data });
                toast({ title: 'Room Updated' });
            } else {
                const area = areas?.find(a => a.id === data.areaId);
                const areaName = area?.name || 'X';
                const areaInitial = areaName.charAt(0).toUpperCase();
                const customId = `${areaInitial}-${data.name!.trim()}`;

                await createRoom({
                    ...data,
                    id: customId
                });
                toast({ title: 'Room Added' });
            }
            setIsRoomSheetOpen(false);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Save Failed', description: 'Could not save room.' });
        }
    };

    const handleDeleteRoom = async () => {
        if (!roomToDelete) return;
        try {
            await deleteRoom(roomToDelete.id);
            toast({ title: 'Room Deleted' });
            setRoomToDelete(null);
        } catch (error) {
            toast({ variant: 'destructive', title: 'Delete Failed', description: 'Could not delete room.' });
        }
    };

    if (isLoading) {
        return <AppLayout><div className="flex justify-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div></AppLayout>;
    }

    if (!canManageFacilities) {
        return <AppLayout><Card><CardHeader><CardTitle>Access Denied</CardTitle><CardDescription>You do not have permission to view this page.</CardDescription></CardHeader></Card></AppLayout>;
    }

    return (
        <AppLayout>
            <div className="space-y-7 pb-12 w-full">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
                            Facilities Management
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Rooms, areas and satellite campuses in one place.
                        </p>
                    </div>
                    <Link
                        href="/settings"
                        className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border/60 bg-white dark:bg-card text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors shrink-0 shadow-2xs self-start sm:self-auto"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Link>
                </div>

                <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Segmented Tab Selector (Right aligned) */}
                <div className="flex items-center justify-end w-full -mb-5">
                    <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-muted p-1 rounded-xl border border-slate-200/70 dark:border-border/50 shadow-2xs w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab('rooms')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${activeTab === 'rooms' ? 'bg-sidebar text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground'}`}
                        >
                            <span>Rooms</span>
                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${activeTab === 'rooms' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                {rooms?.length ?? 0}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('areas')}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 ${activeTab === 'areas' ? 'bg-sidebar text-white shadow-xs' : 'text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground'}`}
                        >
                            <span>Areas</span>
                            <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${activeTab === 'areas' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'}`}>
                                {areas?.length ?? 0}
                            </span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                {activeTab === 'rooms' && (
                    <RoomsTab
                        rooms={[...(rooms || [])].sort((a, b) => { const wa = a.weight ?? 0, wb = b.weight ?? 0; return wa !== wb ? wa - wb : a.name.localeCompare(b.name); })}
                        areas={areas || []}
                        branches={branches || []}
                        venueElements={venueElements || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedRoom(null); setIsRoomSheetOpen(true); }}
                        onEdit={(room) => { setSelectedRoom(room); setIsRoomSheetOpen(true); }}
                        onDelete={(room) => setRoomToDelete(room)}
                    />
                )}
                {activeTab === 'areas' && (
                    <AreasTab
                        areas={areas || []}
                        branches={branches || []}
                        rooms={rooms || []}
                        isLoading={isLoading}
                        onAdd={() => { setSelectedArea(null); setIsAreaSheetOpen(true); }}
                        onEdit={(area) => { setSelectedArea(area); setIsAreaSheetOpen(true); }}
                        onDelete={(area) => setAreaToDelete(area)}
                    />
                )}
                </div>
            </div>

            {/* Dialogs for Add/Edit/Import */}
            <Dialog open={isBranchSheetOpen} onOpenChange={setIsBranchSheetOpen}>
                <DialogContent className="sm:max-w-lg p-6 sm:p-7 rounded-2xl border-border/80 shadow-2xl">
                    <BranchForm branch={selectedBranch} onSave={handleSaveBranch} onClose={() => setIsBranchSheetOpen(false)} />
                </DialogContent>
            </Dialog>
            <Dialog open={isAreaSheetOpen} onOpenChange={setIsAreaSheetOpen}>
                <DialogContent className="sm:max-w-lg p-6 sm:p-7 rounded-2xl border-border/80 shadow-2xl">
                    <AreaForm area={selectedArea} branches={branches || []} onSave={handleSaveArea} onClose={() => setIsAreaSheetOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={isRoomSheetOpen} onOpenChange={setIsRoomSheetOpen}>
                <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 sm:p-7 rounded-2xl border-border/80 shadow-2xl">
                    <RoomForm
                        room={selectedRoom}
                        areas={areas || []}
                        branches={branches || []}
                        venueElements={venueElements || []}
                        onSave={handleSaveRoom}
                        onClose={() => setIsRoomSheetOpen(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Delete Dialogs */}
            <AlertDialog open={!!branchToDelete} onOpenChange={(open) => !open && setBranchToDelete(null)}>
                <AlertDialogContent className="rounded-2xl p-6 border-border/80 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the satellite <span className="font-bold">{branchToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteBranch} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!areaToDelete} onOpenChange={(open) => !open && setAreaToDelete(null)}>
                <AlertDialogContent className="rounded-2xl p-6 border-border/80 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the area <span className="font-bold">{areaToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteArea} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <AlertDialog open={!!roomToDelete} onOpenChange={(open) => !open && setRoomToDelete(null)}>
                <AlertDialogContent className="rounded-2xl p-6 border-border/80 shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the room <span className="font-bold">{roomToDelete?.name}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteRoom} className="bg-destructive hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </AppLayout>
    );
}

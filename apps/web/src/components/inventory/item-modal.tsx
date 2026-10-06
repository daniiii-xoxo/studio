"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Checkbox,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Badge,
} from '@studio/ui';
import {
  Boxes,
  Package,
  Barcode,
  Tag,
  Layers,
  MapPin,
  User,
  Calendar,
  ShieldCheck,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  FolderTree,
  Sparkles,
  CheckCircle2,
  X,
  UploadCloud,
  Trash2,
  Camera,
} from 'lucide-react';
import { useInventory, type InventoryItem } from '@/hooks/use-inventory';
import { cn } from '@/lib/utils';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item?: InventoryItem | null;
  onSaved?: () => void;
}

export function ItemModal({ isOpen, onClose, item, onSaved }: ItemModalProps) {
  const { categories, locations, fetchCategories, fetchLocations, createItem, updateItem } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    categoryId: '',
    type: 'EQUIPMENT',
    stock: 0,
    minStock: 0,
    unit: 'pcs',
    status: 'Good Condition',
    statusDetails: '',
    location: '',
    inventoryCode: '',
    imageUrl: '',
    isKit: false,
    isApprovalRequired: false,
    nextMaintenanceDate: '',
    aisle: '',
    shelf: '',
    bin: '',
    assignedTo: '',
    parentId: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setError('Image file exceeds 15MB limit.');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    setError('');

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.85);
            setFormData((prev) => ({ ...prev, imageUrl: compressed }));
          } else {
            setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
          }
          setIsUploadingImage(false);
        };
        img.onerror = () => {
          setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
          setIsUploadingImage(false);
        };
        img.src = reader.result;
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      fetchLocations();
    }
  }, [isOpen, fetchCategories, fetchLocations]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        categoryId: item.categoryId || (categories[0]?.id ?? ''),
        type: item.type || 'EQUIPMENT',
        stock: item.stock ?? item.quantity ?? 0,
        minStock: item.minStock ?? item.minQuantity ?? 0,
        unit: item.unit || 'pcs',
        status: item.status || 'Good Condition',
        statusDetails: item.statusDetails || '',
        location: item.location || '',
        inventoryCode: item.inventoryCode || '',
        imageUrl: item.imageUrl || '',
        isKit: item.isKit || item.group === 'Kit' || false,
        isApprovalRequired: item.isApprovalRequired || false,
        nextMaintenanceDate: item.nextMaintenanceDate
          ? new Date(item.nextMaintenanceDate).toISOString().split('T')[0]
          : '',
        aisle: item.aisle || '',
        shelf: item.shelf || '',
        bin: item.bin || '',
        assignedTo: item.assignedTo || '',
        parentId: item.parentId || '',
      });
    } else {
      setFormData({
        name: '',
        categoryId: categories[0]?.id || '',
        type: 'EQUIPMENT',
        stock: 0,
        minStock: 0,
        unit: 'pcs',
        status: 'Good Condition',
        statusDetails: '',
        location: '',
        inventoryCode: '',
        imageUrl: '',
        isKit: false,
        isApprovalRequired: false,
        nextMaintenanceDate: '',
        aisle: '',
        shelf: '',
        bin: '',
        assignedTo: '',
        parentId: '',
      });
    }
    setError('');
  }, [item, isOpen, categories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Item name is required');
      return;
    }
    if (!formData.categoryId) {
      setError('Please select a category');
      return;
    }
    if (formData.stock !== undefined && formData.stock < 0) {
      setError('Current stock cannot be negative');
      return;
    }
    if (formData.minStock !== undefined && formData.minStock < 0) {
      setError('Minimum stock alert threshold cannot be negative');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (item?.id) {
        await updateItem(item.id, formData);
      } else {
        await createItem(formData);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-w-2xl max-h-[92dvh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-2xl md:rounded-3xl border-border/80 shadow-2xl gap-0 bg-background [&>button:last-child]:hidden"
        style={{
          width: "min(calc(100vw - 1rem), 46rem)",
          maxHeight: "min(calc(100dvh - 1.5rem), 92vh)",
        }}
      >
        {/* ── STICKY MODAL HEADER ── */}
        <DialogHeader className="p-3.5 sm:p-5 pb-3 sm:pb-4 border-b border-border/70 bg-card shrink-0 text-left space-y-0 w-full min-w-0">
          <div className="flex items-start justify-between gap-2.5 w-full min-w-0">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                <Boxes className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-0.5">
                <DialogTitle className="text-sm sm:text-base font-bold font-headline tracking-tight text-foreground flex items-center gap-1.5 sm:gap-2 flex-wrap min-w-0">
                  <span className="font-mono text-sm sm:text-base font-bold text-foreground break-all">
                    {item ? (item.inventoryCode || item.name) : 'Add New Item'}
                  </span>
                  {item?.status && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap shadow-2xs border shrink-0",
                        item.status === "Good Condition"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                          : item.status === "Low Stock"
                          ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                          : "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                      )}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full shrink-0",
                          item.status === "Good Condition"
                            ? "bg-emerald-500"
                            : item.status === "Low Stock"
                            ? "bg-amber-500 animate-pulse"
                            : "bg-rose-500"
                        )}
                      />
                      {item.status}
                    </span>
                  )}
                </DialogTitle>
                {item?.name && item?.inventoryCode && (
                  <p className="text-xs sm:text-sm font-semibold text-foreground/90 break-words leading-tight">
                    {item.name}
                  </p>
                )}
                <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground break-words leading-tight">
                  {item
                    ? 'Update specifications, stock levels, location placement, and PMS status.'
                    : 'Register a new equipment or consumable record into the catalog.'}
                </DialogDescription>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer shrink-0 -mt-1 -mr-1"
              title="Close modal"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {/* ── FORM CONTENT ── */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden w-full">
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-5 w-full min-w-0">
            {error && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span className="break-words">{error}</span>
              </div>
            )}

            {/* 1. Item Specifications */}
            <div className="space-y-3 sm:space-y-3.5 w-full min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-headline">
                  Item Specifications
                </span>
              </div>

              {/* Row 1: Item Name & Item Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="item-name" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span>Item Name</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="item-name"
                    required
                    placeholder="e.g. Chauvet DJ SlimPAR Pro LED"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 text-foreground font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="item-code" className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span>Item Code / Barcode</span>
                  </Label>
                  <div className="relative w-full min-w-0">
                    <Barcode className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="item-code"
                      placeholder="Auto-generated if empty"
                      value={formData.inventoryCode}
                      onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
                      className="w-full min-w-0 pl-10 min-h-[2.5rem] h-10 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Category & Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span>Category</span>
                    <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={formData.categoryId || ''}
                    onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                  >
                    <SelectTrigger className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 text-foreground font-medium hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar">
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <Tag className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-left flex-1 min-w-0">
                          <SelectValue placeholder="Select Category..." />
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                    <span>Type</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                  >
                    <SelectTrigger className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 text-foreground font-medium hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar">
                      <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                        <Layers className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="truncate text-left flex-1 min-w-0">
                          <SelectValue placeholder="Select Type..." />
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                      <SelectItem value="EQUIPMENT" className="text-xs sm:text-sm">
                        Equipment (Tracked &amp; Borrowable)
                      </SelectItem>
                      <SelectItem value="CONSUMABLE" className="text-xs sm:text-sm">
                        Consumable (Stock tracked only)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 2. Stock & Condition Section */}
            <div className="space-y-3 sm:space-y-3.5 pt-1 border-t border-border/50 w-full min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground font-headline">
                  Stock &amp; Condition
                </span>
              </div>

              {/* Row 1: Stock, Min Stock, Unit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3.5 w-full min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="current-stock" className="text-xs font-semibold text-muted-foreground">
                    Current Stock
                  </Label>
                  <Input
                    id="current-stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 font-medium text-foreground focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="min-stock" className="text-xs font-semibold text-muted-foreground">
                    Min Stock Alert
                  </Label>
                  <Input
                    id="min-stock"
                    type="number"
                    min="0"
                    value={formData.minStock}
                    onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 font-medium text-foreground focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                  />
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="unit" className="text-xs font-semibold text-muted-foreground">
                    Unit
                  </Label>
                  <Input
                    id="unit"
                    placeholder="pcs, box, roll"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 font-medium text-foreground focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Condition / Status & Next Maintenance */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label className="text-xs font-semibold text-muted-foreground">
                    Condition / Status
                  </Label>
                  <Select
                    value={formData.status}
                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                  >
                    <SelectTrigger className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 text-foreground font-medium hover:bg-muted/50 transition-colors focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar">
                      <span className="truncate text-left flex-1 min-w-0">
                        <SelectValue placeholder="Select Status..." />
                      </span>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                      <SelectItem value="Good Condition" className="text-xs sm:text-sm font-medium">Good Condition</SelectItem>
                      <SelectItem value="Low Stock" className="text-xs sm:text-sm font-medium">Low Stock</SelectItem>
                      <SelectItem value="Out of Stock" className="text-xs sm:text-sm font-medium">Out of Stock</SelectItem>
                      <SelectItem value="Under Maintenance" className="text-xs sm:text-sm font-medium">Under Maintenance</SelectItem>
                      <SelectItem value="Damaged" className="text-xs sm:text-sm font-medium">Damaged</SelectItem>
                      <SelectItem value="Borrowed" className="text-xs sm:text-sm font-medium">Borrowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="maintenance-date" className="text-xs font-semibold text-muted-foreground">
                    Next Maintenance (PMS)
                  </Label>
                  <div className="relative w-full min-w-0">
                    <Input
                      id="maintenance-date"
                      type="date"
                      value={formData.nextMaintenanceDate}
                      onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                      className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-muted/30 border border-border/70 text-foreground font-medium focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Location & Placement Card (matching LOCATION & VENUE style) */}
            <div className="rounded-2xl border border-border/70 bg-card/60 p-3.5 sm:p-4 space-y-3 sm:space-y-3.5 shadow-2xs w-full min-w-0">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-lg bg-primary/10 text-primary">
                  <MapPin className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-foreground font-headline">
                  Location &amp; Placement
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5 w-full min-w-0">
                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="loc-area" className="text-xs font-semibold text-muted-foreground">Location Area / Room</Label>
                  <Input
                    id="loc-area"
                    placeholder="e.g. 4th Floor Studio"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    list="locations-list"
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-3 text-xs sm:text-sm rounded-xl bg-background border border-border/70 text-foreground font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                  />
                  <datalist id="locations-list">
                    {locations.map((l) => (
                      <option key={l.id} value={l.name} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-1.5 min-w-0">
                  <Label htmlFor="assigned-custodian" className="text-xs font-semibold text-muted-foreground">Assigned Custodian / Person</Label>
                  <div className="relative w-full min-w-0">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="assigned-custodian"
                      placeholder="e.g. Tech Head"
                      value={formData.assignedTo}
                      onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                      className="w-full min-w-0 pl-10 min-h-[2.5rem] h-10 text-xs sm:text-sm rounded-xl bg-background border border-border/70 text-foreground font-medium shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3.5 pt-1 w-full min-w-0">
                <div className="space-y-1 min-w-0">
                  <Label htmlFor="loc-aisle" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center block truncate">Aisle</Label>
                  <Input
                    id="loc-aisle"
                    placeholder="A-1"
                    value={formData.aisle}
                    onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/70 text-center font-medium text-foreground shadow-2xs"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <Label htmlFor="loc-shelf" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center block truncate">Shelf</Label>
                  <Input
                    id="loc-shelf"
                    placeholder="S-2"
                    value={formData.shelf}
                    onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/70 text-center font-medium text-foreground shadow-2xs"
                  />
                </div>

                <div className="space-y-1 min-w-0">
                  <Label htmlFor="loc-bin" className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center block truncate">Bin</Label>
                  <Input
                    id="loc-bin"
                    placeholder="B-04"
                    value={formData.bin}
                    onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                    className="w-full min-w-0 min-h-[2.5rem] h-10 px-1.5 text-xs sm:text-sm rounded-xl bg-background border border-border/70 text-center font-medium text-foreground shadow-2xs"
                  />
                </div>
              </div>
            </div>

            {/* 4. Photo & Attributes */}
            <div className="space-y-3 sm:space-y-3.5 pt-1 border-t border-border/50 w-full min-w-0">
              <div className="space-y-2 w-full min-w-0">
                <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="h-4 w-4 text-primary" />
                  <span>Item Photo (Optional)</span>
                </Label>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />

                {formData.imageUrl ? (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-muted/40 border border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs w-full min-w-0">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={formData.imageUrl}
                        alt="Item Preview"
                        className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl object-cover border border-border shrink-0 shadow-2xs"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <div className="text-xs min-w-0 flex-1">
                        <p className="font-semibold text-foreground break-words">Photo Attached</p>
                        <p className="text-[10px] sm:text-[11px] text-muted-foreground break-words">Ready to save with item</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingImage}
                        className="min-h-[2rem] h-8 px-2.5 sm:px-3 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer border-border/80 hover:bg-muted/50"
                      >
                        <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>Change</span>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        disabled={isUploadingImage}
                        className="min-h-[2rem] h-8 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer px-2 sm:px-2.5"
                        title="Remove photo"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="w-full flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
                  >
                    <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      {isUploadingImage ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                    </div>
                    <p className="text-xs font-bold text-foreground">
                      {isUploadingImage ? "Processing photo..." : "Click to upload item photo"}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                      PNG, JPG, WEBP, or GIF (max. 15MB)
                    </p>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 pt-1 w-full min-w-0">
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors cursor-pointer shadow-2xs">
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={formData.isKit}
                    onCheckedChange={(c) => setFormData({ ...formData, isKit: Boolean(c) })}
                  />
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-bold text-foreground">Kit / Bundle</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">Check out child items together</p>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors cursor-pointer shadow-2xs">
                  <Checkbox
                    className="mt-0.5 shrink-0"
                    checked={formData.isApprovalRequired}
                    onCheckedChange={(c) => setFormData({ ...formData, isApprovalRequired: Boolean(c) })}
                  />
                  <div className="text-xs min-w-0 flex-1">
                    <p className="font-bold text-foreground">Requires Approval</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-normal">Needs manager check before release</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ── STICKY MODAL FOOTER ── */}
          <DialogFooter className="p-3.5 sm:p-5 border-t border-border/70 bg-card/95 backdrop-blur-md shrink-0 flex flex-row items-center justify-end gap-2 sm:gap-2.5 w-full min-w-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="min-h-[2.25rem] sm:min-h-[2.5rem] h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm font-semibold rounded-xl border-border/80 hover:bg-muted/50 cursor-pointer flex-1 sm:flex-initial"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="min-h-[2.25rem] sm:min-h-[2.5rem] h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-bold rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs cursor-pointer flex-1 sm:flex-initial"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  Saving...
                </>
              ) : item ? (
                'Update Item'
              ) : (
                'Add Item'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

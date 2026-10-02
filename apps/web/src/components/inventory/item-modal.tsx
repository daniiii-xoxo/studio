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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl gap-0 border-border/80 shadow-2xl">
        {/* ── MODAL HEADER ── */}
        <DialogHeader className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg font-bold font-headline tracking-tight text-foreground flex items-center gap-2">
                  <span className="truncate">{item ? 'Edit Item' : 'Add New Item'}</span>
                  {item?.inventoryCode && (
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/70 shrink-0">
                      {item.inventoryCode}
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate">
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. General Info Card */}
          <div className="space-y-3.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-headline">
                Item Specifications
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Item Name</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. Shure SM58 Microphone"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Item Code / Barcode</span>
                </Label>
                <div className="relative">
                  <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Auto-generated if empty"
                    value={formData.inventoryCode}
                    onChange={(e) => setFormData({ ...formData, inventoryCode: e.target.value })}
                    className="pl-9 h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background font-mono transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <span>Category</span>
                  <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.categoryId || ''}
                  onValueChange={(val) => setFormData({ ...formData, categoryId: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Tag className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Select Category..." className="truncate text-left" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) => setFormData({ ...formData, type: val as any })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Select Type..." className="truncate text-left" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                    <SelectItem value="EQUIPMENT" className="text-xs">
                      Equipment (Tracked &amp; Borrowable)
                    </SelectItem>
                    <SelectItem value="CONSUMABLE" className="text-xs">
                      Consumable (Stock tracked only)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* 2. Stock & Health Section */}
          <div className="space-y-3.5 pt-1 border-t border-border/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-headline">
                Stock &amp; Condition
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Current Stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value, 10) || 0 })}
                  className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Min Stock Alert</Label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: parseInt(e.target.value, 10) || 0 })}
                  className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Unit</Label>
                <Input
                  placeholder="pcs, box, roll"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Condition / Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 hover:bg-muted/50 transition-colors">
                    <SelectValue placeholder="Select Status..." className="truncate text-left" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl w-[var(--radix-popover-trigger-width)]">
                    <SelectItem value="Good Condition" className="text-xs font-medium">Good Condition</SelectItem>
                    <SelectItem value="Low Stock" className="text-xs font-medium">Low Stock</SelectItem>
                    <SelectItem value="Out of Stock" className="text-xs font-medium">Out of Stock</SelectItem>
                    <SelectItem value="Under Maintenance" className="text-xs font-medium">Under Maintenance</SelectItem>
                    <SelectItem value="Damaged" className="text-xs font-medium">Damaged</SelectItem>
                    <SelectItem value="Borrowed" className="text-xs font-medium">Borrowed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-foreground">Next Maintenance (PMS)</Label>
                <div className="relative">
                  <Input
                    type="date"
                    value={formData.nextMaintenanceDate}
                    onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 3. Location & Placement Box */}
          <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-foreground font-headline">
                Location &amp; Placement
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">Location Area / Room</Label>
                <Input
                  placeholder="e.g. 4th Floor Studio"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  list="locations-list"
                  className="h-8.5 text-xs rounded-xl bg-background border-border/70"
                />
                <datalist id="locations-list">
                  {locations.map((l) => (
                    <option key={l.id} value={l.name} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground">Assigned Custodian / Person</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="e.g. Tech Head"
                    value={formData.assignedTo}
                    onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                    className="pl-9 h-8.5 text-xs rounded-xl bg-background border-border/70"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Aisle</Label>
                <Input
                  placeholder="A-1"
                  value={formData.aisle}
                  onChange={(e) => setFormData({ ...formData, aisle: e.target.value })}
                  className="h-8 text-xs rounded-lg bg-background border-border/70 font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Shelf</Label>
                <Input
                  placeholder="S-2"
                  value={formData.shelf}
                  onChange={(e) => setFormData({ ...formData, shelf: e.target.value })}
                  className="h-8 text-xs rounded-lg bg-background border-border/70 font-mono text-center"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Bin</Label>
                <Input
                  placeholder="B-04"
                  value={formData.bin}
                  onChange={(e) => setFormData({ ...formData, bin: e.target.value })}
                  className="h-8 text-xs rounded-lg bg-background border-border/70 font-mono text-center"
                />
              </div>
            </div>
          </div>

          {/* 4. Image & Options */}
          <div className="space-y-3.5">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />
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
                <div className="p-3 rounded-2xl bg-muted/40 border border-border/70 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={formData.imageUrl}
                      alt="Item Preview"
                      className="h-14 w-14 rounded-xl object-cover border border-border shrink-0 shadow-2xs"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="text-xs min-w-0">
                      <p className="font-semibold text-foreground truncate">Photo Attached</p>
                      <p className="text-[11px] text-muted-foreground">Ready to save with item</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingImage}
                      className="h-8 text-xs font-semibold rounded-xl gap-1.5 cursor-pointer"
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
                      className="h-8 text-xs font-semibold rounded-xl text-destructive hover:bg-destructive/10 cursor-pointer px-2.5"
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
                  className="w-full flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40 transition-all cursor-pointer group"
                >
                  <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                    {isUploadingImage ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <UploadCloud className="h-5 w-5" />
                    )}
                  </div>
                  <p className="text-xs font-bold text-foreground">
                    {isUploadingImage ? "Processing photo..." : "Click to upload item photo"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    PNG, JPG, WEBP, or GIF (max. 15MB)
                  </p>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors cursor-pointer shadow-2xs">
                <Checkbox
                  checked={formData.isKit}
                  onCheckedChange={(c) => setFormData({ ...formData, isKit: Boolean(c) })}
                />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Kit / Bundle</p>
                  <p className="text-[10px] text-muted-foreground">Check out child items together</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-xl border border-border/70 bg-card hover:bg-muted/30 transition-colors cursor-pointer shadow-2xs">
                <Checkbox
                  checked={formData.isApprovalRequired}
                  onCheckedChange={(c) => setFormData({ ...formData, isApprovalRequired: Boolean(c) })}
                />
                <div className="text-xs">
                  <p className="font-bold text-foreground">Requires Approval</p>
                  <p className="text-[10px] text-muted-foreground">Needs manager check before release</p>
                </div>
              </label>
            </div>
          </div>

          {/* ── MODAL FOOTER ── */}
          <DialogFooter className="pt-4 border-t border-border/70 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-9 px-4 text-xs font-semibold rounded-xl border-border/80 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="h-9 px-5 text-xs font-bold rounded-xl bg-sidebar hover:bg-sidebar/90 text-white shadow-xs cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
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

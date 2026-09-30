"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Plus,
  QrCode,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  ArrowUpCircle,
  ArrowDownCircle,
  RefreshCw,
  FileSpreadsheet,
  Download,
  Filter,
  X,
  Eye,
  Info,
  ArrowLeftRight,
  SlidersHorizontal,
  Check,
  ShieldCheck,
  Tag,
  AlertCircle,
  MoreHorizontal,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Button,
  Input,
  Badge,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Checkbox,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@studio/ui';
import { useInventory, type InventoryBorrowing } from '@/hooks/use-inventory';
import { useWorkers } from '@/hooks/use-workers';
import { useToast } from '@/hooks/use-toast';
import { QRModal } from './qr-modal';
import { cn } from '@/lib/utils';
import Papa from 'papaparse';

export function BorrowingsPanel() {
  const { borrowings, totalBorrowings, loading, fetchBorrowings, items, fetchItems } = useInventory();
  const { workers } = useWorkers({ limit: 99999 });
  const { toast } = useToast();

  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [skip, setSkip] = useState(0);
  const take = 10;

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItemId, setCheckoutItemId] = useState('');
  const [checkoutWorkerId, setCheckoutWorkerId] = useState('');
  const [checkoutDueDate, setCheckoutDueDate] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutCondition, setCheckoutCondition] = useState('Good Condition');
  const [checkoutChecklist, setCheckoutChecklist] = useState<Record<string, boolean>>({});
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  // Return Modal State
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedBorrowing, setSelectedBorrowing] = useState<InventoryBorrowing | null>(null);
  const [returnCondition, setReturnCondition] = useState('Good Condition');
  const [returnNotes, setReturnNotes] = useState('');
  const [isDamaged, setIsDamaged] = useState(false);
  const [returnChecklist, setReturnChecklist] = useState<Record<string, boolean>>({});
  const [submittingReturn, setSubmittingReturn] = useState(false);

  // Details Modal State
  const [detailsBorrowing, setDetailsBorrowing] = useState<InventoryBorrowing | null>(null);

  // Checklist Templates
  const [checklistTemplates, setChecklistTemplates] = useState<any[]>([]);

  // QR Modal
  const [qrItem, setQrItem] = useState<{ id: string; name: string; inventoryCode?: string } | null>(null);

  const loadData = useCallback(() => {
    fetchBorrowings({
      skip: String(skip),
      take: String(take),
      ...(statusFilter && { status: statusFilter }),
    });
  }, [skip, take, statusFilter, fetchBorrowings]);

  useEffect(() => {
    loadData();
    fetchItems({ take: 200 });
  }, [loadData, fetchItems]);

  useEffect(() => {
    fetch('/api/checklist-templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setChecklistTemplates(data);
      })
      .catch(() => {});
  }, []);

  const filteredBorrowings = useMemo(() => {
    return borrowings.filter((b) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        b.borrowerName?.toLowerCase().includes(q) ||
        b.borrowerEmail?.toLowerCase().includes(q) ||
        b.item?.name?.toLowerCase().includes(q) ||
        (b.item?.inventoryCode || '').toLowerCase().includes(q)
      );
    });
  }, [borrowings, search]);

  const stats = useMemo(() => {
    const active = borrowings.filter((b) => b.status === 'BORROWED').length;
    const returned = borrowings.filter((b) => b.status === 'RETURNED').length;
    const overdue = borrowings.filter(
      (b) => b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < new Date()
    ).length;
    const total = totalBorrowings || borrowings.length;
    return { active, returned, overdue, total };
  }, [borrowings, totalBorrowings]);

  const checkoutTemplate = checklistTemplates.find((t) => t.type === 'checkout');
  const returnTemplate = checklistTemplates.find((t) => t.type === 'return');

  // Quick preset helper for due dates
  const setQuickDueDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setCheckoutDueDate(d.toISOString().split('T')[0]);
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutItemId || !checkoutWorkerId) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select both an item and a borrower.',
      });
      return;
    }

    const worker = workers?.find((w) => w.id === checkoutWorkerId);
    const workerName = worker ? `${worker.firstName} ${worker.lastName}` : 'Worker';

    setSubmittingCheckout(true);
    try {
      const res = await fetch('/api/borrowings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: checkoutItemId,
          borrowerId: checkoutWorkerId,
          borrowerName: workerName,
          dueDate: checkoutDueDate || null,
          checkoutNotes,
          checkoutCondition,
          checkoutChecklist,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to checkout');
      }

      toast({
        title: 'Checkout Successful',
        description: `Equipment checked out to ${workerName}.`,
      });

      setIsCheckoutOpen(false);
      setCheckoutItemId('');
      setCheckoutWorkerId('');
      setCheckoutDueDate('');
      setCheckoutNotes('');
      setCheckoutChecklist({});
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Checkout Failed',
        description: err.message,
      });
    } finally {
      setSubmittingCheckout(false);
    }
  };

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBorrowing) return;

    setSubmittingReturn(true);
    try {
      const res = await fetch(`/api/borrowings/${selectedBorrowing.id}/return`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          returnNotes,
          returnCondition,
          returnChecklist,
          damaged: isDamaged,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to process return');
      }

      toast({
        title: 'Return Completed',
        description: `${selectedBorrowing.item?.name || 'Item'} returned successfully.`,
      });

      setIsReturnOpen(false);
      setSelectedBorrowing(null);
      setReturnNotes('');
      setIsDamaged(false);
      setReturnChecklist({});
      loadData();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Return Failed',
        description: err.message,
      });
    } finally {
      setSubmittingReturn(false);
    }
  };

  const openReturnModal = (b: InventoryBorrowing) => {
    setSelectedBorrowing(b);
    setReturnCondition('Good Condition');
    setReturnNotes('');
    setIsDamaged(false);
    setReturnChecklist({});
    setIsReturnOpen(true);
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = borrowings.map((b) => ({
      'Item Name': b.item?.name || '',
      'Item Code': b.item?.inventoryCode || '',
      'Borrower Name': b.borrowerName || '',
      'Borrower Email': b.borrowerEmail || '',
      'Borrowed Date': b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : '',
      'Due Date': b.dueDate ? new Date(b.dueDate).toLocaleDateString() : 'N/A',
      'Returned Date': b.returnedAt ? new Date(b.returnedAt).toLocaleDateString() : 'N/A',
      Status: b.status,
      Condition: b.status === 'RETURNED' ? b.returnCondition || 'Good' : b.checkoutCondition || 'Good',
      Notes: b.status === 'RETURNED' ? b.returnNotes || '' : b.checkoutNotes || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `borrowings_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export generated',
      description: `Exported ${borrowings.length} borrowing records to CSV.`,
    });
  };

  const getRelativeDueInfo = (dueDate?: string, status?: string) => {
    if (status === 'RETURNED') return null;
    if (!dueDate) return { text: 'No due date', isOverdue: false, isUrgent: false };
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffMs = due.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)}d overdue`, isOverdue: true, isUrgent: true };
    }
    if (diffDays === 0) {
      return { text: 'Due today', isOverdue: false, isUrgent: true };
    }
    if (diffDays === 1) {
      return { text: 'Due tomorrow', isOverdue: false, isUrgent: true };
    }
    return { text: `Due in ${diffDays}d`, isOverdue: false, isUrgent: false };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        {/* ── OVERDUE ALERT BANNER ── */}
        {stats.overdue > 0 && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between flex-wrap gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-destructive/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-xs font-bold">
                  {stats.overdue} Overdue Borrowing Item{stats.overdue > 1 ? 's' : ''} Detected!
                </p>
                <p className="text-[11px] opacity-90 mt-0.5">
                  Some borrowed equipment has exceeded its return schedule. Please verify returns or follow up with workers.
                </p>
              </div>
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="text-xs rounded-xl h-8 px-3 shadow-xs cursor-pointer"
              onClick={() => {
                setStatusFilter('BORROWED');
                setSkip(0);
              }}
            >
              Filter Overdue Items
            </Button>
          </div>
        )}

        {/* ── UNIFIED TOOLBAR & TABLE CONTAINER (Connect2Souls Style) ── */}
        <div className="bg-white dark:bg-card rounded-2xl border border-gray-200/80 dark:border-border shadow-xs p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
          {/* Unified Single-Row Toolbar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            {/* Search Input with Clear Button */}
            <div className="relative flex-1 min-w-[200px] max-w-full lg:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Search borrower, item name, inventory code..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setSkip(0);
                }}
                className="pl-9 pr-8 h-10 text-xs rounded-2xl bg-muted/30 border-slate-200/90 dark:border-border focus:bg-background transition-all shadow-2xs w-full"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded-full hover:bg-muted cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Right Controls Group in One Row */}
            <div className="flex flex-wrap items-center gap-2.5 justify-start lg:justify-end shrink-0">
              {/* Status Filter Dropdown with Counts */}
              <Select
                value={statusFilter || 'ALL'}
                onValueChange={(val) => {
                  setStatusFilter(val === 'ALL' ? '' : val);
                  setSkip(0);
                }}
              >
                <SelectTrigger className="h-10 w-[170px] text-xs font-medium rounded-2xl bg-white dark:bg-muted/30 border-slate-200/90 dark:border-border hover:bg-muted/50 transition-colors px-3 gap-2 shadow-2xs cursor-pointer">
                  <div className="flex items-center gap-2 truncate">
                    <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <SelectValue placeholder="All Records" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ALL" className="text-xs font-medium cursor-pointer">
                    All Records ({totalBorrowings || stats.total})
                  </SelectItem>
                  <SelectItem value="BORROWED" className="text-xs font-medium cursor-pointer">
                    Active Borrowed ({stats.active})
                  </SelectItem>
                  <SelectItem value="RETURNED" className="text-xs font-medium cursor-pointer">
                    Returned ({stats.returned})
                  </SelectItem>
                </SelectContent>
              </Select>

              {(search || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('');
                    setSkip(0);
                  }}
                  className="h-10 px-2.5 text-xs text-muted-foreground hover:text-foreground rounded-xl gap-1 cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                className="h-10 px-3.5 gap-1.5 rounded-2xl border-slate-200/90 dark:border-border shadow-2xs text-xs font-semibold text-foreground hover:bg-muted/60 cursor-pointer bg-white dark:bg-muted/30"
                title="Refresh borrowings"
              >
                <RefreshCw className={cn("h-3.5 w-3.5 text-muted-foreground", loading && "animate-spin text-primary")} />
                <span>Refresh</span>
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="h-10 px-3.5 text-xs font-semibold rounded-2xl gap-1.5 border-slate-200/90 dark:border-border shadow-2xs cursor-pointer hover:bg-muted/60 bg-white dark:bg-muted/30 text-foreground"
                onClick={handleExportCSV}
              >
                <Download className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Export CSV</span>
              </Button>

              <Button
                size="sm"
                className="h-10 px-4 text-xs font-bold rounded-2xl gap-1.5 bg-sidebar hover:bg-sidebar/90 text-white shadow-xs cursor-pointer"
                onClick={() => setIsCheckoutOpen(true)}
              >
                <Plus className="h-4 w-4" />
                <span>Checkout Item</span>
              </Button>
            </div>
          </div>

          {/* ── MASTER TABLE CONTAINER (Rounded Card inside White Container) ── */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card shadow-card-dark">
            {/* ── MOBILE CARD LIST VIEW ── */}
            <div className="md:hidden divide-y divide-border/40">
              {loading && borrowings.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs font-medium">Loading borrowings...</span>
                </div>
              ) : filteredBorrowings.length === 0 ? (
                <div className="h-44 flex flex-col items-center justify-center gap-2 text-muted-foreground p-6 text-center">
                  <Package className="h-8 w-8 text-muted-foreground/40" />
                  <span className="text-xs font-bold text-foreground">No borrowing records found</span>
                  <p className="text-[11px]">Try adjusting your search query or status filter.</p>
                </div>
              ) : (
                filteredBorrowings.map((b) => {
                  const isOverdue = b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < new Date();
                  const dueInfo = getRelativeDueInfo(b.dueDate, b.status);

                  return (
                    <div key={b.id} className="p-4 space-y-3 hover:bg-muted/10 transition-colors">
                      {/* Item + Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/70 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                            {b.item?.imageUrl ? (
                              <img src={b.item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5 text-muted-foreground/60" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">{b.item?.name}</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono font-bold text-[10px] text-foreground">
                                {b.item?.inventoryCode || b.itemId.slice(0, 8)}
                              </span>
                              {b.item?.status && (
                                <span className="text-[9px] text-muted-foreground">· {b.item.status}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 text-[10px] shrink-0 font-semibold px-2.5 py-0.5 rounded-full border ${
                            b.status === 'RETURNED'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                              : isOverdue
                              ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                              : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${b.status === 'RETURNED' ? 'bg-emerald-500' : isOverdue ? 'bg-red-500' : 'bg-sky-500'}`} />
                          <span>{b.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Borrowed'}</span>
                        </span>
                      </div>

                      {/* Borrower */}
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/30 border border-border/40 text-xs">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-[11px] shrink-0">
                          {b.borrowerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-bold text-foreground text-xs truncate block">{b.borrowerName}</span>
                          {b.borrowerEmail && (
                            <span className="text-[10px] text-muted-foreground truncate block">{b.borrowerEmail}</span>
                          )}
                        </div>
                      </div>

                      {/* Dates & Status Note */}
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>Borrowed: {b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className={`h-3 w-3 shrink-0 ${isOverdue ? 'text-destructive' : 'text-muted-foreground'}`} />
                          <span className={isOverdue ? 'text-destructive font-bold' : ''}>
                            {dueInfo?.text || 'No due date'}
                          </span>
                        </div>
                      </div>

                      {/* Condition & Notes */}
                      {(b.checkoutNotes || b.returnNotes || b.checkoutCondition || b.returnCondition) && (
                        <p className="text-[11px] text-muted-foreground bg-muted/20 p-2 rounded-lg truncate">
                          <span className="font-semibold text-foreground">
                            {b.status === 'RETURNED' ? b.returnCondition || 'Returned' : b.checkoutCondition || 'Checked out'}:
                          </span>{' '}
                          {b.status === 'RETURNED' ? b.returnNotes || 'No notes' : b.checkoutNotes || 'Standard checkout'}
                        </p>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-1.5 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 rounded-lg border-border/70 cursor-pointer"
                          onClick={() => setDetailsBorrowing(b)}
                        >
                          <Eye className="h-3 w-3" />
                          <span>Details</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0 rounded-lg border-border/70 cursor-pointer"
                          title="Print item QR"
                          onClick={() =>
                            setQrItem({
                              id: b.itemId,
                              name: b.item?.name || 'Item',
                              inventoryCode: b.item?.inventoryCode,
                            })
                          }
                        >
                          <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>

                        {b.status === 'BORROWED' && (
                          <Button
                            size="sm"
                            className="h-7 text-xs gap-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                            onClick={() => openReturnModal(b)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Return Item</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* ── DESKTOP REFINED TABLE VIEW (Matching other tabs) ── */}
            <div className="overflow-x-auto hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider pl-4 bg-sidebar">
                      Item Details
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider bg-sidebar">
                      Borrower
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider bg-sidebar">
                      Borrowed Date
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider bg-sidebar">
                      Due Date / Schedule
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider bg-sidebar">
                      Status
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider bg-sidebar">
                      Condition / Notes
                    </TableHead>
                    <TableHead className="text-[11px] font-bold text-white uppercase tracking-wider text-right pr-4 bg-sidebar">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && borrowings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                          <span className="text-xs font-semibold">Loading borrowing records...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredBorrowings.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-44 text-center text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Package className="h-8 w-8 text-muted-foreground/40" />
                          <span className="text-xs font-bold text-foreground">No borrowing records found</span>
                          <p className="text-[11px] max-w-sm text-muted-foreground">
                            {search || statusFilter
                              ? 'No records match your active search or status filters.'
                              : 'There are currently no equipment checkouts recorded.'}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBorrowings.map((b) => {
                      const isOverdue = b.status === 'BORROWED' && b.dueDate && new Date(b.dueDate) < new Date();
                      const dueInfo = getRelativeDueInfo(b.dueDate, b.status);

                      return (
                        <TableRow
                          key={b.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-muted/20 border-b border-slate-100 dark:border-border/40 transition-colors group"
                        >
                          {/* 1. Item Details */}
                          <TableCell className="pl-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/70 overflow-hidden flex items-center justify-center shrink-0 shadow-2xs group-hover:border-primary/40 transition-colors">
                                {b.item?.imageUrl ? (
                                  <img src={b.item.imageUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="h-4 w-4 text-muted-foreground/60" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="font-bold text-xs md:text-sm leading-tight text-foreground truncate max-w-[220px]">
                                  {b.item?.name}
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="font-mono font-bold text-xs text-foreground">
                                    {b.item?.inventoryCode || b.itemId.slice(0, 8)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </TableCell>

                          {/* 2. Borrower */}
                          <TableCell className="py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                                {b.borrowerName.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="text-sm font-semibold text-foreground truncate">{b.borrowerName}</div>
                                {b.borrowerEmail ? (
                                  <div className="text-[11px] text-muted-foreground truncate">{b.borrowerEmail}</div>
                                ) : (
                                  <div className="text-[11px] text-muted-foreground">Church Worker</div>
                                )}
                              </div>
                            </div>
                          </TableCell>

                          {/* 3. Borrowed Date */}
                          <TableCell className="py-3 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1.5 font-medium">
                              <Calendar className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                              <span>{b.borrowedAt ? new Date(b.borrowedAt).toLocaleDateString() : '—'}</span>
                            </div>
                          </TableCell>

                          {/* 4. Due Date / Schedule */}
                          <TableCell className="py-3">
                            {b.dueDate ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5 text-xs font-medium">
                                  <Clock className={`h-3.5 w-3.5 shrink-0 ${isOverdue ? 'text-destructive' : 'text-muted-foreground/70'}`} />
                                  <span className={isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}>
                                    {new Date(b.dueDate).toLocaleDateString()}
                                  </span>
                                </div>
                                {b.status === 'BORROWED' && dueInfo && (
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] px-1.5 py-0 font-bold ${
                                      isOverdue
                                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30'
                                        : dueInfo.isUrgent
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
                                        : 'bg-muted text-muted-foreground border-border/70'
                                    }`}
                                  >
                                    {dueInfo.text}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground/70">No due date</span>
                            )}
                          </TableCell>

                          {/* 5. Status Badge */}
                          <TableCell className="py-3">
                            <span
                              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                                b.status === 'RETURNED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : isOverdue
                                  ? 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 border-red-200 dark:border-red-800 animate-pulse'
                                  : 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  b.status === 'RETURNED'
                                    ? 'bg-emerald-500'
                                    : isOverdue
                                    ? 'bg-red-500'
                                    : 'bg-sky-500'
                                }`}
                              />
                              <span>{b.status === 'RETURNED' ? 'Returned' : isOverdue ? 'Overdue' : 'Active Borrowed'}</span>
                            </span>
                          </TableCell>

                          {/* 6. Condition / Notes */}
                          <TableCell className="py-3 text-xs text-muted-foreground max-w-[200px]">
                            <div className="truncate">
                              <span className="font-semibold text-foreground">
                                {b.status === 'RETURNED'
                                  ? b.returnCondition || 'Good'
                                  : b.checkoutCondition || 'Good'}:
                              </span>{' '}
                              {b.status === 'RETURNED'
                                ? b.returnNotes || 'Returned in good order'
                                : b.checkoutNotes || 'Standard checkout'}
                            </div>
                          </TableCell>

                          {/* 7. Actions */}
                          <TableCell className="py-3 text-right pr-4">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40 p-1 rounded-xl shadow-lg border-border/80">
                                <DropdownMenuItem
                                  onClick={() => setDetailsBorrowing(b)}
                                  className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"
                                >
                                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                  View Details
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() =>
                                    setQrItem({
                                      id: b.itemId,
                                      name: b.item?.name || 'Item',
                                      inventoryCode: b.item?.inventoryCode,
                                    })
                                  }
                                  className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"
                                >
                                  <QrCode className="h-3.5 w-3.5 text-muted-foreground" />
                                  Print QR Code
                                </DropdownMenuItem>

                                {b.status === 'BORROWED' && (
                                  <DropdownMenuItem
                                    onClick={() => openReturnModal(b)}
                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-emerald-600 dark:text-emerald-400"
                                  >
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                    Return Item
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* ── PAGINATION FOOTER (Matching other tabs) ── */}
            <div className="p-4 border-t border-border/70 bg-muted/[0.15] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
              <div>
                Showing <strong className="text-foreground">{totalBorrowings === 0 ? 0 : skip + 1}</strong> to{' '}
                <strong className="text-foreground">{Math.min(skip + take, totalBorrowings)}</strong> of{' '}
                <strong className="text-foreground">{totalBorrowings}</strong> records
              </div>

              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-xl border-border/70 text-xs font-semibold gap-1 cursor-pointer"
                  disabled={skip === 0}
                  onClick={() => setSkip((s) => Math.max(0, s - take))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  <span>Previous</span>
                </Button>

                <div className="px-2 text-xs font-medium">
                  Page {Math.floor(skip / take) + 1} of {Math.max(1, Math.ceil(totalBorrowings / take))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 rounded-xl border-border/70 text-xs font-semibold gap-1 cursor-pointer"
                  disabled={skip + take >= totalBorrowings}
                  onClick={() => setSkip((s) => s + take)}
                >
                  <span>Next</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ── CHECKOUT MODAL (ENHANCED PREMIUM DESIGN) ── */}
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6">
            <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <ArrowUpCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Equipment Checkout Form
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Assign inventory equipment or kit bundles to a church worker or volunteer.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <form onSubmit={handleCheckoutSubmit} className="space-y-4 pt-2">
              {/* Equipment Item Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Select Equipment / SKU *</span>
                  <span className="text-[10px] text-muted-foreground font-normal">Available items with stock &gt; 0</span>
                </Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  value={checkoutItemId}
                  onChange={(e) => setCheckoutItemId(e.target.value)}
                  required
                >
                  <option value="">Select Equipment...</option>
                  {items
                    .filter((i) => i.type === 'EQUIPMENT' && i.stock > 0)
                    .map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name} ({i.stock} avail) {i.inventoryCode ? `[${i.inventoryCode}]` : ''} {i.isKit ? '★ KIT' : ''}
                      </option>
                    ))}
                </select>
              </div>

              {/* Borrower Worker Selection */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Borrower (Assigned Worker) *</Label>
                <select
                  className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                  value={checkoutWorkerId}
                  onChange={(e) => setCheckoutWorkerId(e.target.value)}
                  required
                >
                  <option value="">Select Worker...</option>
                  {workers
                    ?.filter((w) => w.status === 'Active')
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.firstName} {w.lastName} ({w.employmentType || 'Worker'})
                      </option>
                    ))}
                </select>
              </div>

              {/* Expected Return Date with Quick Presets */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-foreground">Expected Return Date</Label>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <Input
                  type="date"
                  value={checkoutDueDate}
                  onChange={(e) => setCheckoutDueDate(e.target.value)}
                  className="h-9 text-xs rounded-xl"
                />
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground font-medium mr-1">Presets:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(0)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(1)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(3)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(7)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                  >
                    +1 Week
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDueDate(14)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-muted/70 hover:bg-muted border border-border/60 transition-colors"
                  >
                    +2 Weeks
                  </button>
                </div>
              </div>

              {/* Condition at Checkout */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Condition at Checkout</Label>
                <Input
                  value={checkoutCondition}
                  onChange={(e) => setCheckoutCondition(e.target.value)}
                  placeholder="e.g. Good Condition, fully tested"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              {/* Checklist items */}
              {checkoutTemplate?.items && checkoutTemplate.items.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/30 border border-border/70 rounded-xl">
                  <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                    Checkout Verification Checklist
                  </Label>
                  <div className="space-y-1.5 pt-1">
                    {checkoutTemplate.items.map((item: any) => (
                      <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs hover:text-foreground">
                        <Checkbox
                          checked={checkoutChecklist[item.id] || false}
                          onCheckedChange={(c) =>
                            setCheckoutChecklist({ ...checkoutChecklist, [item.id]: Boolean(c) })
                          }
                        />
                        <span className="font-medium">{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Purpose / Notes */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Notes / Purpose</Label>
                <Input
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  placeholder="e.g. Sunday 2nd Service Audio setup / Youth Camp"
                  className="h-9 text-xs rounded-xl"
                />
              </div>

              <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCheckoutOpen(false)}
                  className="rounded-xl h-9 text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submittingCheckout}
                  className="rounded-xl h-9 text-xs font-bold bg-sidebar hover:bg-sidebar/90 text-white shadow-xs"
                >
                  {submittingCheckout ? 'Processing Checkout...' : 'Confirm Checkout'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* ── RETURN MODAL (ENHANCED PREMIUM DESIGN) ── */}
        <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl p-6">
            <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ArrowDownCircle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Equipment Check-in &amp; Return
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Verify item condition and restore item back into available stock.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {selectedBorrowing && (
              <form onSubmit={handleReturnSubmit} className="space-y-4 pt-2">
                {/* Item & Borrower Card Banner */}
                <div className="p-3.5 bg-muted/30 border border-border/70 rounded-xl space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-muted border border-border/70 overflow-hidden flex items-center justify-center shrink-0">
                      {selectedBorrowing.item?.imageUrl ? (
                        <img src={selectedBorrowing.item.imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground/60" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-xs text-foreground truncate">{selectedBorrowing.item?.name}</div>
                      <div className="text-[10px] font-mono text-muted-foreground">
                        {selectedBorrowing.item?.inventoryCode || 'No barcode'}
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Borrower: <strong className="text-foreground">{selectedBorrowing.borrowerName}</strong>
                    </span>
                    <span>
                      Borrowed: {selectedBorrowing.borrowedAt ? new Date(selectedBorrowing.borrowedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>
                </div>

                {/* Return Condition */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Return Condition</Label>
                  <select
                    className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-xs shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring font-medium"
                    value={returnCondition}
                    onChange={(e) => setReturnCondition(e.target.value)}
                  >
                    <option value="Good Condition">Good Condition (No issues)</option>
                    <option value="Minor Wear">Minor Wear (Functional)</option>
                    <option value="Damaged">Damaged / Needs Maintenance</option>
                  </select>
                </div>

                {/* Return Checklist */}
                {returnTemplate?.items && returnTemplate.items.length > 0 && (
                  <div className="space-y-2 p-3 bg-muted/30 border border-border/70 rounded-xl">
                    <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      Return Inspection Checklist
                    </Label>
                    <div className="space-y-1.5 pt-1">
                      {returnTemplate.items.map((item: any) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer text-xs hover:text-foreground">
                          <Checkbox
                            checked={returnChecklist[item.id] || false}
                            onCheckedChange={(c) =>
                              setReturnChecklist({ ...returnChecklist, [item.id]: Boolean(c) })
                            }
                          />
                          <span className="font-medium">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground">Inspection Notes</Label>
                  <Input
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Returned clean, fully functional, battery at 90%"
                    className="h-9 text-xs rounded-xl"
                  />
                </div>

                {/* Damaged flag */}
                <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs">
                    <Checkbox
                      checked={isDamaged}
                      onCheckedChange={(c) => setIsDamaged(Boolean(c))}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="text-destructive font-bold block">Flag Equipment as Damaged</span>
                      <span className="text-[11px] text-muted-foreground">
                        Updates item status to "Damaged" and flags for maintenance.
                      </span>
                    </div>
                  </label>
                </div>

                <DialogFooter className="pt-3 border-t border-border/60 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsReturnOpen(false)}
                    className="rounded-xl h-9 text-xs font-semibold"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submittingReturn}
                    className="rounded-xl h-9 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                  >
                    {submittingReturn ? 'Processing Return...' : 'Complete Return'}
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* ── RECORD DETAILS MODAL ── */}
        <Dialog open={Boolean(detailsBorrowing)} onOpenChange={(open) => !open && setDetailsBorrowing(null)}>
          <DialogContent className="max-w-md rounded-2xl p-6">
            <DialogHeader className="space-y-1.5 pb-2 border-b border-border/60">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Borrowing Record Details
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Complete information for this equipment assignment.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {detailsBorrowing && (
              <div className="space-y-4 pt-2 text-xs">
                {/* Item Banner */}
                <div className="p-3 bg-muted/30 border border-border/70 rounded-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-muted border overflow-hidden flex items-center justify-center shrink-0">
                    {detailsBorrowing.item?.imageUrl ? (
                      <img src={detailsBorrowing.item.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-5 w-5 text-muted-foreground/60" />
                    )}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-foreground">{detailsBorrowing.item?.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">
                      Code: {detailsBorrowing.item?.inventoryCode || detailsBorrowing.itemId}
                    </p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Borrower
                    </span>
                    <span className="font-bold text-foreground mt-0.5 block">{detailsBorrowing.borrowerName}</span>
                    {detailsBorrowing.borrowerEmail && (
                      <span className="text-[10px] text-muted-foreground truncate block">{detailsBorrowing.borrowerEmail}</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Status
                    </span>
                    <div className="mt-1">
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-bold ${
                          detailsBorrowing.status === 'RETURNED'
                            ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                            : 'bg-sky-500/10 text-sky-700 border-sky-500/30'
                        }`}
                      >
                        {detailsBorrowing.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Borrowed Date
                    </span>
                    <span className="font-bold text-foreground mt-0.5 block">
                      {detailsBorrowing.borrowedAt ? new Date(detailsBorrowing.borrowedAt).toLocaleDateString() : '—'}
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/20 border border-border/50">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      Due Date
                    </span>
                    <span className="font-bold text-foreground mt-0.5 block">
                      {detailsBorrowing.dueDate ? new Date(detailsBorrowing.dueDate).toLocaleDateString() : 'None'}
                    </span>
                  </div>
                </div>

                {/* Notes & Condition */}
                <div className="space-y-2 p-3 rounded-xl bg-muted/20 border border-border/50">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Condition &amp; Notes
                  </span>
                  <div className="text-xs space-y-1">
                    <p>
                      <strong>Checkout Condition:</strong> {detailsBorrowing.checkoutCondition || 'Good'}
                    </p>
                    {detailsBorrowing.checkoutNotes && (
                      <p className="text-muted-foreground">
                        <strong>Checkout Notes:</strong> {detailsBorrowing.checkoutNotes}
                      </p>
                    )}
                    {detailsBorrowing.status === 'RETURNED' && (
                      <>
                        <p>
                          <strong>Return Condition:</strong> {detailsBorrowing.returnCondition || 'Good'}
                        </p>
                        {detailsBorrowing.returnNotes && (
                          <p className="text-muted-foreground">
                            <strong>Return Notes:</strong> {detailsBorrowing.returnNotes}
                          </p>
                        )}
                        {detailsBorrowing.returnedAt && (
                          <p className="text-muted-foreground">
                            <strong>Returned Date:</strong> {new Date(detailsBorrowing.returnedAt).toLocaleDateString()}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <DialogFooter className="pt-2 border-t border-border/60">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl"
                    onClick={() => setDetailsBorrowing(null)}
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* ── QR CODE MODAL ── */}
        {qrItem && (
          <QRModal
            isOpen={Boolean(qrItem)}
            onClose={() => setQrItem(null)}
            item={qrItem}
          />
        )}
      </div>
    </TooltipProvider>
  );
}

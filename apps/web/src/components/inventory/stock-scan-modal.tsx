"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
  QrCode,
  RefreshCw,
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  Package,
  CheckCircle2,
  Plus,
  Minus,
  ScanBarcode,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
} from '@studio/ui';

interface StockScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated?: () => void;
  initialCode?: string;
}

export function StockScanModal({ isOpen, onClose, onStockUpdated, initialCode }: StockScanModalProps) {
  const [qrInput, setQrInput] = useState(initialCode || '');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialCode && isOpen) {
      setQrInput(initialCode);
      handleScanAPI(initialCode);
    }
  }, [initialCode, isOpen]);

  useEffect(() => {
    if (isOpen && !scanResult?.item) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 120);
      return () => clearTimeout(timer);
    }
  }, [isOpen, scanResult]);

  const handleResetScan = () => {
    setScanResult(null);
    setQrInput('');
    setError('');
    setSuccessMsg('');
    setQuantity(1);
    setNotes('');
  };

  const handleScanAPI = async (payload: string) => {
    if (!payload.trim()) return;
    setScanning(true);
    setError('');
    setSuccessMsg('');
    setScanResult(null);
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload: payload.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Item not found for the provided code');
        return;
      }
      setScanResult(data);
      setQuantity(1);
    } catch {
      setError('Scan lookup failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  const handleStockUpdate = async (action: 'Stock In' | 'Stock Out') => {
    if (!scanResult?.item) return;
    const qty = Math.max(1, Number(quantity) || 1);

    if (action === 'Stock Out' && scanResult.item.stock < qty) {
      setError(`Cannot stock out ${qty} items. Only ${scanResult.item.stock} available.`);
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(50);
    }
    setScanning(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch(`/api/inventory/items/${scanResult.item.id}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          quantity: qty,
          notes: notes.trim() || `Scanned via Fast Action (${action === 'Stock In' ? '+' : '-'}${qty})`,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to update stock');
        return;
      }

      setScanResult((prev: any) => ({
        ...prev,
        item: { ...prev.item, stock: data.updatedItem.stock, status: data.updatedItem.status },
      }));

      setSuccessMsg(
        `Successfully ${action === 'Stock In' ? 'added' : 'deducted'} ${qty} ${scanResult.item.unit || 'pcs'}. New stock: ${data.updatedItem.stock}`
      );
      if (onStockUpdated) onStockUpdated();
    } catch {
      setError('Update failed. Check network connection.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleResetScan();
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanBarcode className="h-5 w-5 text-primary" />
            Scan Barcode (Handheld)
          </DialogTitle>
          <DialogDescription>
            {scanResult?.item
              ? 'Adjust stock levels in bulk or single units for this item.'
              : 'Scan item barcode with your handheld scanner or enter the item code.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {/* Direct Handheld Barcode Input (Auto-focused, No Camera needed) */}
          {!scanResult?.item && (
            <div className="p-4 border border-border/80 rounded-2xl bg-muted/20 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ready for Handheld Scanner</span>
              </div>

              <div className="flex w-full gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Scan barcode or type code..."
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleScanAPI(qrInput)}
                  className="bg-background text-xs font-mono h-10 shadow-2xs"
                  autoFocus
                />
                <Button
                  onClick={() => handleScanAPI(qrInput)}
                  disabled={scanning || !qrInput.trim()}
                  size="sm"
                  className="h-10 px-4 cursor-pointer"
                >
                  {scanning ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Search'}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Point your handheld scanner at the barcode or press Enter after typing.
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive border border-destructive/20 rounded-xl flex items-center gap-2 animate-in fade-in">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          {/* SCANNED ITEM CARD & BULK STOCK CONTROLS */}
          {scanResult?.item && (
            <div className="border border-border/80 rounded-2xl overflow-hidden bg-card shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Item Details Header */}
              <div className="p-4 bg-muted/40 border-b border-border/60 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-muted border overflow-hidden flex items-center justify-center shrink-0 shadow-2xs">
                    {scanResult.item.imageUrl ? (
                      <img
                        src={scanResult.item.imageUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-foreground leading-snug truncate">
                      {scanResult.item.name}
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 flex-wrap">
                      <span className="font-mono font-bold text-foreground">
                        {scanResult.item.inventoryCode || scanResult.item.id.slice(0, 8)}
                      </span>
                      <span>&bull;</span>
                      <span>{scanResult.item.category?.name || 'General'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Current Stock</div>
                  <div className="text-2xl font-black font-headline text-foreground leading-none mt-0.5">
                    {scanResult.item.stock}{' '}
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {scanResult.item.unit || 'pcs'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bulk Quantity Stepper & Presets */}
              <div className="p-4 space-y-3.5 bg-card">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Quantity to Stock In / Out
                    </label>
                    <span className="text-[11px] text-muted-foreground">
                      Unit: <strong className="text-foreground">{scanResult.item.unit || 'pcs'}</strong>
                    </span>
                  </div>

                  {/* Stepper Input */}
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl shrink-0 cursor-pointer"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1 || scanning}
                      title="Minus 1"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>

                    <Input
                      type="number"
                      min={1}
                      value={quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setQuantity(isNaN(val) ? 1 : Math.max(1, val));
                      }}
                      className="h-10 text-center font-black text-base rounded-xl flex-1 bg-background"
                      disabled={scanning}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 rounded-xl shrink-0 cursor-pointer"
                      onClick={() => setQuantity((q) => q + 1)}
                      disabled={scanning}
                      title="Plus 1"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Quick Bulk Presets */}
                  <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                    <span className="text-[11px] font-medium text-muted-foreground mr-0.5">Presets:</span>
                    {[1, 5, 10, 20, 50, 100].map((preset) => (
                      <Button
                        key={preset}
                        type="button"
                        variant="outline"
                        size="sm"
                        className={`h-7 px-2.5 text-[11px] rounded-lg font-bold transition-all cursor-pointer ${
                          quantity === preset
                            ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                            : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                        }`}
                        onClick={() => setQuantity(preset)}
                        disabled={scanning}
                      >
                        +{preset}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Optional Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted-foreground">
                    Transaction Note (Optional)
                  </label>
                  <Input
                    placeholder="e.g. Bulk restock, delivery, batch replenishment..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="h-9 text-xs rounded-xl bg-background"
                    disabled={scanning}
                  />
                </div>

                {/* Action Buttons with Dynamic Quantity */}
                <div className="pt-2 flex gap-2">
                  <Button
                    type="button"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 rounded-xl shadow-xs gap-1.5 cursor-pointer"
                    onClick={() => handleStockUpdate('Stock In')}
                    disabled={scanning || quantity <= 0}
                  >
                    <ArrowUpCircle className="h-4 w-4" />
                    {scanning ? 'Updating...' : `Stock IN (+${quantity})`}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 font-bold text-xs h-10 rounded-xl gap-1.5 cursor-pointer"
                    onClick={() => handleStockUpdate('Stock Out')}
                    disabled={scanning || quantity <= 0 || scanResult.item.stock < quantity}
                    title={scanResult.item.stock < quantity ? 'Insufficient stock' : undefined}
                  >
                    <ArrowDownCircle className="h-4 w-4" />
                    {scanning ? 'Updating...' : `Stock OUT (-${quantity})`}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full pt-1">
          {scanResult?.item ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleResetScan}
              className="text-xs rounded-xl gap-1.5 border-border/80 cursor-pointer"
            >
              <ScanBarcode className="h-3.5 w-3.5" />
              <span>Scan Another Item</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              handleResetScan();
              onClose();
            }}
            className="text-xs rounded-xl cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

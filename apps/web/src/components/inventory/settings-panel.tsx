"use client";

import React, { useState, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  FileCheck,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@studio/ui';

interface ChecklistItem {
  id: string;
  label: string;
  required: boolean;
}

interface ChecklistTemplate {
  id: string;
  name: string;
  type: 'checkout' | 'return';
  items: ChecklistItem[];
}

const DEFAULT_CHECKLIST_TEMPLATES: ChecklistTemplate[] = [
  {
    id: 'checkout_default',
    name: 'Standard Checkout',
    type: 'checkout',
    items: [
      { id: '1', label: 'Battery / Power charged', required: false },
      { id: '2', label: 'No visible physical damage', required: false },
      { id: '3', label: 'All accessories and cables included', required: false },
      { id: '4', label: 'Item cleaned and sanitized', required: false },
      { id: '5', label: 'Serial number verified', required: false },
    ],
  },
  {
    id: 'return_default',
    name: 'Standard Return',
    type: 'return',
    items: [
      { id: '1', label: 'Item returned complete (no missing parts)', required: true },
      { id: '2', label: 'No new physical damage or dents', required: false },
      { id: '3', label: 'Cleaned before return', required: false },
      { id: '4', label: 'Power level acceptable', required: false },
    ],
  },
];

export function SettingsPanel() {
  const [templates, setTemplates] = useState<ChecklistTemplate[]>(DEFAULT_CHECKLIST_TEMPLATES);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    label: string;
    type: 'checkout' | 'return';
  } | null>(null);

  // New item inputs
  const [newCheckoutItem, setNewCheckoutItem] = useState('');
  const [newReturnItem, setNewReturnItem] = useState('');

  useEffect(() => {
    fetch('/api/checklist-templates')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setTemplates(data);
      })
      .catch((err) => console.error(err));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    try {
      const res = await fetch('/api/checklist-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templates }),
      });
      if (!res.ok) throw new Error('Failed to save templates');
      setSuccessMsg('Checklist verification templates saved successfully!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addCheckoutItem = () => {
    if (!newCheckoutItem.trim()) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'checkout'
          ? {
              ...t,
              items: [
                ...t.items,
                { id: `chk-${Date.now()}`, label: newCheckoutItem.trim(), required: false },
              ],
            }
          : t
      )
    );
    setNewCheckoutItem('');
  };

  const removeCheckoutItem = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'checkout'
          ? { ...t, items: t.items.filter((i) => i.id !== id) }
          : t
      )
    );
  };

  const addReturnItem = () => {
    if (!newReturnItem.trim()) return;
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'return'
          ? {
              ...t,
              items: [
                ...t.items,
                { id: `ret-${Date.now()}`, label: newReturnItem.trim(), required: false },
              ],
            }
          : t
      )
    );
    setNewReturnItem('');
  };

  const removeReturnItem = (id: string) => {
    setTemplates((prev) =>
      prev.map((t) =>
        t.type === 'return'
          ? { ...t, items: t.items.filter((i) => i.id !== id) }
          : t
      )
    );
  };

  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'checkout') {
      removeCheckoutItem(itemToDelete.id);
    } else {
      removeReturnItem(itemToDelete.id);
    }
    setItemToDelete(null);
  };

  const checkoutTemplate = templates.find((t) => t.type === 'checkout');
  const returnTemplate = templates.find((t) => t.type === 'return');

  return (
    <div className="space-y-4 w-full">
      {/* ── TOP ACTIONS TOOLBAR ── */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {successMsg && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5 animate-in fade-in">
              <CheckCircle2 className="h-4 w-4" />
              <span>{successMsg}</span>
            </span>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-9 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-2 shrink-0 transition-all"
        >
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </Button>
      </div>

      {/* ── GRID OF CHECKLIST CONFIGURATIONS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Checkout Checklist */}
        <Card className="rounded-2xl border border-border/60 shadow-card-dark bg-white dark:bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/[0.12]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 border border-sidebar/20">
                  <FileCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold font-headline text-foreground">
                    Checkout Checklist Items
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Steps verified before handing equipment to workers
                  </CardDescription>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20 shrink-0">
                {checkoutTemplate?.items.length || 0} items
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {(!checkoutTemplate?.items || checkoutTemplate.items.length === 0) ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No checkout checklist items yet. Add one below.
                </div>
              ) : (
                checkoutTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 rounded-xl border border-border/60 bg-muted/[0.12] flex items-center justify-between gap-3 hover:border-sidebar/40 hover:bg-muted/[0.22] transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-sidebar text-white font-bold text-[10px] font-mono flex items-center justify-center shrink-0 shadow-2xs">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() =>
                        setItemToDelete({
                          id: item.id,
                          label: item.label,
                          type: 'checkout',
                        })
                      }
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add item */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
              <Input
                placeholder="New checkout checklist item..."
                value={newCheckoutItem}
                onChange={(e) => setNewCheckoutItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCheckoutItem())}
                className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all flex-1"
              />
              <Button
                type="button"
                onClick={addCheckoutItem}
                className="h-9 px-4 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Return Checklist */}
        <Card className="rounded-2xl border border-border/60 shadow-card-dark bg-white dark:bg-card overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 border-b border-border/70 bg-muted/[0.12]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm font-bold font-headline text-foreground">
                    Return Inspection Checklist
                  </CardTitle>
                  <CardDescription className="text-[11px] text-muted-foreground mt-0.5">
                    Inspection criteria checked when equipment is returned
                  </CardDescription>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0">
                {returnTemplate?.items.length || 0} items
              </span>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              {(!returnTemplate?.items || returnTemplate.items.length === 0) ? (
                <div className="py-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No return inspection items yet. Add one below.
                </div>
              ) : (
                returnTemplate.items.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 sm:px-4 rounded-xl border border-border/60 bg-muted/[0.12] flex items-center justify-between gap-3 hover:border-sidebar/40 hover:bg-muted/[0.22] transition-all group shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border border-emerald-500/30 shadow-2xs">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.label}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                      onClick={() =>
                        setItemToDelete({
                          id: item.id,
                          label: item.label,
                          type: 'return',
                        })
                      }
                      title="Delete Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add item */}
            <div className="flex items-center gap-2 pt-3 border-t border-border/60">
              <Input
                placeholder="New return inspection item..."
                value={newReturnItem}
                onChange={(e) => setNewReturnItem(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addReturnItem())}
                className="h-9 text-xs rounded-xl bg-muted/30 border-border/70 focus:bg-background transition-all flex-1"
              />
              <Button
                type="button"
                onClick={addReturnItem}
                className="h-9 px-4 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                <Plus className="h-4 w-4" />
                <span>Add</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── DELETE CHECKLIST ITEM CONFIRMATION MODAL ── */}
      <Dialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center shadow-2xl border-border/80 gap-0">
          <div className="w-12 h-12 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 mx-auto flex items-center justify-center mb-3.5 shadow-xs">
            <Trash2 className="h-6 w-6" />
          </div>
          <DialogHeader className="space-y-1.5 p-0 text-center sm:text-center">
            <DialogTitle className="text-base font-bold text-center font-headline text-foreground">
              Delete Checklist Item
            </DialogTitle>
            <DialogDescription className="text-xs text-center text-muted-foreground leading-relaxed">
              Are you sure you want to remove{' '}
              <strong className="text-foreground font-semibold">
                "{itemToDelete?.label}"
              </strong>{' '}
              from the{' '}
              <span className="font-semibold text-foreground">
                {itemToDelete?.type === 'checkout' ? 'checkout' : 'return inspection'}
              </span>{' '}
              checklist?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row gap-2.5 sm:justify-center mt-5 p-0">
            <Button
              type="button"
              variant="outline"
              className="flex-1 rounded-xl text-xs h-9 font-semibold border-border/80 hover:bg-muted/60 cursor-pointer"
              onClick={() => setItemToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="flex-1 rounded-xl text-xs h-9 font-bold shadow-xs cursor-pointer"
              onClick={confirmDeleteItem}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

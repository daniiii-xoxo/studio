"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Pencil,
  RefreshCw,
  Search,
  Clock,
  User,
  Activity,
  Boxes,
  X,
  FileText,
  CheckCircle2,
  ArrowLeftRight,
} from 'lucide-react';
import { Input, Button, Badge } from '@studio/ui';
import { useInventory } from '@/hooks/use-inventory';
import { cn } from '@/lib/utils';

interface ActivityFeedProps {
  onClose?: () => void;
}

export function ActivityFeed({ onClose }: ActivityFeedProps) {
  const { logs, fetchLogs, loading } = useInventory();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs(50);
  }, [fetchLogs]);

  const handleRefresh = () => {
    fetchLogs(50);
  };

  // Filter logs by search term
  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase().trim();
    return logs.filter((log) => {
      const action = (log.action || log.type || '').toLowerCase();
      const itemName = (log.item?.name || '').toLowerCase();
      const itemCode = (log.item?.inventoryCode || '').toLowerCase();
      const worker = (log.workerName || `${log.worker?.firstName || ''} ${log.worker?.lastName || ''}`).toLowerCase();
      const notes = (log.notes || '').toLowerCase();
      return itemName.includes(q) || itemCode.includes(q) || worker.includes(q) || notes.includes(q) || action.includes(q);
    });
  }, [logs, search]);

  const getActionTheme = (actionRaw: string) => {
    const act = (actionRaw || '').toLowerCase();
    if (act.includes('in') || act.includes('return') || act.includes('restock')) {
      return {
        icon: ArrowDownRight,
        iconWrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
        badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
        qtyBadge: 'text-emerald-600 dark:text-emerald-400 font-bold',
        typeLabel: 'Stock In',
      };
    }
    if (act.includes('out') || act.includes('checkout') || act.includes('disposal') || act.includes('damage')) {
      return {
        icon: ArrowUpRight,
        iconWrapper: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
        badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
        qtyBadge: 'text-rose-600 dark:text-rose-400 font-bold',
        typeLabel: 'Stock Out',
      };
    }
    if (act.includes('borrow')) {
      return {
        icon: ArrowLeftRight,
        iconWrapper: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20',
        badge: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
        qtyBadge: 'text-sky-600 dark:text-sky-400 font-bold',
        typeLabel: 'Borrowed',
      };
    }
    return {
      icon: Pencil,
      iconWrapper: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20',
      badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
      qtyBadge: 'text-indigo-600 dark:text-indigo-400 font-bold',
      typeLabel: 'Adjustment',
    };
  };

  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return { full: '', relative: '' };
    const d = new Date(timestamp);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    
    // Relative time string
    const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000);
    let relative = '';
    if (diffMin < 1) relative = 'Just now';
    else if (diffMin < 60) relative = `${diffMin}m ago`;
    else if (diffMin < 1440) relative = `${Math.floor(diffMin / 60)}h ago`;
    else relative = `${Math.floor(diffMin / 1440)}d ago`;

    const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = isToday ? 'Today' : d.toLocaleDateString([], { month: 'short', day: 'numeric' });

    return { full: `${dateStr} at ${timeStr}`, relative };
  };

  return (
    <div className="flex flex-col h-full w-full bg-background select-none">
      {/* ── TOP STICKY HEADER ── */}
      <div className="p-5 border-b border-border/70 bg-card/50 backdrop-blur-md space-y-3.5 shrink-0">
        <div className="flex items-center gap-3 min-w-0 pr-8">
          <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
            <Activity className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-foreground font-headline tracking-tight truncate">
                Live Activity Feed
              </h2>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                LIVE
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">
              Real-time inventory audit trail and equipment history.
            </p>
          </div>
        </div>

        {/* Search Bar & Refresh Button Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by item, worker, SKU or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 h-9 text-xs rounded-xl bg-muted/40 border-border/70 focus:bg-background transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 w-9 p-0 rounded-xl border-border/80 text-muted-foreground hover:text-foreground cursor-pointer shadow-2xs shrink-0"
            title="Refresh logs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-primary")} />
          </Button>
        </div>
      </div>

      {/* ── SCROLLABLE ACTIVITY TIMELINE CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 pb-24">
        {loading && logs.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center animate-pulse">
              <Activity className="h-5 w-5 animate-spin" />
            </div>
            <p className="text-xs font-medium">Loading live activity feed...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-12 w-12 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto border border-border/70">
              <Boxes className="h-6 w-6 opacity-60" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">No matching activity logs</p>
              <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                {search
                  ? 'Try clearing your search query to see all logs.'
                  : 'Recent inventory updates, checkouts, and stock adjustments will appear here.'}
              </p>
            </div>
            {search && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearch('')}
                className="h-8 text-xs rounded-xl cursor-pointer"
              >
                Clear Search
              </Button>
            )}
          </div>
        ) : (
          filteredLogs.map((log) => {
            const theme = getActionTheme(log.action || log.type);
            const Icon = theme.icon;
            const timeInfo = formatTimestamp(log.timestamp);
            const workerDisplay = log.workerName || (log.worker ? `${log.worker.firstName} ${log.worker.lastName}` : null);
            const qty = log.quantity || 0;
            const sign = qty > 0 ? `+${qty}` : `${qty}`;

            return (
              <div
                key={log.id}
                className="group p-3.5 rounded-2xl border border-border/70 bg-card hover:border-sidebar/40 dark:hover:border-sidebar/60 transition-all shadow-2xs hover:shadow-xs space-y-2.5"
              >
                {/* Header line: Title & Action Badge */}
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs mt-0.5", theme.iconWrapper)}>
                      <Icon className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-xs font-bold text-foreground group-hover:text-sidebar transition-colors truncate">
                          {log.item?.name || 'Inventory Record'}
                        </h4>
                        {log.item?.inventoryCode && (
                          <span className="font-mono text-[9px] font-semibold px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60 shrink-0">
                            {log.item.inventoryCode}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
                        <span className="font-semibold text-foreground">
                          {log.action || log.type}
                        </span>
                        {qty !== 0 && (
                          <span className={theme.qtyBadge}>
                            ({sign} {qty === 1 || qty === -1 ? 'unit' : 'units'})
                          </span>
                        )}
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 text-[10px]">
                          <Clock className="h-3 w-3 opacity-70" />
                          <span>{timeInfo.relative}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] px-2 py-0.5 font-bold rounded-full shrink-0 border uppercase tracking-wider",
                      theme.badge
                    )}
                  >
                    {log.action || log.type}
                  </Badge>
                </div>

                {/* Sub-info: Worker & Detailed Time */}
                <div className="flex items-center justify-between gap-2 text-[10px] text-muted-foreground pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1.5 truncate">
                    {workerDisplay ? (
                      <>
                        <User className="h-3 w-3 text-primary shrink-0" />
                        <span className="font-medium text-foreground truncate">
                          {workerDisplay}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground/70">System Audit Log</span>
                    )}
                  </div>
                  <span className="text-muted-foreground/80 shrink-0 font-medium">
                    {timeInfo.full}
                  </span>
                </div>

                {/* Optional Note pill */}
                {log.notes && (
                  <div className="p-2 rounded-xl bg-muted/40 border border-border/60 text-[11px] text-muted-foreground italic flex items-start gap-1.5">
                    <FileText className="h-3 w-3 text-muted-foreground/70 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">"{log.notes}"</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ── FOOTER STATUS BAR ── */}
      <div className="p-3 border-t border-border/70 bg-card/60 backdrop-blur-md flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
        <span>Showing {filteredLogs.length} recent {filteredLogs.length === 1 ? 'record' : 'records'}</span>
        <span className="flex items-center gap-1 text-[10px]">
          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
          <span>Auto-synchronized</span>
        </span>
      </div>
    </div>
  );
}

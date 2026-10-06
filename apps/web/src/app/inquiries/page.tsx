"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Dialog,
  DialogContent,
  DialogTitle,
} from "@studio/ui";
import {
  MessageSquareHeart,
  Search,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Eye,
  Inbox,
  Check,
  FileText,
  User,
  ShieldAlert,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getInquiries, updateInquiryStatus, archiveInquiry, unarchiveInquiry } from "@/actions/db";
import type { Inquiry } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";

// ── Stat Card Component ───────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accentColor,
  iconBg,
  iconColor,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  accentColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-card border border-border/70 p-5 shadow-xs transition-all hover:shadow-md">
      <div className={cn("absolute top-0 left-0 right-0 h-1", accentColor)} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {title}
          </p>
          <div className="mt-2 text-3xl sm:text-4xl font-black text-foreground">
            {value}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div className={cn("p-3 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
          <Icon className={cn("w-5 h-5", iconColor)} />
        </div>
      </div>
    </div>
  );
}

function parseDateSafe(val: any): Date {
  if (!val) return new Date();
  if (val instanceof Date) return val;
  if (typeof val?.toDate === "function") return val.toDate();
  if (typeof val?.seconds === "number") return new Date(val.seconds * 1000);
  const parsed = new Date(val);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default function InquiriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { workerProfile, isSuperAdmin, isLoading: isRoleLoading } = useUserRole();

  // Filters & State
  const [activeTab, setActiveTab] = useState<"active" | "archived">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [archiveCandidate, setArchiveCandidate] = useState<Inquiry | null>(null);
  const [statusCandidate, setStatusCandidate] = useState<{
    inquiry: Inquiry;
    targetStatus: "Pending" | "Responded";
  } | null>(null);

  // Fetch inquiries
  const {
    data: inquiries = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["inquiries"],
    queryFn: async () => {
      const data = await getInquiries();
      return (data || []) as Inquiry[];
    },
  });

  // Helper: Determine if an inquiry is archived (either manually archived or > 30 days old)
  const isItemArchived = (item: Inquiry) => {
    if (item.status === "Archived") return true;
    const daysOld = differenceInDays(new Date(), parseDateSafe(item.createdAt));
    return daysOld >= 30;
  };

  // Status update mutation (e.g. Mark as Responded)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: string;
    }) => {
      const responder = workerProfile
        ? `${workerProfile.firstName} ${workerProfile.lastName}`
        : "Staff Member";
      return await updateInquiryStatus(id, status, undefined, responder);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({
        title: "Updated Successfully",
        description: "Inquiry status has been updated.",
      });
      if (selectedInquiry) {
        setIsDetailsOpen(false);
      }
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err?.message || "Could not update status.",
      });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await archiveInquiry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({
        title: "Message Archived",
        description: "The message has been moved to the archive.",
      });
      setArchiveCandidate(null);
      if (selectedInquiry?.id === archiveCandidate?.id) {
        setIsDetailsOpen(false);
      }
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Archive Failed",
        description: err?.message || "Could not archive this message.",
      });
    },
  });

  // Unarchive mutation
  const unarchiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await unarchiveInquiry(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast({
        title: "Message Restored",
        description: "The message has been restored to Active messages.",
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Restore Failed",
        description: err?.message || "Could not restore this message.",
      });
    },
  });

  // Split into active vs archived
  const activeInquiries = useMemo(() => {
    return inquiries.filter((i) => !isItemArchived(i));
  }, [inquiries]);

  const archivedInquiries = useMemo(() => {
    return inquiries.filter((i) => isItemArchived(i));
  }, [inquiries]);

  // Current tab list filtered by search
  const displayedInquiries = useMemo(() => {
    const list = activeTab === "active" ? activeInquiries : archivedInquiries;
    const query = searchQuery.toLowerCase().trim();
    if (!query) return list;

    return list.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.email.toLowerCase().includes(query) ||
        (item.phone && item.phone.toLowerCase().includes(query)) ||
        item.message.toLowerCase().includes(query)
    );
  }, [activeTab, activeInquiries, archivedInquiries, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = inquiries.length;
    const active = activeInquiries.length;
    const responded = inquiries.filter(
      (i) => i.status === "Responded" || i.status === "Resolved"
    ).length;
    const archived = archivedInquiries.length;

    return { total, active, responded, archived };
  }, [inquiries, activeInquiries, archivedInquiries]);

  const handleOpenDetails = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDetailsOpen(true);
  };

  if (!isRoleLoading && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-4 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-sm text-muted-foreground max-w-md mt-1 mb-6">
            The Inquiries & Requests tab is restricted to Administrator accounts only.
          </p>
          <Button asChild className="rounded-xl px-6">
            <Link href="/dashboard">Return to Dashboard</Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-12">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
              <span className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageSquareHeart className="w-6 h-6" />
              </span>
              Inquiries & Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and follow up on messages and requests submitted through the website.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2 rounded-xl h-10 font-medium"
            >
              <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Top Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Inquiries"
            value={stats.total}
            subtitle="All received messages"
            icon={Inbox}
            accentColor="bg-blue-500"
            iconBg="bg-blue-500/10"
            iconColor="text-blue-500"
          />
          <StatCard
            title="Active Messages"
            value={stats.active}
            subtitle="Under 30 days & active"
            icon={AlertCircle}
            accentColor="bg-amber-500"
            iconBg="bg-amber-500/10"
            iconColor="text-amber-500"
          />
          <StatCard
            title="Responded"
            value={stats.responded}
            subtitle="Handled & followed up"
            icon={CheckCircle2}
            accentColor="bg-emerald-500"
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-500"
          />
          <StatCard
            title="Archived"
            value={stats.archived}
            subtitle="30+ days old & archived"
            icon={Archive}
            accentColor="bg-slate-500"
            iconBg="bg-slate-500/10"
            iconColor="text-slate-500"
          />
        </div>

        {/* Banner if viewing Archived */}
        {activeTab === "archived" && (
          <div className="flex items-center justify-between px-5 py-3 rounded-2xl bg-muted/60 border border-border/70 text-xs text-muted-foreground shadow-2xs">
            <span className="flex items-center gap-2 font-medium text-foreground">
              <Archive className="w-4 h-4 text-slate-500" />
              Viewing Archived Messages (30+ days old or archived)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab("active")}
              className="h-8 text-xs text-primary font-semibold hover:bg-primary/10 px-3 rounded-xl"
            >
              Back to Active Messages
            </Button>
          </div>
        )}

        {/* Main Content Card Container (Unified Dashboard Design) */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col gap-4">
          {/* Top Controls Row (Search Left, Archived Right) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Search bar (Left side) */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search name, email, phone, message..."
                className="pl-9 pr-4 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 h-10 bg-background dark:bg-muted/30 border border-slate-200/90 dark:border-border rounded-2xl shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Archived Filter Button (Right side) */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant={activeTab === "archived" ? "default" : "outline"}
                onClick={() => setActiveTab(activeTab === "archived" ? "active" : "archived")}
                className={cn(
                  "h-10 px-4 rounded-2xl text-xs font-semibold gap-2 transition-all shrink-0 border border-slate-200/90 dark:border-border shadow-2xs cursor-pointer",
                  activeTab === "archived"
                    ? "bg-sidebar text-white hover:bg-sidebar/90 shadow-2xs"
                    : "bg-background dark:bg-muted/30 text-muted-foreground hover:text-foreground"
                )}
              >
                <Archive className="w-4 h-4" />
                <span>Archived</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] rounded-full font-bold",
                    activeTab === "archived"
                      ? "bg-white/20 text-white"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {stats.archived}
                </span>
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="border border-border/60 rounded-2xl overflow-hidden flex flex-col bg-card">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-16 text-muted-foreground">
                <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
                <p className="font-medium text-xs">Loading messages...</p>
              </div>
            ) : displayedInquiries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-14 h-14 rounded-2xl bg-muted/60 flex items-center justify-center text-muted-foreground mb-3">
                  {activeTab === "active" ? (
                    <Inbox className="w-6 h-6" />
                  ) : (
                    <Archive className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {activeTab === "active" ? "No active messages" : "No archived messages"}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1">
                  {searchQuery
                    ? "No messages match your search query."
                    : activeTab === "active"
                    ? "Messages submitted via the Contact Us form will appear here. Messages automatically move to archive after 30 days."
                    : "Archived messages and messages older than 30 days will appear here."}
                </p>
                {searchQuery && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery("")}
                    className="mt-3.5 h-8 text-xs rounded-xl"
                  >
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-sidebar">
                    <tr className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        REQUESTER
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        CONTACT
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        MESSAGE
                      </th>
                      <th className="px-5 py-3.5 text-left text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        DATE RECEIVED
                      </th>
                      <th className="px-5 py-3.5 text-center text-[11px] font-bold uppercase tracking-wider text-white whitespace-nowrap">
                        ACTIONS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {displayedInquiries.map((inquiry) => {
                      const daysOld = differenceInDays(new Date(), parseDateSafe(inquiry.createdAt));
                      const isResponded = inquiry.status === "Responded" || inquiry.status === "Resolved";

                      return (
                        <tr
                          key={inquiry.id}
                          className="border-b border-gray-100 dark:border-border/60 hover:bg-slate-50/70 dark:hover:bg-muted/30 transition-colors"
                        >
                          {/* Requester (Name & Avatar) */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                                {inquiry.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .slice(0, 2)
                                  .join("")
                                  .toUpperCase()}
                              </div>
                              <div>
                                <div className="font-bold text-foreground text-sm flex items-center gap-2">
                                  {inquiry.name}
                                  {isResponded && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                      <Check className="w-3 h-3" /> Responded
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact (100% Static non-clickable text) */}
                          <td className="px-5 py-3.5 whitespace-nowrap">
                            <div className="space-y-1">
                              <div className="text-xs text-foreground font-medium flex items-center gap-1.5 select-text">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>{inquiry.email}</span>
                              </div>
                              {inquiry.phone ? (
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 select-text">
                                  <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                  <span>{inquiry.phone}</span>
                                </div>
                              ) : (
                                <div className="text-[11px] text-muted-foreground/60 italic">
                                  No phone provided
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Message Preview */}
                          <td className="px-5 py-3.5 max-w-sm sm:max-w-md">
                            <p className="text-sm text-foreground/90 line-clamp-2 leading-relaxed select-text">
                              {inquiry.message}
                            </p>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                            <div className="font-medium text-foreground">
                              {format(parseDateSafe(inquiry.createdAt), "MMM d, yyyy")}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {format(parseDateSafe(inquiry.createdAt), "h:mm a")} ({formatDistanceToNow(parseDateSafe(inquiry.createdAt), { addSuffix: true })})
                            </div>
                            {daysOld >= 30 && (
                              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-medium">
                                Auto-archived (30+ days)
                              </div>
                            )}
                          </td>

                          {/* Actions: Centered 3 Dots Menu */}
                          <td
                            className="px-5 py-3.5 text-center whitespace-nowrap"
                          >
                            <div className="flex items-center justify-center">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted mx-auto"
                                  >
                                    <MoreHorizontal className="w-4 h-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 rounded-xl">
                                  <DropdownMenuItem
                                    onClick={() => handleOpenDetails(inquiry)}
                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-foreground"
                                  >
                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                    <span>View Details</span>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    asChild
                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-foreground"
                                  >
                                    <a
                                      href={`mailto:${inquiry.email}?subject=Re: Church of God Dasmariñas - Your Message&body=Dear ${encodeURIComponent(
                                        inquiry.name
                                      )},%0D%0A%0D%0AThank you for contacting Church of God Dasmariñas regarding your message:%0D%0A"${encodeURIComponent(
                                        inquiry.message
                                      )}"%0D%0A%0D%0A`}
                                      className="flex items-center gap-2 w-full text-foreground"
                                    >
                                      <Mail className="w-4 h-4 text-muted-foreground" />
                                      <span>Reply via Email</span>
                                    </a>
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() =>
                                      setStatusCandidate({
                                        inquiry,
                                        targetStatus: isResponded ? "Pending" : "Responded",
                                      })
                                    }
                                    className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-foreground"
                                  >
                                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                                    <span>{isResponded ? "Mark as Pending" : "Mark as Responded"}</span>
                                  </DropdownMenuItem>

                                  {activeTab === "active" ? (
                                    <DropdownMenuItem
                                      onClick={() => setArchiveCandidate(inquiry)}
                                      className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-foreground"
                                    >
                                      <Archive className="w-4 h-4 text-muted-foreground" />
                                      <span>Archive</span>
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem
                                      onClick={() => unarchiveMutation.mutate(inquiry.id)}
                                      className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-foreground"
                                    >
                                      <ArchiveRestore className="w-4 h-4 text-muted-foreground" />
                                      <span>Restore to Active</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced View Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border-border/80 shadow-2xl gap-0">
            <DialogTitle className="sr-only">Message Details</DialogTitle>
            {selectedInquiry && (
              <>
                {/* Modal Top Bar Header with Icon & Badge & Close Button */}
                <div className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-2xl border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
                      <MessageSquareHeart className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-base font-bold font-headline tracking-tight text-foreground">
                          Message Details
                        </h2>
                        {selectedInquiry.status === "Responded" ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            Responded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 whitespace-nowrap shadow-2xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                            Pending Response
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-muted-foreground shrink-0" />
                        <span>
                          Received {format(parseDateSafe(selectedInquiry.createdAt), "MMM d, yyyy • h:mm a")} ({formatDistanceToNow(parseDateSafe(selectedInquiry.createdAt), { addSuffix: true })})
                        </span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsDetailsOpen(false)}
                    className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </button>
                </div>

                {/* Modal Body Content */}
                <div className="p-5 pb-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
                  {/* Sender Information Card (Vertical layout, clean & spacious, never wraps awkwardly) */}
                  <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-3 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Sender Information</span>
                    </div>

                    <div className="space-y-2.5 divide-y divide-border/40 pt-0.5">
                      {/* Full Name */}
                      <div className="flex items-center gap-3 pt-1.5 first:pt-0">
                        <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground font-medium">Full Name</p>
                          <p className="text-sm font-bold text-foreground break-words select-text">
                            {selectedInquiry.name}
                          </p>
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="flex items-center gap-3 pt-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground font-medium">Email Address</p>
                          <p className="text-sm font-semibold text-foreground break-all select-text">
                            {selectedInquiry.email}
                          </p>
                        </div>
                      </div>

                      {/* Contact Number */}
                      <div className="flex items-center gap-3 pt-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                          <Phone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-muted-foreground font-medium">Contact Number</p>
                          <p className="text-sm font-semibold text-foreground select-text">
                            {selectedInquiry.phone ? (
                              <span>{selectedInquiry.phone}</span>
                            ) : (
                              <span className="text-muted-foreground/60 italic font-normal text-xs">
                                Not provided
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Message Content Block */}
                  <div className="p-4 rounded-2xl border border-border/70 bg-card/60 space-y-2 shadow-2xs">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      <span>Message / Request</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs sm:text-sm font-medium text-foreground leading-relaxed whitespace-pre-wrap break-words min-h-[90px] select-text">
                      {selectedInquiry.message}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        {/* Archive Confirmation Dialog */}
        <AlertDialog
          open={!!archiveCandidate}
          onOpenChange={(open) => !open && setArchiveCandidate(null)}
        >
          <AlertDialogContent className="sm:max-w-lg rounded-2xl p-6 sm:p-7 border-border/80 shadow-2xl space-y-5">
            <AlertDialogHeader className="space-y-2 pb-1 border-b border-border/40 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shrink-0 shadow-2xs">
                    <Archive className="h-5 w-5" />
                  </div>
                  <div>
                    <AlertDialogTitle className="text-xl font-bold font-headline text-foreground">
                      Archive Message
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Move this message to the archived records tab.
                    </AlertDialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setArchiveCandidate(null)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </AlertDialogHeader>

            {archiveCandidate && (
              <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">{archiveCandidate.name}</span>
                  <span className="text-[11px] text-muted-foreground">{archiveCandidate.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-background border border-border/60 text-xs text-foreground leading-relaxed italic">
                  "{archiveCandidate.message}"
                </div>
                <p className="text-[11px] text-muted-foreground">
                  You can restore this message back to Active at any time from the Archived tab.
                </p>
              </div>
            )}

            <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <AlertDialogCancel className="h-10 rounded-xl px-5 text-xs font-semibold cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => archiveCandidate && archiveMutation.mutate(archiveCandidate.id)}
                className="h-10 rounded-xl px-5 text-xs font-semibold bg-sidebar hover:bg-sidebar/90 text-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive Message
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Mark as Responded / Pending Confirmation Dialog */}
        <AlertDialog
          open={!!statusCandidate}
          onOpenChange={(open) => !open && setStatusCandidate(null)}
        >
          <AlertDialogContent className="sm:max-w-lg rounded-2xl p-6 sm:p-7 border-border/80 shadow-2xl space-y-5">
            <AlertDialogHeader className="space-y-2 pb-1 border-b border-border/40 text-left">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "p-2.5 rounded-xl border shrink-0 shadow-2xs",
                      statusCandidate?.targetStatus === "Responded"
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                        : "bg-sidebar/10 text-sidebar dark:text-sky-400 border-sidebar/20"
                    )}
                  >
                    {statusCandidate?.targetStatus === "Responded" ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Clock className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <AlertDialogTitle className="text-xl font-bold font-headline text-foreground">
                      {statusCandidate?.targetStatus === "Responded"
                        ? "Mark as Responded"
                        : "Revert to Pending"}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-xs text-muted-foreground mt-0.5">
                      {statusCandidate?.targetStatus === "Responded"
                        ? "Update inquiry status and record responder signature."
                        : "Revert this inquiry back to pending for further follow-up."}
                    </AlertDialogDescription>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusCandidate(null)}
                  className="h-8 w-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Close</span>
                </button>
              </div>
            </AlertDialogHeader>

            {statusCandidate && (
              <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-foreground">{statusCandidate.inquiry.name}</span>
                  <span className="text-[11px] text-muted-foreground">{statusCandidate.inquiry.email}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-white dark:bg-background border border-border/60 text-xs text-foreground leading-relaxed italic">
                  "{statusCandidate.inquiry.message}"
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {statusCandidate.targetStatus === "Responded"
                    ? "This marks the message as attended by staff."
                    : "This returns the message to the active pending queue."}
                </p>
              </div>
            )}

            <AlertDialogFooter className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <AlertDialogCancel className="h-10 rounded-xl px-5 text-xs font-semibold cursor-pointer">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (statusCandidate) {
                    updateStatusMutation.mutate({
                      id: statusCandidate.inquiry.id,
                      status: statusCandidate.targetStatus,
                    });
                    setStatusCandidate(null);
                  }
                }}
                className="h-10 rounded-xl px-5 text-xs font-semibold bg-sidebar hover:bg-sidebar/90 text-white shadow-sm flex items-center gap-2 cursor-pointer"
              >
                {statusCandidate?.targetStatus === "Responded" ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Mark as Responded
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5" />
                    Set to Pending
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

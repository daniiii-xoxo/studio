"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format, formatDistanceToNow } from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
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
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Separator,
} from "@studio/ui";
import { cn, toJsDate } from "@/lib/utils";
import { isValidPhilippineNumber, cleanPhoneNumber, isValidEmail } from "@/lib/validation";
import {
  Plus,
  PlusCircle,
  Users,
  UserPlus,
  MoreHorizontal,
  Edit,
  Trash2,
  LoaderCircle,
  HeartHandshake,
  Search,
  BarChart3,
  BookOpen,
  Calendar,
  Camera,
  Eye,
  ShieldCheck,
  X,
  UploadCloud,
  Clock,
  GraduationCap,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Heart,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Pencil,
  Building2,
  UserCheck,
  Download,
  FileText,
  Printer,
  TrendingUp,
  PieChart as PieChartIcon,
  User,
  Mail,
  Phone,
} from "lucide-react";
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as ReTooltip,
  Legend,
} from "recharts";
import { useAuthStore, usePermissionsStore } from "@studio/store";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { C2SGroup, C2SMentee, C2SDevotionRecord, Worker } from "@studio/types";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { DeleteConfirmationDialog } from "@/components/common/delete-confirmation-dialog";
import {
  createC2SGroup,
  createC2SMentee,
  deleteC2SGroup,
  deleteC2SMentee,
  getC2SGroups,
  getC2SMentees,
  getWorkers,
  updateC2SGroup,
  updateC2SMentee,
  getC2SDevotionRecords,
  createC2SDevotionRecord,
  updateC2SDevotionRecord,
  deleteC2SDevotionRecord,
  getMinistries,
  getDepartmentSettings,
} from "@/actions/db";

// ── StatCard Component (Consistent with Dashboard & Attendance) ───────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  accentColor,
  iconClass,
  iconBgClass,
}: {
  label: string;
  value: number | string;
  sub?: string;
  icon: React.ElementType;
  accentColor: string;
  iconClass: string;
  iconBgClass: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-border shadow-xs bg-white dark:bg-card h-full">
      <div className={cn("h-1.5 w-full", accentColor)} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="mt-3">
              <span className="text-4xl font-black tracking-tight font-headline text-foreground leading-none">{value}</span>
            </div>
            {sub && <p className="text-xs text-muted-foreground mt-2 font-medium">{sub}</p>}
          </div>
          <div className={cn("p-2.5 rounded-xl flex items-center justify-center shrink-0 shadow-xs", iconBgClass)}>
            <Icon className={cn("h-5 w-5", iconClass)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DYNAMIC CURRICULUM DATA ───────────────────────────────────────────────
export const C2S_CURRICULUM: Record<
  string,
  { module: string; lessons: string[] }[]
> = {
  "C2S Devotional Manual": [
    {
      module: "Module 1: A Born Again Experience",
      lessons: [
        "Lesson 1: Fresh Start",
        "Lesson 2: Receiving God's Forgiveness",
        "Lesson 3: Highly Favored",
        "Lesson 4: Well-Rested",
        "Lesson 5: Direct Access",
        "Lesson 6: Thirst Quencher",
      ],
    },
    {
      module: "Module 2: Life of a Winner",
      lessons: [
        "Lesson 1: The 'I' That Matters Most",
        "Lesson 2: Forgiveness: The Best Choice",
        "Lesson 3: Make or Break?",
        "Lesson 4: Oh, No! It's Captain Hook!",
        "Lesson 5: www: when.winners.worship",
        "Lesson 6: As Good As It Gets",
      ],
    },
    {
      module: "Module 3: Walking in Great Faith",
      lessons: [
        "Lesson 1: Through the Eyes of Faith",
        "Lesson 2: Faith that Works",
        "Lesson 3: Living Like a Tough Guy",
        "Lesson 4: Resentment-Free",
        "Lesson 5: Fearless",
        "Lesson 6: Bearing for the Master",
      ],
    },
    {
      module: "Module 4: Marks of a True Follower of Jesus",
      lessons: [
        "Lesson 1: Fruit-iply",
        "Lesson 2: Costly but Worthy",
        "Lesson 3: Walk the Talk",
        "Lesson 4: Good Followers",
        "Lesson 5: A Changed Man",
        "Lesson 6: Harvesters",
      ],
    },
  ],
  "Mentor's Manual": [
    {
      module: "Module 1: 10 Core Values in the Ministry",
      lessons: [
        "Lesson 1: The Foundation of Ministry is Character",
        "Lesson 2: The Nature of Ministry is Service",
        "Lesson 3: The Motive of Ministry is Love",
        "Lesson 4: The Measure of Ministry is Sacrifice",
        "Lesson 5: The Authority of Ministry is Submission",
        "Lesson 6: The Purpose of Ministry is to Glorify God",
        "Lesson 7: The Tools of Ministry are Prayer & Scripture",
        "Lesson 8: The Privilege of Ministry is Growth",
        "Lesson 9: The Power of the Ministry is the Holy Spirit",
        "Lesson 10: The Model of Ministry is Jesus Christ",
      ],
    },
    {
      module: "Module 2: Knowing our Role as Worker",
      lessons: [
        "Lesson 1: Our Ministry as a Worker",
        "Lesson 2: Our Role as a Worker",
        "Lesson 3: Our Character as a Glorifier",
      ],
    },
    {
      module: "Module 3: Taking Care of Your C2S Group",
      lessons: [
        "Lesson 1: The Necessity of a Mentor",
        "Lesson 2: Building a Healthy C2S Group",
      ],
    },
  ],
};

// ─── SUBMISSION FORM MODAL COMPONENT ──────────────────────────────────────
interface DevotionFormProps {
  devotion: C2SDevotionRecord | null;
  groups: any[];
  mentees: any[];
  workers: Worker[];
  currentWorker: Worker | null;
  isMinistryHead: boolean;
  isSuperAdmin: boolean;
  onSave: (data: any) => Promise<void>;
  onClose: () => void;
}

const DevotionForm = ({
  devotion,
  groups,
  mentees,
  workers,
  currentWorker,
  isMinistryHead,
  isSuperAdmin,
  onSave,
  onClose,
}: DevotionFormProps) => {
  // Manual & Lesson State
  const [manualType, setManualType] = useState<string>(
    devotion?.manualType || "C2S Devotional Manual"
  );
  const availableModules = useMemo(() => {
    return C2S_CURRICULUM[manualType] || [];
  }, [manualType]);

  const [selectedModule, setSelectedModule] = useState<string>(
    devotion?.moduleName || availableModules[0]?.module || ""
  );

  const availableLessons = useMemo(() => {
    const mod = availableModules.find((m) => m.module === selectedModule);
    return mod?.lessons || [];
  }, [availableModules, selectedModule]);

  const [selectedLesson, setSelectedLesson] = useState<string>(
    devotion?.lessonName || availableLessons[0] || ""
  );

  const [customTopic, setCustomTopic] = useState(devotion?.topic || "");
  const [scripture, setScripture] = useState(devotion?.scripture || "");

  const handleManualChange = (newManual: string) => {
    setManualType(newManual);
    const newModules = C2S_CURRICULUM[newManual] || [];
    const firstMod = newModules[0]?.module || "";
    setSelectedModule(firstMod);
    const firstLesson = newModules[0]?.lessons[0] || "";
    setSelectedLesson(firstLesson);
    setCustomTopic(firstLesson);
  };

  const handleModuleChange = (newModule: string) => {
    setSelectedModule(newModule);
    const mod = availableModules.find((m) => m.module === newModule);
    const firstLesson = mod?.lessons[0] || "";
    setSelectedLesson(firstLesson);
    setCustomTopic(firstLesson);
  };

  const handleLessonChange = (newLesson: string) => {
    setSelectedLesson(newLesson);
    setCustomTopic(newLesson);
  };

  // Timestamp (defaults to current date & time)
  const defaultTimestamp = () => {
    const now = devotion?.devotionDate ? toJsDate(devotion.devotionDate) : new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };
  const [devotionDateTime, setDevotionDateTime] = useState<string>(defaultTimestamp());

  // Cluster & Group
  const [groupId, setGroupId] = useState(devotion?.groupId || groups[0]?.id || "");
  const [customCluster, setCustomCluster] = useState(devotion?.clusterName || "");

  // Mentor Name (Auto-filled from logged-in profile, editable if Ministry Head / Admin)
  const defaultMentorName = currentWorker
    ? `${currentWorker.firstName} ${currentWorker.lastName}`
    : "Mentor";
  const [mentorName, setMentorName] = useState(
    devotion?.mentorName || defaultMentorName
  );
  const [mentorId, setMentorId] = useState(
    devotion?.mentorId || currentWorker?.id || ""
  );

  // Mentee & Attendance State
  const [selectedMenteeName, setSelectedMenteeName] = useState<string>(
    devotion?.attendeeNames?.[0] || ""
  );
  const [attendanceStatus, setAttendanceStatus] = useState<"Present" | "Absent">("Present");
  const [nextScheduleDate, setNextScheduleDate] = useState<string>("");

  const menteeOptions = useMemo(() => {
    return mentees?.map((m) => ({ id: m.id, name: `${m.firstName} ${m.lastName}` })) || [];
  }, [mentees]);

  // Session Details
  const [reflectionNotes, setReflectionNotes] = useState(
    devotion?.reflectionNotes || ""
  );
  const [prayerRequests, setPrayerRequests] = useState(
    devotion?.prayerRequests || ""
  );
  const [photoUrls, setPhotoUrls] = useState<string[]>(
    devotion?.photoUrls || (devotion?.photoUrl ? [devotion.photoUrl] : [])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (devotion) {
      setManualType(devotion.manualType || "C2S Devotional Manual");
      setSelectedModule(devotion.moduleName || "");
      setSelectedLesson(devotion.lessonName || "");
      setCustomTopic(devotion.topic || "");
      setScripture(devotion.scripture || "");
      if (devotion.devotionDate) {
        const d = toJsDate(devotion.devotionDate);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setDevotionDateTime(d.toISOString().slice(0, 16));
      }
      setGroupId(devotion.groupId || groups[0]?.id || "");
      setCustomCluster(devotion.clusterName || "");
      setMentorName(devotion.mentorName || defaultMentorName);
      setMentorId(devotion.mentorId || currentWorker?.id || "");
      setSelectedMenteeName(devotion.attendeeNames?.[0] || "");
      setReflectionNotes(devotion.reflectionNotes || "");
      setPrayerRequests(devotion.prayerRequests || "");
      setPhotoUrls(devotion.photoUrls || (devotion.photoUrl ? [devotion.photoUrl] : []));
    }
  }, [devotion, groups, currentWorker, defaultMentorName]);

  const selectedMenteeRecord = mentees?.find(
    (m) =>
      `${m.firstName} ${m.lastName}`.toLowerCase() === selectedMenteeName.toLowerCase() ||
      (m as any).name?.toLowerCase() === selectedMenteeName.toLowerCase()
  );
  const resolvedGroup =
    groups.find((g) => g.id === selectedMenteeRecord?.groupId) ||
    groups.find((g) => g.mentorId === (currentWorker?.id || mentorId)) ||
    groups.find((g) => g.id === groupId);

  const selectedGroup = groups.find((g) => g.id === groupId) || resolvedGroup;
  const effectiveClusterName =
    resolvedGroup?.name ||
    customCluster ||
    selectedGroup?.name ||
    (currentWorker as any)?.clusterName ||
    "Cluster 1";

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: `${file.name} exceeds the 25MB limit.`,
      });
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1400;
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
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL("image/jpeg", 0.82);
            setPhotoUrls([compressed]);
          } else {
            setPhotoUrls([reader.result as string]);
          }
        };
        img.onerror = () => {
          setPhotoUrls([reader.result as string]);
        };
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRemovePhoto = () => {
    setPhotoUrls([]);
  };

  const handleSubmit = async () => {
    const finalTopic = selectedLesson || customTopic.trim() || selectedModule || "Devotion Session";
    if (!finalTopic) {
      toast({
        variant: "destructive",
        title: "Lesson Required",
        description: "Please select a lesson from the curriculum.",
      });
      return;
    }
    const finalAttendees = selectedMenteeName ? [selectedMenteeName] : [];
    if (finalAttendees.length === 0) {
      toast({
        variant: "destructive",
        title: "Mentee Required",
        description: "Please select a mentee.",
      });
      return;
    }
    if (!reflectionNotes.trim()) {
      toast({
        variant: "destructive",
        title: "Reflection Notes Required",
        description: "Please enter reflection notes and key session takeaways.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        manualType,
        moduleName: selectedModule,
        lessonName: selectedLesson,
        topic: finalTopic,
        scripture,
        devotionDate: new Date(devotionDateTime),
        groupId: groupId || null,
        clusterName: effectiveClusterName,
        mentorId: mentorId || currentWorker?.id || "mentor-unknown",
        mentorName,
        mentorRole: isMinistryHead ? "Ministry Head" : "Mentor",
        attendeeNames: finalAttendees,
        attendeeCount: finalAttendees.length,
        reflectionNotes,
        prayerRequests,
        photoUrl: photoUrls[0] || null,
        photoUrls: photoUrls,
        attendanceStatus,
        nextScheduleDate,
      });
      onClose();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Submission Failed",
        description: err.message || "Could not save devotion record.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5 py-1">
      {/* ── ROW 1: MENTEE & DATE ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Mentee <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <Select
            value={selectedMenteeName}
            onValueChange={(val) => setSelectedMenteeName(val)}
          >
            <SelectTrigger className="h-10 rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-muted/30 shadow-2xs font-medium focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
              <SelectValue placeholder="Select mentee" />
            </SelectTrigger>
            <SelectContent className="max-h-56 rounded-xl border border-border shadow-xl">
              {menteeOptions.map((m) => (
                <SelectItem key={m.id} value={m.name} className="text-xs font-medium cursor-pointer">
                  {m.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            Date & Time <span className="text-red-500 ml-0.5">*</span>
          </Label>
          <Input
            type="datetime-local"
            value={devotionDateTime}
            onChange={(e) => setDevotionDateTime(e.target.value)}
            className="h-10 rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-muted/30 shadow-2xs font-medium focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar"
          />
        </div>
      </div>

      {/* ── ROW 2: CURRICULUM & LESSON CARD ── */}
      <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0">
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Curriculum & Lesson <span className="text-red-500 ml-0.5">*</span></p>
            <p className="text-[11px] text-muted-foreground">Select the manual and devotional topic covered.</p>
          </div>
        </div>

        {/* Manual selection buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleManualChange("C2S Devotional Manual")}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
              manualType === "C2S Devotional Manual"
                ? "border-sidebar bg-sidebar/5 dark:bg-sidebar/10 text-sidebar dark:text-sky-400 font-bold shadow-2xs ring-1 ring-sidebar/30"
                : "border-slate-200/90 dark:border-border/80 bg-white dark:bg-background hover:bg-slate-50 dark:hover:bg-muted/30 text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
              manualType === "C2S Devotional Manual" ? "border-sidebar bg-sidebar text-white" : "border-slate-300"
            )}>
              {manualType === "C2S Devotional Manual" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <BookOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">C2S Devotional Manual</span>
          </button>

          <button
            type="button"
            onClick={() => handleManualChange("Mentor's Manual")}
            className={cn(
              "flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all cursor-pointer",
              manualType === "Mentor's Manual"
                ? "border-sidebar bg-sidebar/5 dark:bg-sidebar/10 text-sidebar dark:text-sky-400 font-bold shadow-2xs ring-1 ring-sidebar/30"
                : "border-slate-200/90 dark:border-border/80 bg-white dark:bg-background hover:bg-slate-50 dark:hover:bg-muted/30 text-muted-foreground"
            )}
          >
            <div className={cn(
              "w-4 h-4 rounded-full border flex items-center justify-center shrink-0",
              manualType === "Mentor's Manual" ? "border-sidebar bg-sidebar text-white" : "border-slate-300"
            )}>
              {manualType === "Mentor's Manual" && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
            </div>
            <GraduationCap className="h-3.5 w-3.5 shrink-0" />
            <span className="text-xs">Mentor's Manual</span>
          </button>
        </div>

        {/* Module & Lesson Selects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Module</Label>
            <Select value={selectedModule} onValueChange={handleModuleChange}>
              <SelectTrigger className="h-10 rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs font-medium focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
                <SelectValue placeholder="Select Module" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl border border-border shadow-xl">
                {availableModules.map((m) => (
                  <SelectItem key={m.module} value={m.module} className="text-xs font-medium cursor-pointer">
                    {m.module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Select Lesson</Label>
            <Select value={selectedLesson} onValueChange={handleLessonChange}>
              <SelectTrigger className="h-10 rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-background shadow-2xs font-medium focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar cursor-pointer">
                <SelectValue placeholder="Select Lesson" />
              </SelectTrigger>
              <SelectContent className="max-h-60 rounded-xl border border-border shadow-xl">
                {availableLessons.map((l) => (
                  <SelectItem key={l} value={l} className="text-xs font-medium cursor-pointer">
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── ROW 3: REFLECTION ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Reflection & Key Takeaways <span className="text-red-500 ml-0.5">*</span>
        </Label>
        <Textarea
          rows={3}
          placeholder="Write key reflections on the lesson, mentee's response, or personal insights..."
          value={reflectionNotes}
          onChange={(e) => setReflectionNotes(e.target.value)}
          className="rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-muted/20 p-3 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar resize-none transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* ── ROW 4: PRAYER REQUESTS ── */}
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
          Prayer Requests
        </Label>
        <Textarea
          rows={2}
          placeholder="Any prayer requests or prayer items from the mentee..."
          value={prayerRequests}
          onChange={(e) => setPrayerRequests(e.target.value)}
          className="rounded-xl border border-slate-200/90 dark:border-border text-xs bg-white dark:bg-muted/20 p-3 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar resize-none transition-all placeholder:text-muted-foreground/60"
        />
      </div>

      {/* ── ROW 5: PHOTO PROOF ── */}
      <div className="rounded-2xl border border-border/70 bg-slate-50/60 dark:bg-muted/20 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sidebar/10 text-sidebar dark:text-sky-400 shrink-0">
            <Camera className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Photo Proof <span className="text-red-500 ml-0.5">*</span></p>
            <p className="text-[11px] text-muted-foreground">Upload picture of the devotion session as verification.</p>
          </div>
        </div>

        {/* Advice banner for users */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
          <Sparkles className="h-4 w-4 mt-0.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Photo Advice:</strong> Take or upload session photo in <strong>Landscape (horizontal)</strong> format, max <strong>25MB</strong> (JPG, PNG, HEIC) for optimal display on feeds.
          </span>
        </div>

        {photoUrls.length === 0 ? (
          <label className="cursor-pointer block">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200/90 dark:border-border hover:border-sidebar/60 bg-white dark:bg-background rounded-xl transition-all text-center group">
              <div className="w-10 h-10 rounded-full bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <UploadCloud className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-foreground">Click to upload photo proof</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Horizontal / Landscape orientation • Up to 25MB
              </p>
            </div>
          </label>
        ) : (
          <div className="space-y-2">
            <div className="relative aspect-video max-h-52 w-full rounded-xl overflow-hidden border border-border/80 bg-black/5 flex items-center justify-center shadow-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photoUrls[0]} alt="Proof photo" className="w-full h-full object-contain" />
              <button
                type="button"
                onClick={handleRemovePhoto}
                className="absolute top-2.5 right-2.5 bg-black/75 hover:bg-destructive text-white rounded-full p-1.5 shadow-md transition-colors cursor-pointer"
                title="Remove photo"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 6: FOOTER ACTIONS ── */}
      <div className="pt-3 border-t border-border/40 flex items-center justify-end gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="h-10 px-4 rounded-xl border-border/70 text-xs font-semibold hover:bg-muted/50 transition-colors cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> Saving...
            </>
          ) : devotion ? (
            "Update Devotion Record"
          ) : (
            "Submit Devotion Record"
          )}
        </Button>
      </div>
    </div>
  );
};

// ─── PHOTO LIGHTBOX / DETAILS MODAL ───────────────────────────────────────
const DevotionDetailsModal = ({
  devotion,
  isOpen,
  onClose,
  isSuperAdmin,
}: {
  devotion: C2SDevotionRecord | null;
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin: boolean;
}) => {
  if (!devotion) return null;

  const mainPhoto = devotion.photoUrls?.[0] || devotion.photoUrl || null;

  const formattedDate = devotion.devotionDate
    ? format(toJsDate(devotion.devotionDate), "yyyy-MM-dd")
    : "";
  const formattedTime = devotion.devotionDate
    ? format(toJsDate(devotion.devotionDate), "hh:mm a")
    : "";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="rounded-3xl bg-white dark:bg-card border border-border/80 shadow-2xl p-0 overflow-hidden flex flex-col gap-0 [&>button:last-child]:hidden"
        style={{ width: "min(calc(100vw - 2rem), 48rem)", maxHeight: "min(calc(100svh - 4rem), 90vh)" }}
      >
        {/* ── MODAL HEADER (Matches Admin Style) ── */}
        <div className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3.5 min-w-0 flex-1">
              <div className="w-11 h-11 rounded-2xl bg-sidebar/10 text-sidebar dark:text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sidebar/20 shadow-xs">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-lg font-bold font-headline text-foreground tracking-tight">
                    {devotion.lessonName || devotion.topic}
                  </DialogTitle>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sidebar/10 text-sidebar dark:text-sky-400 border border-sidebar/20">
                    <Calendar className="h-3 w-3" />
                    <span>{formattedDate}</span>
                    {formattedTime && (
                      <>
                        <span className="opacity-40">•</span>
                        <span>{formattedTime}</span>
                      </>
                    )}
                  </div>
                  {devotion.clusterName && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <MapPin className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                      <span>{devotion.clusterName}</span>
                    </div>
                  )}
                </div>
                <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                  Mentor: <strong className="text-foreground font-semibold">{devotion.mentorName || "Mentor"}</strong>
                  {devotion.mentorRole && (
                    <span className="ml-1 text-[10px] bg-sidebar/10 text-sidebar px-2 py-0.5 rounded-full font-bold">
                      {devotion.mentorRole}
                    </span>
                  )}
                  {" • "}
                  Attendees: <strong className="text-foreground font-semibold">{devotion.attendeeNames?.join(", ") || "Mentee"}</strong>
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
        </div>

        {/* ── MODAL SCROLLABLE BODY ── */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Curriculum Hierarchy Breadcrumb Tag */}
          <div className="flex items-center gap-2 text-xs font-semibold text-sidebar dark:text-sky-400 flex-wrap bg-sidebar/5 dark:bg-sidebar/10 p-3 rounded-xl border border-sidebar/15">
            <BookOpen className="h-4 w-4 text-sidebar shrink-0" />
            {devotion.manualType && <span>{devotion.manualType}</span>}
            {devotion.moduleName && (
              <>
                <span className="text-muted-foreground/60">•</span>
                <span>{devotion.moduleName}</span>
              </>
            )}
            <span className="text-muted-foreground/60">•</span>
            <span className="font-bold text-foreground">{devotion.lessonName || devotion.topic}</span>
          </div>

          {/* Main Photo Proof */}
          {mainPhoto && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-0.5">
                <span className="flex items-center gap-1.5"><Camera className="h-3.5 w-3.5 text-sidebar" /> Session Photo Proof</span>
              </div>
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black/5 dark:bg-muted/40 border border-border/80 shadow-xs flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={mainPhoto}
                  alt={devotion.topic}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}

          {/* Reflection & Prayer Details */}
          <div className="space-y-4 pt-1">
            {devotion.reflectionNotes && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-sidebar" /> Reflection Notes & Key Takeaways
                </Label>
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-200/80 dark:border-border text-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {devotion.reflectionNotes}
                </div>
              </div>
            )}

            {devotion.prayerRequests && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-rose-500" /> Prayer Requests
                </Label>
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-200/80 dark:border-border text-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {devotion.prayerRequests}
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-border/40 flex items-center justify-end bg-muted/10">
          <Button
            onClick={onClose}
            className="h-10 px-5 rounded-xl bg-sidebar hover:bg-sidebar/90 text-white text-xs font-bold shadow-xs transition-all active:scale-[0.99] cursor-pointer"
          >
            Close Record
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// --- Group Form Component ---
interface GroupFormProps {
  group: any;
  workers: any[];
  mentees: any[];
  allGroups: any[];
  currentWorker?: Worker | null;
  onSave: (data: { name: string; mentorId: string; menteeIds: string[] }) => void;
  canAssignMentor?: boolean;
}

const GroupForm = ({
  group,
  workers,
  mentees = [],
  allGroups = [],
  currentWorker,
  onSave,
  canAssignMentor = true,
}: GroupFormProps) => {
  const [formData, setFormData] = useState({
    name: group?.name || "",
    mentorId: group?.mentorId || currentWorker?.id || "",
  });

  const initialMenteeIds = useMemo(() => {
    if (!group?.id) return [];
    return mentees.filter((m) => m.groupId === group.id).map((m) => m.id);
  }, [group, mentees]);

  const [selectedMenteeIds, setSelectedMenteeIds] = useState<string[]>(initialMenteeIds);
  const [menteeSearch, setMenteeSearch] = useState("");

  const handleToggleMentee = (menteeId: string) => {
    setSelectedMenteeIds((prev) =>
      prev.includes(menteeId)
        ? prev.filter((id) => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const filteredMentees = useMemo(() => {
    if (!menteeSearch.trim()) return mentees;
    const q = menteeSearch.toLowerCase();
    return mentees.filter(
      (m) =>
        m.firstName?.toLowerCase().includes(q) ||
        m.lastName?.toLowerCase().includes(q) ||
        m.email?.toLowerCase().includes(q)
    );
  }, [mentees, menteeSearch]);

  const getGroupName = (groupId: string) => {
    return allGroups.find((g) => g.id === groupId)?.name;
  };

  return (
    <div className="space-y-4 py-3">
      {/* Group Name */}
      <div className="space-y-2">
        <Label htmlFor="group-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Group Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="group-name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g. Worship Cluster 1"
          className="h-10 text-xs"
        />
      </div>

      {/* Connect 2 Souls Mentor Select (Only shown if user can assign mentor) */}
      {canAssignMentor && (
        <div className="space-y-2">
          <Label htmlFor="mentor" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Connect 2 Souls Mentor
          </Label>
          <Select
            value={formData.mentorId}
            onValueChange={(val) => setFormData({ ...formData, mentorId: val })}
          >
            <SelectTrigger id="mentor" className="h-10 text-xs">
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id} className="text-xs">
                  {w.firstName} {w.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Add / Manage Existing Mentees */}
      <div className="space-y-2 pt-2 border-t">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Add Existing Mentees ({selectedMenteeIds.length} selected)
          </Label>
        </div>

        {/* Mentee Search */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search mentee name..."
            value={menteeSearch}
            onChange={(e) => setMenteeSearch(e.target.value)}
            className="pl-8 h-8 text-xs bg-muted/20"
          />
        </div>

        {/* Mentee Selection List */}
        <div className="border rounded-xl p-2 max-h-52 overflow-y-auto space-y-1 bg-background">
          {filteredMentees.length > 0 ? (
            filteredMentees.map((m) => {
              const isSelected = selectedMenteeIds.includes(m.id);
              const currentGroup = m.groupId ? getGroupName(m.groupId) : null;
              const isOtherGroup = m.groupId && m.groupId !== group?.id;

              return (
                <div
                  key={m.id}
                  onClick={() => handleToggleMentee(m.id)}
                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-colors ${isSelected
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-background hover:bg-muted/40 border-border/50"
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleToggleMentee(m.id)}
                      id={`mentee-${m.id}`}
                    />
                    <div>
                      <p className="font-semibold text-xs leading-none">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {m.email || m.phone || "No contact info"}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isSelected && (
                      <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 py-0">
                        Assigned
                      </Badge>
                    )}
                    {!isSelected && currentGroup && isOtherGroup && (
                      <Badge variant="outline" className="text-[10px] text-muted-foreground">
                        In {currentGroup}
                      </Badge>
                    )}
                    {!isSelected && !currentGroup && (
                      <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-50 border-emerald-200">
                        Unassigned
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-xs text-muted-foreground italic text-center py-4">
              No existing mentees found.
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground italic">
          Note: Each mentee can only belong to one group. Selected mentees will be assigned strictly to this group.
        </p>
      </div>

      <SheetFooter className="mt-6">
        <SheetClose asChild>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </SheetClose>
        <Button
          onClick={() =>
            onSave({
              name: formData.name,
              mentorId: formData.mentorId,
              menteeIds: selectedMenteeIds,
            })
          }
        >
          Save Group
        </Button>
      </SheetFooter>
    </div>
  );
};

// --- Mentee Form Component ---
const MenteeForm = ({
  mentee,
  groups,
  workers,
  onSave,
  onClose,
}: {
  mentee: any;
  groups: any[];
  workers: any[];
  onSave: (data: any) => void;
  onClose?: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: mentee?.firstName || "",
    lastName: mentee?.lastName || "",
    email: mentee?.email || "",
    phone: mentee?.phone || "",
    status: mentee?.status || "Active",
    mentorId:
      mentee?.mentorId ||
      (mentee?.groupId ? groups.find((g) => g.id === mentee.groupId)?.mentorId : "") ||
      (workers.length === 1 ? workers[0].id : ""),
    groupId: mentee?.groupId || "",
  });

  useEffect(() => {
    setFormData({
      firstName: mentee?.firstName || "",
      lastName: mentee?.lastName || "",
      email: mentee?.email || "",
      phone: mentee?.phone || "",
      status: mentee?.status || "Active",
      mentorId:
        mentee?.mentorId ||
        (mentee?.groupId ? groups.find((g) => g.id === mentee.groupId)?.mentorId : "") ||
        (workers.length === 1 ? workers[0].id : ""),
      groupId: mentee?.groupId || "",
    });
  }, [mentee, groups, workers]);

  const assignedMentorObj = useMemo(
    () => workers.find((w) => w.id === formData.mentorId),
    [workers, formData.mentorId]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!formData.firstName.trim() || !formData.lastName.trim()) {
          toast({
            variant: "destructive",
            title: "Required Fields Missing",
            description: "Please enter both first name and last name.",
          });
          return;
        }
        if (formData.email.trim() && !isValidEmail(formData.email.trim())) {
          toast({
            variant: "destructive",
            title: "Invalid Email Address",
            description: "Please enter a valid email format.",
          });
          return;
        }
        if (formData.phone.trim() && !isValidPhilippineNumber(formData.phone.trim())) {
          toast({
            variant: "destructive",
            title: "Invalid Contact Number",
            description: "Phone number must be exactly 11 digits starting with 09 (e.g. 09171234567) and numbers only.",
          });
          return;
        }
        onSave(formData);
      }}
      className="space-y-4"
    >
      {/* 1. Personal Details Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10 text-primary">
            <User className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground font-headline">
            Personal Information
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first-name" className="text-[11px] font-semibold text-muted-foreground">
              First Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="first-name"
              required
              className="h-9 rounded-xl bg-background border border-border/70 text-xs font-medium focus-visible:ring-primary"
              placeholder="e.g. Samantha"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="last-name" className="text-[11px] font-semibold text-muted-foreground">
              Last Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="last-name"
              required
              className="h-9 rounded-xl bg-background border border-border/70 text-xs font-medium focus-visible:ring-primary"
              placeholder="e.g. Conche"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[11px] font-semibold text-muted-foreground">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="email"
              type="email"
              className="h-9 pl-9 rounded-xl bg-background border border-border/70 text-xs font-medium focus-visible:ring-primary"
              placeholder="e.g. samantha.conche@mentee.org"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-[11px] font-semibold text-muted-foreground">
            Phone Number
          </Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              maxLength={11}
              className="h-9 pl-9 rounded-xl bg-background border border-border/70 text-xs font-medium focus-visible:ring-primary"
              placeholder="09179876543"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: cleanPhoneNumber(e.target.value) })}
            />
          </div>
        </div>
      </div>

      {/* 2. Mentorship & Assignment Card */}
      <div className="rounded-2xl border border-border/70 bg-card/60 p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10 text-primary">
            <HeartHandshake className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-foreground font-headline">
            Mentorship &amp; Status
          </span>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="mentor" className="text-[11px] font-semibold text-muted-foreground">
            Assigned Mentor
          </Label>
          <Select
            value={formData.mentorId}
            onValueChange={(val) => {
              const matchedGroup = groups.find((g) => g.mentorId === val);
              setFormData({
                ...formData,
                mentorId: val,
                groupId: matchedGroup?.id || formData.groupId || "",
              });
            }}
          >
            <SelectTrigger id="mentor" className="h-9 rounded-xl bg-background border border-border/70 text-xs font-medium">
              <SelectValue placeholder="Select a mentor" />
            </SelectTrigger>
            <SelectContent className="max-h-60 overflow-y-auto rounded-xl">
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id} className="text-xs cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{w.firstName} {w.lastName}</span>
                    {w.department && (
                      <span className="text-[10px] text-muted-foreground font-mono">
                        ({w.department})
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="status" className="text-[11px] font-semibold text-muted-foreground">
            Mentee Status
          </Label>
          <Select
            value={formData.status}
            onValueChange={(val) =>
              setFormData({ ...formData, status: val as any })
            }
          >
            <SelectTrigger id="status" className="h-9 rounded-xl bg-background border border-border/70 text-xs font-medium">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="Active" className="text-xs cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Active</span>
                </div>
              </SelectItem>
              <SelectItem value="Inactive" className="text-xs cursor-pointer">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-slate-400" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Inactive</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="pt-2 flex items-center justify-end gap-2.5">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-xl text-xs h-10 px-5 font-semibold border-border/70 hover:bg-muted/50 cursor-pointer"
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          className="rounded-xl text-xs h-10 px-6 font-semibold bg-sidebar hover:bg-sidebar/90 text-white shadow-xs flex items-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <CheckCircle2 className="h-4 w-4" />
          Save Mentee
        </Button>
      </div>
    </form>
  );
};

// ── Department Visual Metadata Helper (Matching WORDA reference diagram) ───────
function getDepartmentMeta(deptName: string) {
  const upper = (deptName || "").toUpperCase();
  if (upper.includes("WORSHIP") || upper === "W") {
    return {
      displayName: "Worship",
      code: "W",
      circleBg: "bg-[#112e7e] text-white shadow-xs",
      accentBar: "bg-[#112e7e]",
      icon: Sparkles,
      iconBg: "bg-[#112e7e]/10 dark:bg-[#112e7e]/25",
      iconColor: "text-[#112e7e] dark:text-blue-400",
      progressGradient: "from-[#112e7e] to-blue-500",
    };
  }
  if (upper.includes("OUTREACH") || upper === "O") {
    return {
      displayName: "Outreach",
      code: "O",
      circleBg: "bg-amber-500 text-white shadow-xs",
      accentBar: "bg-amber-500",
      icon: HeartHandshake,
      iconBg: "bg-amber-50 dark:bg-amber-950/40",
      iconColor: "text-amber-600 dark:text-amber-400",
      progressGradient: "from-amber-500 to-yellow-400",
    };
  }
  if (upper.includes("RELATIONSHIP") || upper === "R") {
    return {
      displayName: "Relationship",
      code: "R",
      circleBg: "bg-red-600 text-white shadow-xs",
      accentBar: "bg-red-600",
      icon: Heart,
      iconBg: "bg-red-50 dark:bg-red-950/40",
      iconColor: "text-red-600 dark:text-red-400",
      progressGradient: "from-red-600 to-rose-400",
    };
  }
  if (upper.includes("DISCIPLESHIP") || upper === "D") {
    return {
      displayName: "Discipleship",
      code: "D",
      circleBg: "bg-emerald-600 text-white shadow-xs",
      accentBar: "bg-emerald-600",
      icon: GraduationCap,
      iconBg: "bg-emerald-50 dark:bg-emerald-950/40",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      progressGradient: "from-emerald-600 to-green-400",
    };
  }
  return {
    displayName: "Administration",
    code: "A",
    circleBg: "bg-zinc-900 dark:bg-zinc-800 text-white shadow-xs",
    accentBar: "bg-zinc-900 dark:bg-zinc-300",
    icon: Building2,
    iconBg: "bg-zinc-100 dark:bg-zinc-800",
    iconColor: "text-zinc-900 dark:text-zinc-100",
    progressGradient: "from-zinc-900 to-slate-600",
  };
}

// ── Standard 5 Departments in Strict WORDA Order ──
const WORDA_ORDER = ["WORSHIP", "OUTREACH", "RELATIONSHIP", "DISCIPLESHIP", "ADMINISTRATION"] as const;

// ── Default 40 Ministries mapped by WORDA Department ──
const DEFAULT_DEPARTMENT_CLUSTERS: Record<string, { value: string; label: string }[]> = {
  WORSHIP: [
    { value: "Whitelight", label: "Whitelight" },
    { value: "Dance", label: "Dance" },
    { value: "PMT", label: "PMT" },
    { value: "Crusade", label: "Crusade" },
    { value: "Singers", label: "Singers" },
    { value: "Musicians", label: "Musicians" },
    { value: "Audio", label: "Audio" },
  ],
  OUTREACH: [
    { value: "Cluster 1", label: "Cluster 1" },
    { value: "Cluster 2", label: "Cluster 2" },
    { value: "Cluster 3", label: "Cluster 3" },
    { value: "Cluster 4", label: "Cluster 4" },
    { value: "Cluster 5", label: "Cluster 5" },
    { value: "Cluster 6", label: "Cluster 6" },
    { value: "Cluster 7", label: "Cluster 7" },
    { value: "Cluster 8", label: "Cluster 8" },
    { value: "Cluster 9", label: "Cluster 9" },
    { value: "WEYJ", label: "WEYJ" },
    { value: "TAPAT", label: "TAPAT" },
  ],
  RELATIONSHIP: [
    { value: "Sports", label: "Sports" },
    { value: "GEM", label: "GEM" },
    { value: "Ushering", label: "Ushering" },
    { value: "Mens", label: "Mens" },
    { value: "Ladies", label: "Ladies" },
    { value: "Youth Empowered", label: "Youth Empowered" },
    { value: "Young Adults", label: "Young Adults" },
  ],
  DISCIPLESHIP: [
    { value: "J12", label: "J12" },
    { value: "Oneliner", label: "Oneliner" },
    { value: "CLDP", label: "CLDP" },
    { value: "KID", label: "KID" },
    { value: "Children's Ministry", label: "Children's Ministry" },
    { value: "Life Institute", label: "Life Institute" },
    { value: "KCA", label: "KCA" },
  ],
  ADMINISTRATION: [
    { value: "Finance", label: "Finance" },
    { value: "Engineering", label: "Engineering" },
    { value: "Security and Shuttle", label: "Security and Shuttle" },
    { value: "Technology", label: "Technology" },
    { value: "In house", label: "In house" },
    { value: "Ventures", label: "Ventures" },
    { value: "Arts", label: "Arts" },
    { value: "Linkages", label: "Linkages" },
  ],
};

// --- Admin Department & Ministry Overview Component ---
const AdminOverview = ({
  groups,
  mentees,
  workers,
  devotions = [],
  departmentClusters,
  departmentSettings = [],
  allMinistries = [],
  onSelectDepartment,
  onViewDevotion,
}: {
  groups: any[];
  mentees: any[];
  workers: any[];
  devotions?: C2SDevotionRecord[];
  departmentClusters: Record<string, { value: string; label: string }[]>;
  departmentSettings?: any[];
  allMinistries?: any[];
  onSelectDepartment?: (dept: string) => void;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [viewingDept, setViewingDept] = useState<any | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<"ministries" | "mentors" | "mentees">("ministries");
  const [detailSearch, setDetailSearch] = useState("");
  const [detailMinistryFilter, setDetailMinistryFilter] = useState("all");

  const departmentStats = useMemo(() => {
    // Standard 5 Five-Fold Departments in strict WORDA order
    const WORDA_ORDER = ["WORSHIP", "OUTREACH", "RELATIONSHIP", "DISCIPLESHIP", "ADMINISTRATION"];

    // Filter entries to only full department names, ignoring single-letter codes
    const filteredEntries = Object.entries(departmentClusters).filter(([dept]) => {
      const u = dept.toUpperCase().trim();
      return u.length > 2 && (WORDA_ORDER.includes(u) || !["O", "W", "R", "D", "A"].includes(u));
    });

    // Make sure standard 5 departments are always present
    const existing = new Set(filteredEntries.map(([d]) => d.toUpperCase().trim()));
    const allEntries = [...filteredEntries];
    for (const vd of WORDA_ORDER) {
      if (!existing.has(vd)) {
        allEntries.push([vd, []]);
      }
    }

    // Sort strictly in WORDA order: Worship -> Outreach -> Relationship -> Discipleship -> Administration
    const sortedEntries = allEntries.sort((a, b) => {
      const ia = WORDA_ORDER.indexOf(a[0].toUpperCase().trim());
      const ib = WORDA_ORDER.indexOf(b[0].toUpperCase().trim());
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0]);
    });

    return sortedEntries.map(([dept, clusterList]) => {
      const deptUpper = dept.toUpperCase().trim();
      const clusterNames = (clusterList || []).map((c) => c.value.toLowerCase());
      const codeMap: Record<string, string> = {
        WORSHIP: "w",
        OUTREACH: "o",
        RELATIONSHIP: "r",
        DISCIPLESHIP: "d",
        ADMINISTRATION: "a",
      };
      const deptCode = codeMap[deptUpper] || "";

      const deptGroups = groups.filter((g) => {
        const name = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const mentorDept = ((mentor as any)?.department || "").toUpperCase();
        return (
          clusterNames.some((c) => name.includes(c)) ||
          (deptCode && name.startsWith(deptCode + " -")) ||
          mentorDept.includes(deptUpper)
        );
      });

      const deptGroupIds = new Set(deptGroups.map((g) => g.id));

      // Gather all mentees under this department with complete information
      const deptMentees = mentees
        .filter((m) => {
          if (m.groupId && deptGroupIds.has(m.groupId)) return true;
          const mentor = workers?.find((w) => w.id === m.mentorId);
          const mentorDept = ((mentor as any)?.department || "").toUpperCase();
          if (mentorDept && mentorDept.includes(deptUpper)) return true;
          return false;
        })
        .map((m) => {
          const fullName = `${m.firstName || ""} ${m.lastName || ""}`.trim() || "Unnamed Mentee";
          const initials = `${m.firstName?.[0] || ""}${m.lastName?.[0] || ""}`.toUpperCase() || "M";
          const grp = groups.find((g) => g.id === m.groupId);
          const mentor = workers.find(
            (w) => w.id === m.mentorId || (grp?.mentorId && w.id === grp.mentorId)
          );
          const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : "Unassigned";

          let ministryName = "General Ministry";
          if (grp?.name) {
            if (grp.name.includes(" - ")) {
              const parts = grp.name.split(" - ");
              ministryName = parts[1]?.trim() || parts[0]?.trim();
            } else {
              ministryName = grp.name;
            }
          } else if (mentor?.majorMinistryId) {
            const min = (allMinistries || []).find((x: any) => x.id === mentor.majorMinistryId);
            if (min?.name) ministryName = min.name;
          }

          const menteeDevos = devotions.filter((d) =>
            d.attendeeNames?.some((n) => n.toLowerCase().includes(fullName.toLowerCase()))
          );
          const lastSessionDate = menteeDevos[0]?.devotionDate
            ? format(toJsDate(menteeDevos[0].devotionDate), "MMM dd, yyyy")
            : "—";

          const progressPct =
            m.status === "Completed"
              ? 100
              : m.status === "Dropped"
              ? 25
              : menteeDevos.length > 0
              ? Math.min(100, Math.max(30, Math.round((menteeDevos.length / 24) * 100)))
              : 60;

          return {
            ...m,
            fullName,
            initials,
            mentorName,
            ministryName,
            progressPct,
            lastSessionDate,
          };
        });

      const mentorIdSet = new Set<string>();
      deptGroups.forEach((g) => {
        if (g.mentorId) mentorIdSet.add(g.mentorId);
      });
      deptMentees.forEach((m) => {
        if (m.mentorId) mentorIdSet.add(m.mentorId);
      });

      const deptMentors = Array.from(mentorIdSet)
        .map((mId) => {
          const w = workers.find((worker) => worker.id === mId);
          if (!w) return null;
          const mentorGroups = deptGroups.filter((g) => g.mentorId === w.id);
          const mentorGroupIds = new Set(mentorGroups.map((g) => g.id));

          // Mentees assigned to this mentor
          const mentorMentees = deptMentees.filter(
            (m) => m.mentorId === w.id || (m.groupId && mentorGroupIds.has(m.groupId))
          );

          // Find which ministry they belong to
          let ministryName = "General Ministry";
          if (mentorGroups[0]?.name) {
            if (mentorGroups[0].name.includes(" - ")) {
              const parts = mentorGroups[0].name.split(" - ");
              ministryName = parts[1]?.trim() || parts[0]?.trim();
            } else {
              ministryName = mentorGroups[0].name;
            }
          } else if (mentorMentees[0]?.ministryName) {
            ministryName = mentorMentees[0].ministryName;
          } else if (w.majorMinistryId) {
            const min = (allMinistries || []).find((x: any) => x.id === w.majorMinistryId);
            if (min?.name) ministryName = min.name;
          }

          const fullName = `${w.firstName || ""} ${w.lastName || ""}`.trim() || "Unnamed Mentor";
          const initials = `${w.firstName?.[0] || ""}${w.lastName?.[0] || ""}`.toUpperCase() || "M";

          return {
            id: w.id,
            fullName,
            initials,
            email: w.email,
            phone: w.phone,
            ministryName,
            groupsCount: mentorGroups.length,
            groups: mentorGroups,
            menteesCount: mentorMentees.length,
            mentees: mentorMentees,
          };
        })
        .filter(Boolean);

      // Compute real completion rate from mentee statuses
      const completedCount = deptMentees.filter((m) => m.status === "Completed").length;
      const completionPct = deptMentees.length > 0
        ? Math.round((completedCount / deptMentees.length) * 100)
        : 0;
      const status = completionPct < 55 ? "Needs Attention" : "Active";

      // Derive head name from departmentSettings.headId → workers
      const deptSetting = departmentSettings?.find((s: any) => {
        const sid = (s.id || "").toUpperCase();
        const sname = (s.name || "").toUpperCase();
        return sid === deptUpper || sname === deptUpper || sid.includes(deptUpper) || deptUpper.includes(sid);
      });
      const headWorker = deptSetting?.headId
        ? workers.find((w) => w.id === deptSetting.headId)
        : null;
      const headName = headWorker
        ? `${headWorker.firstName} ${headWorker.lastName}`
        : "—";

      const clusters = (clusterList || []).map((c) => {
        const matchingGroups = groups.filter((g) =>
          (g.name || "").toLowerCase().includes(c.value.toLowerCase())
        );
        const groupIds = new Set(matchingGroups.map((g) => g.id));
        const clusterMentees = deptMentees.filter((m) =>
          (m.groupId && groupIds.has(m.groupId)) ||
          m.ministryName.toLowerCase().includes(c.value.toLowerCase()) ||
          m.ministryName.toLowerCase().includes(c.label.toLowerCase())
        );
        const clusterMentorIds = new Set(
          matchingGroups.map((g) => g.mentorId).filter(Boolean)
        );
        const clusterMentors = deptMentors.filter((dm: any) =>
          dm && (clusterMentorIds.has(dm.id) || dm.ministryName.toLowerCase().includes(c.value.toLowerCase()) || dm.ministryName.toLowerCase().includes(c.label.toLowerCase()))
        );

        return {
          name: c.label,
          value: c.value,
          groupsCount: matchingGroups.length,
          mentorsCount: clusterMentors.length || clusterMentorIds.size,
          menteesCount: clusterMentees.length,
          mentors: clusterMentors,
          mentees: clusterMentees,
        };
      });

      return {
        department: deptUpper.charAt(0) + deptUpper.slice(1).toLowerCase(),
        rawDept: deptUpper,
        headName,
        groupsCount: deptGroups.length,
        mentorsCount: deptMentors.length || mentorIdSet.size,
        menteesCount: deptMentees.length,
        deptMentees,
        deptMentors,
        deptGroups,
        completionPct,
        status,
        clusters,
      };
    });
  }, [groups, mentees, workers, devotions, departmentClusters, departmentSettings, allMinistries]);

  const totalGroups = groups.length;
  const totalMentees = mentees.length;
  const totalMentors =
    new Set(groups.map((g) => g.mentorId).filter(Boolean)).size;
  const totalDepts = departmentStats.length;

  const avgCompletion = useMemo(() => {
    if (departmentStats.length === 0) return 0;
    const sum = departmentStats.reduce((acc, d) => acc + d.completionPct, 0);
    return Math.round(sum / departmentStats.length);
  }, [departmentStats]);

  // Filtered mentors inside the department details modal
  const modalFilteredMentors = useMemo(() => {
    if (!viewingDept) return [];
    let list = viewingDept.deptMentors || [];

    if (detailMinistryFilter !== "all") {
      const target = detailMinistryFilter.toLowerCase().trim();
      list = list.filter((m: any) =>
        (m.ministryName || "").toLowerCase().includes(target)
      );
    }

    if (detailSearch.trim()) {
      const q = detailSearch.toLowerCase().trim();
      list = list.filter(
        (m: any) =>
          m.fullName.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone && m.phone.includes(q)) ||
          (m.ministryName && m.ministryName.toLowerCase().includes(q)) ||
          (m.mentees && m.mentees.some((me: any) => me.fullName.toLowerCase().includes(q)))
      );
    }

    return list;
  }, [viewingDept, detailMinistryFilter, detailSearch]);

  // Filtered mentees inside the department details modal
  const modalFilteredMentees = useMemo(() => {
    if (!viewingDept) return [];
    let list = viewingDept.deptMentees || [];

    if (detailMinistryFilter !== "all") {
      const target = detailMinistryFilter.toLowerCase().trim();
      list = list.filter((m: any) =>
        (m.ministryName || "").toLowerCase().includes(target)
      );
    }

    if (detailSearch.trim()) {
      const q = detailSearch.toLowerCase().trim();
      list = list.filter(
        (m: any) =>
          m.fullName.toLowerCase().includes(q) ||
          (m.email && m.email.toLowerCase().includes(q)) ||
          (m.phone && m.phone.includes(q)) ||
          (m.mentorName && m.mentorName.toLowerCase().includes(q)) ||
          (m.ministryName && m.ministryName.toLowerCase().includes(q))
      );
    }

    return list;
  }, [viewingDept, detailMinistryFilter, detailSearch]);

  const viewingDeptMeta = viewingDept ? getDepartmentMeta(viewingDept.rawDept || viewingDept.department) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ── TOP KPI SUMMARY CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="DEPARTMENTS"
          value={totalDepts}
          sub="active departments"
          icon={Building2}
          accentColor="bg-sidebar"
          iconClass="text-sidebar dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="GROUPS"
          value={totalGroups}
          sub="mentorship clusters"
          icon={Users}
          accentColor="bg-blue-500"
          iconClass="text-blue-600 dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="MENTORS"
          value={totalMentors}
          sub="spiritual mentors"
          icon={UserCheck}
          accentColor="bg-emerald-500"
          iconClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="MENTEES"
          value={totalMentees}
          sub="registered souls"
          icon={ShieldCheck}
          accentColor="bg-purple-500"
          iconClass="text-purple-600 dark:text-purple-400"
          iconBgClass="bg-purple-50 dark:bg-purple-950/40"
        />
      </div>

      {/* ── SECTION DIVIDER ── */}
      <Separator className="bg-slate-200 dark:bg-slate-700/80 h-[1px]" />

      {/* ── DEPARTMENT CARDS GRID (3 COLUMNS) STRICTLY IN WORDA ORDER ── */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departmentStats.map((dept) => {
          const meta = getDepartmentMeta(dept.rawDept || dept.department);
          const DeptIcon = meta.icon;
          const initials = dept.headName !== "—"
            ? dept.headName
                .split(" ")
                .map((n: string) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
            : "?";

          return (
            <div
              key={dept.department}
              className="relative overflow-hidden rounded-2xl border border-border/60 bg-white dark:bg-card shadow-card-dark hover:border-sidebar/40 hover:shadow-lg transition-all flex flex-col justify-between"
            >
              {/* Top Accent Color Bar */}
              <div className={cn("h-1.5 w-full", meta.accentBar)} />

              <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                {/* Header: WORDA Circular Badge, Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-xs shrink-0 tracking-tight", meta.circleBg)}>
                      {meta.code}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-headline font-bold text-foreground tracking-tight truncate">
                        {meta.displayName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                        <DeptIcon className={cn("h-3 w-3 inline", meta.iconColor)} /> Department
                      </p>
                    </div>
                  </div>

                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 border",
                      dept.status === "Needs Attention"
                        ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    )}
                  >
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full shrink-0",
                        dept.status === "Needs Attention" ? "bg-amber-500" : "bg-emerald-500"
                      )}
                    />
                    {dept.status}
                  </span>
                </div>

                {/* Department Head Box */}
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-muted/20 border border-slate-100 dark:border-border/40">
                  <div className="w-7 h-7 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground font-bold text-[10px] flex items-center justify-center shrink-0">
                    {dept.headName !== "—" ? initials : "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Department Head
                    </p>
                    <p className="text-xs font-semibold text-foreground truncate">
                      {dept.headName !== "—" ? dept.headName : "Unassigned"}
                    </p>
                  </div>
                </div>

                {/* 3-Box Mini Metric Grid */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-100 dark:border-border/40 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Groups</p>
                    <p className="text-base font-black text-foreground font-headline mt-0.5">{dept.groupsCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-100 dark:border-border/40 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mentors</p>
                    <p className="text-base font-black text-foreground font-headline mt-0.5">{dept.mentorsCount}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50/70 dark:bg-muted/20 border border-slate-100 dark:border-border/40 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Mentees</p>
                    <p className="text-base font-black text-foreground font-headline mt-0.5">{dept.menteesCount}</p>
                  </div>
                </div>

                {/* Completion Progress */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Mentee completion</span>
                    <span className="font-bold text-foreground font-headline">{dept.completionPct}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-muted/50 h-2 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-300 bg-gradient-to-r", meta.progressGradient)}
                      style={{ width: `${dept.completionPct}%` }}
                    />
                  </div>
                </div>

                {/* Card Footer */}
                <div className="border-t border-slate-100 dark:border-border/40 pt-3 flex items-center justify-between text-xs">
                  <span className="inline-flex items-center text-xs text-muted-foreground font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Oversight enabled
                  </span>
                  <button
                    onClick={() => {
                      setViewingDept(dept);
                      setActiveDetailTab("ministries");
                      setDetailSearch("");
                      setDetailMinistryFilter("all");
                      onSelectDepartment?.(dept.department);
                    }}
                    className="h-7 px-3 rounded-lg bg-sidebar/5 hover:bg-sidebar/10 text-sidebar dark:text-blue-400 font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    View department
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── RECENT DEVOTION SESSIONS & PHOTO PROOFS ── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4 w-4 text-primary" />
              Recent Devotion Proofs & Sessions
            </h3>
            <p className="text-xs text-muted-foreground">
              Latest devotion sessions recorded across all departments. Click any record to inspect photo & full notes.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold">
            {devotions.length} Total Devotions
          </Badge>
        </div>

        {devotions.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed bg-muted/20 text-xs text-muted-foreground">
            <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-40" />
            No devotion sessions recorded yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {devotions.slice(0, 6).map((dev) => {
              const photo = dev.photoUrls?.[0] || dev.photoUrl;
              return (
                <div
                  key={dev.id}
                  onClick={() => onViewDevotion?.(dev)}
                  className="group cursor-pointer rounded-2xl border border-border/70 p-3.5 bg-card hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[11px]">
                      {dev.clusterName || "General"}
                    </span>
                    <span className="text-muted-foreground text-[11px]">
                      {dev.devotionDate ? format(toJsDate(dev.devotionDate), "MMM dd, yyyy") : ""}
                    </span>
                  </div>

                  {photo ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black/5 border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={dev.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-medium flex items-center gap-1">
                          <Eye className="h-3 w-3" /> View Photo & Details
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-muted/30 border border-dashed flex items-center justify-center text-muted-foreground text-xs">
                      <span>No photo attached</span>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-xs text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {dev.lessonName || dev.topic}
                    </h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                      Mentor: <span className="font-medium text-foreground">{dev.mentorName || "Mentor"}</span> • Mentees: {dev.attendeeNames?.join(", ") || "Mentee"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DEPARTMENT DETAILS & MINISTRIES / MENTEES DIALOG ── */}
      <Dialog
        open={!!viewingDept}
        onOpenChange={(open) => {
          if (!open) {
            setViewingDept(null);
            setDetailSearch("");
            setDetailMinistryFilter("all");
          }
        }}
      >
        <DialogContent
          className="rounded-3xl p-4 sm:p-6"
          style={{ width: "min(calc(100vw - 2rem), 56rem)", maxHeight: "min(calc(100svh - 8rem), 88vh)" }}
        >
          <DialogHeader>
            <div className="flex items-start gap-3">
              {viewingDeptMeta && (
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-xs shrink-0 tracking-tight mt-0.5", viewingDeptMeta.circleBg)}>
                  {viewingDeptMeta.code}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                    {viewingDept?.department} Department
                  </DialogTitle>
                  <Badge
                    className={`${
                      viewingDept?.status === "Needs Attention"
                        ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                        : "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                    } font-semibold text-xs border-transparent shrink-0`}
                  >
                    {viewingDept?.status}
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Assigned Head: <strong className="text-foreground">{viewingDept?.headName}</strong> •{" "}
                  {viewingDept?.completionPct}% overall mentee completion rate.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* 4-Card Mini Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-2">
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Ministries</p>
              <p className="text-xl font-black text-foreground font-headline mt-0.5">
                {viewingDept?.clusters?.length || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Groups</p>
              <p className="text-xl font-black text-sidebar dark:text-blue-400 font-headline mt-0.5">
                {viewingDept?.groupsCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Mentors</p>
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-headline mt-0.5">
                {viewingDept?.mentorsCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-muted/30 border border-border/50 text-center">
              <p className="text-[10px] uppercase font-bold text-muted-foreground">Mentees</p>
              <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-headline mt-0.5">
                {viewingDept?.menteesCount || 0}
              </p>
            </div>
          </div>

          {/* Tab Switcher & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3 pt-2">
            <div className="bg-slate-100 dark:bg-muted p-1 rounded-xl flex items-center gap-1 self-start">
              <button
                type="button"
                onClick={() => setActiveDetailTab("ministries")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeDetailTab === "ministries"
                    ? "bg-sidebar text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                <span>Ministries</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  activeDetailTab === "ministries" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-muted/80 text-slate-700 dark:text-slate-300"
                )}>
                  {viewingDept?.clusters?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab("mentors")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeDetailTab === "mentors"
                    ? "bg-sidebar text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                <span>Mentors</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  activeDetailTab === "mentors" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-muted/80 text-slate-700 dark:text-slate-300"
                )}>
                  {viewingDept?.deptMentors?.length || 0}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDetailTab("mentees")}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  activeDetailTab === "mentees"
                    ? "bg-sidebar text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 dark:text-muted-foreground dark:hover:text-foreground"
                )}
              >
                <span>Mentees</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-black",
                  activeDetailTab === "mentees" ? "bg-white/20 text-white" : "bg-slate-200 dark:bg-muted/80 text-slate-700 dark:text-slate-300"
                )}>
                  {viewingDept?.deptMentees?.length || 0}
                </span>
              </button>
            </div>

            {/* Search & Ministry Filter Toolbar (For Mentors & Mentees tabs) */}
            {activeDetailTab !== "ministries" && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative w-full sm:w-48">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder={activeDetailTab === "mentors" ? "Search mentors..." : "Search mentees..."}
                    value={detailSearch}
                    onChange={(e) => setDetailSearch(e.target.value)}
                    className="pl-8 pr-3 h-8 text-xs rounded-xl border-slate-200 dark:border-border"
                  />
                </div>
                {viewingDept?.clusters?.length > 0 && (
                  <Select value={detailMinistryFilter} onValueChange={setDetailMinistryFilter}>
                    <SelectTrigger className="h-8 w-36 text-xs rounded-xl border-slate-200 dark:border-border">
                      <SelectValue placeholder="All Ministries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all" className="text-xs">All Ministries</SelectItem>
                      {viewingDept.clusters.map((c: any) => (
                        <SelectItem key={c.value} value={c.name} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          {/* ── VIEW 1: MINISTRIES UNDER THIS DEPARTMENT ── */}
          {activeDetailTab === "ministries" && (
            <div className="space-y-3 pt-2">
              {(!viewingDept?.clusters || viewingDept.clusters.length === 0) ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                  No ministries configured under this department.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {viewingDept.clusters.map((cluster: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50/70 dark:bg-muted/20 border border-slate-200/80 dark:border-border/60 flex flex-col justify-between space-y-3 hover:border-sidebar/40 hover:shadow-xs transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 font-bold text-xs flex items-center justify-center shrink-0 border border-sidebar/20">
                            {cluster.name[0]}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-bold text-sm text-foreground truncate">
                              {cluster.name}
                            </h5>
                            <p className="text-[11px] text-muted-foreground">
                              {cluster.groupsCount} groups • {cluster.mentorsCount} mentors
                            </p>
                          </div>
                        </div>

                        <Badge variant="outline" className="text-xs font-semibold shrink-0">
                          {cluster.menteesCount} mentees
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-border/40">
                        <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDetailMinistryFilter(cluster.name);
                            setActiveDetailTab("mentors");
                          }}
                          className="h-7 px-3 rounded-lg bg-sidebar hover:bg-sidebar/90 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                        >
                          View Mentors ({cluster.mentorsCount}) →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 2: MENTORS & THEIR ASSIGNED MENTEES ── */}
          {activeDetailTab === "mentors" && (
            <div className="space-y-4 pt-2">
              {detailMinistryFilter !== "all" && (
                <div className="flex items-center justify-between px-3.5 py-2 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                  <span>Filtered to ministry: <strong>{detailMinistryFilter}</strong></span>
                  <button
                    type="button"
                    onClick={() => setDetailMinistryFilter("all")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {modalFilteredMentors.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-foreground text-sm">No mentors found</p>
                  <p className="mt-0.5">
                    {detailSearch || detailMinistryFilter !== "all"
                      ? "Try adjusting your search query or ministry filter."
                      : "No mentors are registered under this department yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalFilteredMentors.map((mentor: any) => (
                    <div
                      key={mentor.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3"
                    >
                      {/* Mentor Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/40">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                            {mentor.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-foreground">
                                {mentor.fullName}
                              </h4>
                              <Badge variant="outline" className="text-[10px] font-semibold bg-muted/40">
                                {mentor.ministryName}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              {mentor.email || mentor.phone || "Mentor"} {mentor.groupsCount > 0 ? `• ${mentor.groupsCount} active group(s)` : ""}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <Badge className="bg-sidebar text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full">
                            {mentor.menteesCount} Assigned {mentor.menteesCount === 1 ? "Mentee" : "Mentees"}
                          </Badge>
                        </div>
                      </div>

                      {/* Mentor's Assigned Mentees List */}
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-primary" />
                          Mentees under {mentor.fullName} ({mentor.mentees.length})
                        </p>

                        {mentor.mentees.length === 0 ? (
                          <div className="p-3 bg-muted/20 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                            No mentees assigned to this mentor yet.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {mentor.mentees.map((me: any) => {
                              const isMenteeActive = (me.status || "Active").toLowerCase() === "active";
                              const displayStatus = isMenteeActive ? "Active" : me.status || "Inactive";
                              const statusColorClass =
                                me.status === "Completed"
                                  ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                                  : isMenteeActive
                                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                                  : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
                              return (
                                <div key={me.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/50">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-7 h-7 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                                      {me.initials}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-semibold text-foreground text-xs truncate">{me.fullName}</p>
                                      <p className="text-[10px] text-muted-foreground truncate">{me.ministryName} {me.email ? `• ${me.email}` : ""}</p>
                                    </div>
                                  </div>
                                  <Badge variant="secondary" className={cn(statusColorClass, "px-2 py-0.5 rounded-full text-[10px] font-bold border-transparent shrink-0")}>
                                    {displayStatus}
                                  </Badge>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 3: ALL MENTEES UNDER THIS DEPARTMENT ── */}
          {activeDetailTab === "mentees" && (
            <div className="space-y-3 pt-2">
              {detailMinistryFilter !== "all" && (
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 dark:bg-blue-950/30 rounded-xl border border-blue-200/60 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                  <span>Filtered to ministry: <strong>{detailMinistryFilter}</strong></span>
                  <button
                    type="button"
                    onClick={() => setDetailMinistryFilter("all")}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Clear Filter
                  </button>
                </div>
              )}

              {modalFilteredMentees.length === 0 ? (
                <div className="p-12 text-center text-xs text-muted-foreground border border-dashed rounded-2xl">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="font-semibold text-foreground text-sm">No mentees found</p>
                  <p className="mt-0.5">
                    {detailSearch || detailMinistryFilter !== "all"
                      ? "Try adjusting your search query or ministry filter."
                      : "No mentees are registered under this department yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {modalFilteredMentees.map((m: any) => {
                    const isMenteeActive = (m.status || "Active").toLowerCase() === "active";
                    const displayStatus = isMenteeActive ? "Active" : m.status || "Inactive";
                    const statusColorClass =
                      m.status === "Completed"
                        ? "bg-purple-500/15 text-purple-700 dark:text-purple-300"
                        : isMenteeActive
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
                    return (
                      <div key={m.id} className="p-3 rounded-2xl bg-slate-50/70 dark:bg-muted/20 border border-slate-200/80 dark:border-border/60 flex items-center justify-between gap-3 hover:border-sidebar/40 hover:shadow-xs transition-all">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:text-blue-400 text-[10px] font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                            {m.initials}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{m.fullName}</p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {m.ministryName} • {m.mentorName ? `Mentor: ${m.mentorName}` : "No mentor"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Badge variant="secondary" className={cn(statusColorClass, "px-2.5 py-0.5 rounded-full text-[10px] font-bold border-transparent")}>
                            {displayStatus}
                          </Badge>
                          <span className="text-[10px] font-semibold text-muted-foreground">{m.progressPct}% done</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-4 pt-2 border-t border-border/60 flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              Showing {activeDetailTab === "ministries" ? `${viewingDept?.clusters?.length || 0} Ministries` : activeDetailTab === "mentors" ? `${modalFilteredMentors.length} Mentors` : `${modalFilteredMentees.length} Mentees`}
            </span>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- C2S Analytics Component ---
const C2SAnalytics = ({
  mentees,
  groups,
  devotions,
  workers,
  canGenerateReport = false,
  departmentClusters = {},
  headDepartment = "Outreach",
  isSuperAdmin = false,
  isMinistryHead = false,
  isHeadOrAdmin = false,
  onViewDevotion,
}: {
  mentees: any[];
  groups: any[];
  devotions: C2SDevotionRecord[];
  workers: any[];
  canGenerateReport?: boolean;
  departmentClusters?: Record<string, { value: string; label: string }[]>;
  headDepartment?: string;
  isSuperAdmin?: boolean;
  isMinistryHead?: boolean;
  isHeadOrAdmin?: boolean;
  onViewDevotion?: (devotion: C2SDevotionRecord) => void;
}) => {
  const [selectedCluster, setSelectedCluster] = useState("all");

  const formattedDeptName = headDepartment
    ? headDepartment.charAt(0).toUpperCase() + headDepartment.slice(1).toLowerCase()
    : "Outreach";

  // Dynamic cluster options for the Ministry Head's department
  const clusterOptions = useMemo(() => {
    const deptKey =
      Object.keys(departmentClusters || {}).find(
        (k) => k.toLowerCase() === (headDepartment || "outreach").toLowerCase()
      ) || "OUTREACH";
    const baseList = (departmentClusters && departmentClusters[deptKey]) || [];
    const existingGroupNames = Array.from(
      new Set(groups?.map((g) => g.name).filter(Boolean) || [])
    );
    const customList = existingGroupNames
      .filter((name) => !baseList.some((b) => b.value.toLowerCase().trim() === name.toLowerCase().trim()))
      .map((name) => ({ value: name.trim(), label: name.trim() }));

    const seen = new Set<string>();
    const uniqueOptions: { value: string; label: string }[] = [];
    for (const item of [...baseList, ...customList]) {
      const lower = (item.value || "").toLowerCase().trim();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        uniqueOptions.push({ value: item.value.trim(), label: item.label.trim() });
      }
    }
    return uniqueOptions;
  }, [departmentClusters, headDepartment, groups]);

  // Filter devotions by selected cluster
  const filteredDevotions = useMemo(() => {
    if (selectedCluster === "all") return devotions;
    const target = selectedCluster.toLowerCase().trim();
    return devotions.filter((d) => {
      const cluster = (d.clusterName || "").toLowerCase().trim();
      return (
        cluster.includes(target) ||
        cluster === target ||
        cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""))
      );
    });
  }, [devotions, selectedCluster]);

  // Filter groups by selected cluster
  const filteredGroups = useMemo(() => {
    if (selectedCluster === "all") return groups;
    const target = selectedCluster.toLowerCase().trim();
    return groups.filter((g) => {
      const name = (g.name || "").toLowerCase().trim();
      return name.includes(target) || name === target;
    });
  }, [groups, selectedCluster]);

  // Filter mentees by selected cluster
  const filteredMentees = useMemo(() => {
    if (selectedCluster === "all") return mentees;
    const target = selectedCluster.toLowerCase().trim();
    const groupIds = new Set(filteredGroups.map((g) => g.id));
    return mentees.filter((m) => {
      if (m.groupId && groupIds.has(m.groupId)) return true;
      const cluster = (m.clusterName || m.groupName || "").toLowerCase().trim();
      return cluster.includes(target) || cluster === target;
    });
  }, [mentees, filteredGroups, selectedCluster]);

  // Status breakdown data for Donut Chart
  const statusData = useMemo(() => {
    return [
      {
        name: "In Progress",
        value: filteredMentees.filter((m) => m.status === "In Progress").length,
        color: "#f59e0b",
      },
      {
        name: "Completed",
        value: filteredMentees.filter((m) => m.status === "Completed").length,
        color: "#10b981",
      },
      {
        name: "Dropped",
        value: filteredMentees.filter((m) => m.status === "Dropped").length,
        color: "#ef4444",
      },
    ].filter((d) => d.value > 0);
  }, [filteredMentees]);

  // Devotions count by cluster for Bar Chart
  const clusterDevotionsData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredDevotions.forEach((d) => {
      const c = d.clusterName || "Other";
      counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
    }));
  }, [filteredDevotions]);

  // Total attendees reached
  const totalAttendeesReached = useMemo(() => {
    return filteredDevotions.reduce((acc, curr) => acc + (curr.attendeeCount || 0), 0);
  }, [filteredDevotions]);

  // Retention rate calculation
  const completed = useMemo(
    () => filteredMentees.filter((m) => m.status === "Completed").length,
    [filteredMentees]
  );
  const dropped = useMemo(
    () => filteredMentees.filter((m) => m.status === "Dropped").length,
    [filteredMentees]
  );
  const inProgress = useMemo(
    () => filteredMentees.filter((m) => m.status === "In Progress").length,
    [filteredMentees]
  );
  const totalFinished = completed + dropped;
  const retentionRate =
    totalFinished > 0 ? Math.round((completed / totalFinished) * 100) : 0;

  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

  const handleExportCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CONNECT 2 SOULS - ANALYTICS SUMMARY REPORT\n";
    csvContent += `Generated Date,${format(new Date(), "yyyy-MM-dd HH:mm:ss")}\n`;
    csvContent += `Filtered Cluster,${selectedCluster === "all" ? `All ${formattedDeptName} Ministries` : selectedCluster}\n\n`;

    csvContent += "METRIC SUMMARY,VALUE\n";
    csvContent += `Total Devotions Logged,${filteredDevotions.length}\n`;
    csvContent += `Mentee Attendees Reached,${totalAttendeesReached}\n`;
    csvContent += `Mentee Retention Rate,${retentionRate}%\n`;
    csvContent += `Active Groups,${filteredGroups.length}\n`;
    csvContent += `Total Enrolled Mentees,${filteredMentees.length}\n`;
    csvContent += `Completed Mentees,${completed}\n`;
    csvContent += `In Progress Mentees,${inProgress}\n`;
    csvContent += `Dropped Mentees,${dropped}\n\n`;

    csvContent += "DEVOTION SESSIONS LOG\n";
    csvContent += "Date,Lesson Topic,Mentor,Attendees,Prayer Request\n";
    filteredDevotions.forEach((d) => {
      const date = d.devotionDate ? format(toJsDate(d.devotionDate), "yyyy-MM-dd") : "";
      const topic = (d.lessonName || d.topic || "").replace(/"/g, '""');
      const mentor = (d.mentorName || "").replace(/"/g, '""');
      const prayer = (d.prayerRequests || "").replace(/"/g, '""');
      const attendees = (d.attendeeNames || []).join("; ").replace(/"/g, '""');
      csvContent += `"${date}","${topic}","${mentor}","${attendees}","${prayer}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `C2S_Analytics_Report_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── TOP KPI SUMMARY CARDS (4 CARDS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="DEVOTIONS LOGGED"
          value={filteredDevotions.length}
          sub={selectedCluster === "all" ? `Across all ${formattedDeptName} clusters` : `Cluster: ${selectedCluster}`}
          icon={BookOpen}
          accentColor="bg-sidebar"
          iconClass="text-sidebar dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="ATTENDEES REACHED"
          value={totalAttendeesReached}
          sub="Cumulative session attendance"
          icon={Users}
          accentColor="bg-blue-500"
          iconClass="text-blue-600 dark:text-blue-400"
          iconBgClass="bg-blue-50 dark:bg-blue-950/40"
        />
        <StatCard
          label="RETENTION RATE"
          value={`${retentionRate}%`}
          sub="Active mentee retention"
          icon={TrendingUp}
          accentColor="bg-emerald-500"
          iconClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
        />
        <StatCard
          label="ACTIVE GROUPS"
          value={filteredGroups.length}
          sub={`${filteredMentees.length} total enrolled mentees`}
          icon={ShieldCheck}
          accentColor="bg-purple-500"
          iconClass="text-purple-600 dark:text-purple-400"
          iconBgClass="bg-purple-50 dark:bg-purple-950/40"
        />
      </div>

      {/* ── SECTION DIVIDER ── */}
      <Separator className="bg-slate-200 dark:bg-slate-700/80 h-[1px]" />

      {/* ── FILTER & ACTION TOOLBAR (Consistent with Devotions & Mentees Tabs) ── */}
      <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white dark:bg-card p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-border shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full lg:w-auto">
          {/* Dynamic Cluster/Sub-Ministry Filter: Only shown for Ministry Head / Admin */}
          {(isSuperAdmin || isMinistryHead || isHeadOrAdmin) && (
            <Select
              value={selectedCluster}
              onValueChange={(val) => setSelectedCluster(val)}
            >
              <SelectTrigger className="w-full sm:w-[240px] bg-background dark:bg-muted/30 text-xs font-semibold text-foreground border border-slate-200/90 dark:border-border rounded-2xl h-10 shadow-2xs focus:ring-1 focus:ring-sidebar/40 focus:border-sidebar transition-all cursor-pointer">
                <SelectValue placeholder={isSuperAdmin ? "All Departments & Ministries" : `All ${formattedDeptName} Ministries`} />
              </SelectTrigger>
              <SelectContent className="max-h-96 overflow-y-auto">
                <SelectItem value="all" className="text-xs font-bold text-primary">
                  {isSuperAdmin ? "All Departments & Ministries" : `All ${formattedDeptName} Ministries`}
                </SelectItem>
                {isSuperAdmin ? (
                  WORDA_ORDER.map((dept) => {
                    const items = departmentClusters[dept] || [];
                    if (!items || items.length === 0) return null;
                    const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                    return (
                      <SelectGroup key={dept}>
                        <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                          {titleLabel}
                        </SelectLabel>
                        {items.map((item, idx) => (
                          <SelectItem key={`analytics-cluster-${dept}-${item.value}-${idx}`} value={item.value} className="text-xs pl-6 cursor-pointer">
                            • {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })
                ) : (
                  <SelectGroup>
                    <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                      {formattedDeptName.toUpperCase()} MINISTRIES
                    </SelectLabel>
                    {clusterOptions.map((item, idx) => (
                      <SelectItem key={`analytics-cluster-${item.value}-${idx}`} value={item.value} className="text-xs pl-6 cursor-pointer">
                        • {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          )}

          <Badge variant="outline" className="text-xs font-semibold h-10 px-3.5 rounded-2xl border-slate-200/80 dark:border-border bg-slate-50 dark:bg-muted/30">
            {filteredDevotions.length} Logged Devotions
          </Badge>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="h-10 px-4 text-xs font-semibold rounded-2xl border border-slate-200/90 dark:border-border bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted text-slate-700 dark:text-slate-200 shadow-2xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />
            <span>Export CSV</span>
          </Button>

          {canGenerateReport && (
            <Button
              onClick={() => setIsReportDialogOpen(true)}
              className="h-10 px-4 gap-2 rounded-2xl bg-sidebar hover:bg-sidebar/90 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="h-4 w-4" />
              Generate Analytics Report
            </Button>
          )}
        </div>
      </div>

      {/* ── ANALYTICS CHARTS GRID ── */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200/80 dark:border-border/80 bg-white dark:bg-card shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-headline font-bold text-foreground tracking-tight">
                Devotions by Cluster
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Volume of recorded devotion sessions per cluster group.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 shrink-0">
              <BarChart3 className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="h-[280px]">
            {clusterDevotionsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clusterDevotionsData}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} />
                  <YAxis stroke="#888888" fontSize={12} allowDecimals={false} />
                  <ReTooltip />
                  <Bar
                    dataKey="count"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground gap-1.5 border border-dashed rounded-xl bg-slate-50/40 dark:bg-muted/10">
                <BarChart3 className="h-6 w-6 opacity-30" />
                <span>No devotion sessions recorded yet.</span>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200/80 dark:border-border/80 bg-white dark:bg-card shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-headline font-bold text-foreground tracking-tight">
                Mentee Status Breakdown
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Overall distribution of mentoring progress across members.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 shrink-0">
              <PieChartIcon className="h-4.5 w-4.5" />
            </div>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip />
                <Legend />
              </RePieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── SECTION DIVIDER ── */}
      <Separator className="bg-slate-200 dark:bg-slate-700/80 h-[1px]" />

      {/* ── RECENT DEVOTION SESSIONS & PHOTO PROOFS ── */}
      <div className="space-y-4 pt-1">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-headline font-bold text-foreground flex items-center gap-2">
              <Camera className="h-4.5 w-4.5 text-primary" />
              Devotion Proofs & Session Records
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedCluster === "all"
                ? `Recent devotion sessions logged across ${formattedDeptName} Ministries.`
                : `Recent devotion sessions for ${selectedCluster}.`}
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold px-3 py-1 rounded-full border-slate-200/80 dark:border-border bg-slate-50 dark:bg-muted/30 self-start sm:self-auto">
            {filteredDevotions.length} Logged Devotions
          </Badge>
        </div>

        {filteredDevotions.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-dashed border-slate-200 dark:border-border bg-slate-50/50 dark:bg-muted/10 text-muted-foreground space-y-2">
            <BookOpen className="h-8 w-8 mx-auto text-slate-400 dark:text-slate-500 opacity-50" />
            <p className="text-sm font-semibold text-foreground">No devotion sessions recorded</p>
            <p className="text-xs text-muted-foreground">No records match the current filter selection.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDevotions.slice(0, 6).map((dev) => {
              const photo = dev.photoUrls?.[0] || dev.photoUrl;
              return (
                <div
                  key={dev.id}
                  onClick={() => onViewDevotion?.(dev)}
                  className="group cursor-pointer rounded-2xl border border-gray-200/80 dark:border-border/80 p-4 bg-white dark:bg-card hover:border-sidebar/40 hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full text-[11px]">
                      {dev.clusterName || "General"}
                    </span>
                    <span className="text-muted-foreground text-[11px] font-medium">
                      {dev.devotionDate ? format(toJsDate(dev.devotionDate), "MMM dd, yyyy") : ""}
                    </span>
                  </div>

                  {photo ? (
                    <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-muted/30 border border-slate-200/60 dark:border-border/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photo}
                        alt={dev.topic}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[11px] text-white font-semibold flex items-center gap-1.5">
                          <Eye className="h-3.5 w-3.5" /> View Photo & Details
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video w-full rounded-xl bg-slate-50 dark:bg-muted/20 border border-dashed border-slate-200 dark:border-border/60 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                      <Camera className="h-5 w-5 opacity-40" />
                      <span>No photo attached</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-headline font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {dev.lessonName || dev.topic}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      Mentor: <span className="font-medium text-foreground">{dev.mentorName || "—"}</span> • Mentees: {dev.attendeeNames?.join(", ") || "—"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GENERATE REPORT DIALOG MODAL ── */}
      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          <DialogHeader className="pr-8 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary/10 text-primary font-medium text-xs rounded-full border-transparent">
                OFFICIAL C2S REPORT
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
              Connect 2 Souls Analytics Report
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official summary report for devotions, groups, retention, and mentee progress.
            </DialogDescription>
          </DialogHeader>

          {/* Printable / Viewable Report Preview */}
          <div className="space-y-4 my-2 p-5 rounded-2xl bg-muted/20 border border-border/60">
            <div className="flex justify-between items-center border-b border-border/60 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-foreground">
                  Ministry Analytics Overview
                </h3>
                <p className="text-xs text-muted-foreground">
                  Date: {format(new Date(), "MMMM dd, yyyy")}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                Verified Report
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-card rounded-xl border border-border/50">
                <p className="text-muted-foreground font-medium">
                  Total Devotions Logged
                </p>
                <p className="text-xl font-black text-primary">
                  {filteredDevotions.length}
                </p>
              </div>
              <div className="p-3 bg-card rounded-xl border border-border/50">
                <p className="text-muted-foreground font-medium">
                  Cumulative Attendance
                </p>
                <p className="text-xl font-black text-amber-600">
                  {totalAttendeesReached}
                </p>
              </div>
              <div className="p-3 bg-card rounded-xl border border-border/50">
                <p className="text-muted-foreground font-medium">
                  Mentee Retention Rate
                </p>
                <p className="text-xl font-black text-emerald-600">
                  {retentionRate}%
                </p>
              </div>
              <div className="p-3 bg-card rounded-xl border border-border/50">
                <p className="text-muted-foreground font-medium">
                  Active Groups / Mentees
                </p>
                <p className="text-xl font-black text-indigo-600">
                  {filteredGroups.length} / {filteredMentees.length}
                </p>
              </div>
            </div>

            <div className="pt-2 space-y-1.5">
              <p className="text-xs font-bold text-foreground">
                Mentoring Status Summary
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                <span>In Progress</span>
                <span className="font-bold text-amber-600">
                  {inProgress} mentees
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                <span>Completed</span>
                <span className="font-bold text-emerald-600">
                  {completed} mentees
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground p-2.5 rounded-xl bg-card border">
                <span>Dropped</span>
                <span className="font-bold text-red-500">
                  {dropped} mentees
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between mt-4">
            <Button
              variant="outline"
              onClick={() => setIsReportDialogOpen(false)}
              className="rounded-xl px-5 text-xs font-semibold cursor-pointer border-slate-200 dark:border-border"
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                className="rounded-xl gap-1.5 text-xs font-semibold cursor-pointer border-slate-200 dark:border-border"
              >
                <FileText className="h-4 w-4" /> Export CSV
              </Button>
              <Button
                onClick={() => window.print()}
                className="rounded-xl gap-1.5 text-xs bg-sidebar hover:bg-sidebar/90 text-white font-bold shadow-xs cursor-pointer"
              >
                <Download className="h-4 w-4" /> Print / Save PDF
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// departmentClusters is now derived from DB — see departmentClusters useMemo in C2SPage

// ─── MAIN CONNECT 2 SOULS PAGE COMPONENT ─────────────────────────────────
function C2SPageContent() {
  const { user } = useAuthStore();
  const { canManageC2S, canViewC2SAnalytics, isSuperAdmin, isMinistryHead, myMinistryIds, allRoles } = useUserRole();
  const { workerProfile } = usePermissionsStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries placed at top of component
  const { data: devotions, isLoading: devotionsLoading } = useQuery({
    queryKey: ["c2s-devotions", { actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }],
    queryFn: () => getC2SDevotionRecords({ actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }),
  });

  const { data: rawGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ["c2s-groups", { actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }],
    queryFn: () => getC2SGroups({ actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }),
  });
  const groups = useMemo<any[]>(() => {
    if (Array.isArray(rawGroups)) return rawGroups;
    if (rawGroups && Array.isArray((rawGroups as any).groups)) return (rawGroups as any).groups;
    return [];
  }, [rawGroups]);

  const { data: rawMentees, isLoading: menteesLoading } = useQuery({
    queryKey: ["c2s-mentees", { actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }],
    queryFn: () => getC2SMentees({ actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }),
  });
  const mentees = useMemo<any[]>(() => {
    if (Array.isArray(rawMentees)) return rawMentees;
    if (rawMentees && Array.isArray((rawMentees as any).mentees)) return (rawMentees as any).mentees;
    return [];
  }, [rawMentees]);

  const { data: rawWorkers, isLoading: workersLoading } = useQuery({
    queryKey: ["workers", "all", { actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }],
    queryFn: () => getWorkers({ actorId: workerProfile?.id, ministryIds: !isSuperAdmin ? myMinistryIds : undefined }),
  });
  const workers = useMemo<Worker[]>(() => {
    if (Array.isArray(rawWorkers)) return rawWorkers as Worker[];
    if (rawWorkers && Array.isArray((rawWorkers as any).workers)) return (rawWorkers as any).workers as Worker[];
    return [];
  }, [rawWorkers]);

  const { data: rawMinistries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });
  const allMinistries = useMemo<any[]>(() => {
    if (Array.isArray(rawMinistries)) return rawMinistries;
    if (rawMinistries && Array.isArray((rawMinistries as any).ministries)) return (rawMinistries as any).ministries;
    return [];
  }, [rawMinistries]);

  const { data: rawDepartmentSettings } = useQuery({
    queryKey: ["department-settings"],
    queryFn: getDepartmentSettings,
  });
  const departmentSettings = useMemo<any[]>(() => {
    if (Array.isArray(rawDepartmentSettings)) return rawDepartmentSettings;
    return [];
  }, [rawDepartmentSettings]);

  // Derive department → ministry list from DB with complete mapping in strict WORDA order
  const departmentClusters = useMemo<Record<string, { value: string; label: string }[]>>(() => {
    const map: Record<string, { value: string; label: string }[]> = {
      WORSHIP: [...DEFAULT_DEPARTMENT_CLUSTERS.WORSHIP],
      OUTREACH: [...DEFAULT_DEPARTMENT_CLUSTERS.OUTREACH],
      RELATIONSHIP: [...DEFAULT_DEPARTMENT_CLUSTERS.RELATIONSHIP],
      DISCIPLESHIP: [...DEFAULT_DEPARTMENT_CLUSTERS.DISCIPLESHIP],
      ADMINISTRATION: [...DEFAULT_DEPARTMENT_CLUSTERS.ADMINISTRATION],
    };

    if (allMinistries && allMinistries.length > 0) {
      const dbByDept: Record<string, { value: string; label: string }[]> = {
        WORSHIP: [],
        OUTREACH: [],
        RELATIONSHIP: [],
        DISCIPLESHIP: [],
        ADMINISTRATION: [],
      };

      const seenPerDept: Record<string, Set<string>> = {
        WORSHIP: new Set(),
        OUTREACH: new Set(),
        RELATIONSHIP: new Set(),
        DISCIPLESHIP: new Set(),
        ADMINISTRATION: new Set(),
      };

      for (const m of allMinistries) {
        if (!m || !m.name) continue;
        const rawCode = (m.departmentCode || "").toUpperCase().trim();
        const rawDeptName = (
          typeof m.department === "string"
            ? m.department
            : m.department?.name || ""
        ).toUpperCase().trim();

        let targetKey = "";
        if (rawCode === "W" || rawDeptName.includes("WORSHIP")) {
          targetKey = "WORSHIP";
        } else if (rawCode === "O" || rawDeptName.includes("OUTREACH")) {
          targetKey = "OUTREACH";
        } else if (rawCode === "R" || rawDeptName.includes("RELATIONSHIP")) {
          targetKey = "RELATIONSHIP";
        } else if (rawCode === "D" || rawDeptName.includes("DISCIPLESHIP")) {
          targetKey = "DISCIPLESHIP";
        } else if (rawCode === "A" || rawDeptName.includes("ADMIN")) {
          targetKey = "ADMINISTRATION";
        }

        if (targetKey && dbByDept[targetKey]) {
          const trimmedName = m.name.trim();
          const lower = trimmedName.toLowerCase();
          if (!seenPerDept[targetKey].has(lower)) {
            seenPerDept[targetKey].add(lower);
            dbByDept[targetKey].push({ value: trimmedName, label: trimmedName });
          }
        }
      }

      for (const k of WORDA_ORDER) {
        if (dbByDept[k] && dbByDept[k].length > 0) {
          map[k] = dbByDept[k];
        }
      }
    }

    // Add single-letter alias lookups for backward compatibility
    map["W"] = map["WORSHIP"];
    map["O"] = map["OUTREACH"];
    map["R"] = map["RELATIONSHIP"];
    map["D"] = map["DISCIPLESHIP"];
    map["A"] = map["ADMINISTRATION"];

    return map;
  }, [allMinistries]);

  const getRoleString = (raw: any): string => {
    if (!raw) return "";
    if (typeof raw === "string") return raw.toLowerCase().trim();
    if (typeof raw === "object" && raw.name && typeof raw.name === "string") return raw.name.toLowerCase().trim();
    if (typeof raw === "object" && raw.role && typeof raw.role === "string") return raw.role.toLowerCase().trim();
    return "";
  };

  const matchedRoleObj = Array.isArray(allRoles)
    ? allRoles.find((r: any) => r && (r.id === workerProfile?.roleId || r.id === (workerProfile as any)?.role?.id))
    : null;

  const userRoleName = getRoleString(matchedRoleObj?.name || (workerProfile as any)?.role || (workerProfile as any)?.role?.name || "");

  // Strict Admin detection: ONLY true if the CURRENT USER is Super Admin or has an Admin role
  const isAdminUser = Boolean(
    isSuperAdmin ||
    userRoleName === "admin" ||
    userRoleName === "super admin" ||
    userRoleName.includes("admin")
  );

  // Strict Ministry Head detection: ONLY true if the CURRENT USER is a Ministry Head (NOT worker, NOT admin)
  const isExplicitHeadInMinistries = Boolean(
    Array.isArray(allMinistries) &&
    workerProfile?.id &&
    allMinistries.some((m: any) => m.headId === workerProfile.id || m.approverId === workerProfile.id)
  );

  const isMinistryHeadUser = Boolean(
    !isAdminUser && (
      isExplicitHeadInMinistries ||
      ((isMinistryHead ||
        userRoleName.includes("head") ||
        userRoleName.includes("lead") ||
        userRoleName.includes("manager") ||
        userRoleName.includes("overseer") ||
        userRoleName.includes("pastor") ||
        userRoleName.includes("director")) &&
       userRoleName !== "worker" &&
       workerProfile?.roleId !== "viewer")
    )
  );

  // Mentor Account: Any worker who is not Admin and not Ministry Head
  const isMentorUser = Boolean(!isAdminUser && !isMinistryHeadUser);
  const isHeadOrAdmin = Boolean(isAdminUser || isMinistryHeadUser);
  const canManageGroupAssignment = isHeadOrAdmin;
  const canGenerateAnalyticsReport = isHeadOrAdmin;

  const searchParams = useSearchParams();
  const router = useRouter();

  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (tabParam === "overview" && isAdminUser) return "overview";
    if (tabParam === "mentees" || tabParam === "groups") return "mentees";
    if (tabParam === "analytics") return isHeadOrAdmin ? "analytics" : "devotions";
    if (tabParam && tabParam !== "overview") return tabParam;
    return isAdminUser ? "overview" : "devotions";
  });

  // Sync tab from URL query param (e.g. from sidebar sub-items click)
  useEffect(() => {
    const currentTab = searchParams.get("tab");
    if (currentTab) {
      if (currentTab === "overview" && isAdminUser) {
        setActiveTab("overview");
      } else if (currentTab === "analytics") {
        setActiveTab(isHeadOrAdmin ? "analytics" : "devotions");
      } else if (["devotions", "groups", "mentees"].includes(currentTab)) {
        setActiveTab(currentTab === "groups" ? "mentees" : currentTab);
      }
    } else if (isAdminUser && !tabParam) {
      setActiveTab("overview");
    }
  }, [searchParams, isAdminUser, isHeadOrAdmin, tabParam]);

  const handleTabChange = (val: string) => {
    const normalized = val === "groups" ? "mentees" : val;
    setActiveTab(normalized);
    router.push(`/c2s?tab=${normalized}`);
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClusterFilter, setSelectedClusterFilter] = useState("all");
  const [selectedManualFilter, setSelectedManualFilter] = useState("all");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("all");
  const [menteeDeptFilter, setMenteeDeptFilter] = useState("all");

  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Record<string, boolean>>({});
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroupIds((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Dialog & Sheet states
  const [isDevotionSheetOpen, setIsDevotionSheetOpen] = useState(false);
  const [editingDevotion, setEditingDevotion] = useState<C2SDevotionRecord | null>(null);
  const [viewingDevotion, setViewingDevotion] = useState<C2SDevotionRecord | null>(null);

  const [isGroupSheetOpen, setIsGroupSheetOpen] = useState(false);
  const [isMenteeSheetOpen, setIsMenteeSheetOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any | null>(null);
  const [selectedMentee, setSelectedMentee] = useState<any | null>(null);
  const [viewingMenteeDetail, setViewingMenteeDetail] = useState<any | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "group" | "mentee" | "devotion";
    name: string;
  } | null>(null);

  const [groupSearchQuery, setGroupSearchQuery] = useState("");
  const [selectedGroupClusterFilter, setSelectedGroupClusterFilter] = useState("all");

  // Filter groups: Mentor account sees only their own group(s), Ministry Head sees their department's groups, Admin sees all groups with filter options
  const displayedGroups = useMemo(() => {
    if (!groups) return [];

    let result = groups;

    // Role filtering:
    if (isMentorUser && workerProfile?.id) {
      // Mentor strictly only sees their own assigned group(s)
      result = groups.filter((g) => g.mentorId === workerProfile.id);
    } else if (isMinistryHeadUser && !isAdminUser) {
      // Ministry Head sees groups under their department
      const userMinistry = allMinistries?.find(
        (m: any) => m.id === workerProfile?.majorMinistryId || myMinistryIds?.includes(m.id)
      );
      const userDept = userMinistry?.department || (workerProfile as any)?.department || "Outreach";
      const myDeptClusters = (
        departmentClusters[userDept] ||
        departmentClusters["OUTREACH"] ||
        []
      ).map((c) => c.value.toLowerCase());

      const deptGroups = groups.filter((g) => {
        const gName = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const isMentorInDept = Boolean(
          mentor &&
          (mentor.majorMinistryId === workerProfile?.majorMinistryId ||
           (mentor.majorMinistryId && myMinistryIds?.includes(mentor.majorMinistryId)) ||
           mentor.id === workerProfile?.id)
        );
        return (
          myDeptClusters.some((c) => gName.includes(c) || c.includes(gName)) ||
          g.mentorId === workerProfile?.id ||
          isMentorInDept
        );
      });
      result = deptGroups;
    }

    // Sub-ministry Cluster filter for Ministry Head / Admin
    if (selectedGroupClusterFilter !== "all") {
      const filterLower = selectedGroupClusterFilter.toLowerCase().trim();
      result = result.filter((g) => {
        const gName = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const mMin = allMinistries?.find((m: any) => m.id === mentor?.majorMinistryId);
        const minName = (mMin?.name || "").toLowerCase();
        const minDept = (mMin?.department || (mentor as any)?.department || "").toLowerCase();
        return (
          gName.includes(filterLower) ||
          minName.includes(filterLower) ||
          minDept.includes(filterLower) ||
          filterLower.includes(minName)
        );
      });
    }

    // Keyword search filter (mentor name, mentee name, or group name)
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase().trim();
      result = result.filter((g) => {
        const gName = (g.name || "").toLowerCase();
        const mentor = workers?.find((w) => w.id === g.mentorId);
        const mName = mentor ? `${mentor.firstName} ${mentor.lastName}`.toLowerCase() : "";
        const groupMentees = mentees?.filter((m) => m.groupId === g.id || (g.mentorId && m.mentorId === g.mentorId)) || [];
        const hasMatchingMentee = groupMentees.some((m) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(q)
        );
        return mName.includes(q) || hasMatchingMentee || gName.includes(q);
      });
    }

    return result;
  }, [
    groups,
    isMentorUser,
    isMinistryHeadUser,
    isAdminUser,
    workerProfile,
    allMinistries,
    myMinistryIds,
    departmentClusters,
    selectedGroupClusterFilter,
    groupSearchQuery,
    mentees,
    workers,
  ]);

  const [localDevotions, setLocalDevotions] = useState<C2SDevotionRecord[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("c2s_devotions_storage");
        if (saved) return JSON.parse(saved);
      } catch (e) {}
    }
    return [];
  });

  // Merged devotions list: Combines database server records with persistent client records
  const allDevotions: C2SDevotionRecord[] = useMemo(() => {
    const serverList: C2SDevotionRecord[] = (Array.isArray(devotions) ? devotions : []) as any[];
    const merged: C2SDevotionRecord[] = [...serverList];
    const seenIds = new Set(serverList.map((d: any) => d.id));

    localDevotions.forEach((ld) => {
      if (ld && ld.id && !seenIds.has(ld.id)) {
        merged.push(ld);
        seenIds.add(ld.id);
      }
    });

    return merged;
  }, [devotions, localDevotions]);

  // --- Mutations ---
  const createDevotionMutation = useMutation({
    mutationFn: createC2SDevotionRecord,
    onSuccess: (newRecord) => {
      if (newRecord) {
        setLocalDevotions((prev) => {
          const updated = [newRecord, ...prev.filter((d) => d.id !== newRecord.id)];
          try {
            localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        queryClient.setQueryData(["c2s-devotions"], (old: any) => {
          if (!old || !Array.isArray(old)) return [newRecord];
          return [newRecord, ...old.filter((item: any) => item.id !== newRecord.id)];
        });
      }
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Submitted", description: "Your devotion session has been recorded successfully." });
    },
  });

  const updateDevotionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SDevotionRecord(id, data),
    onSuccess: (updatedRecord) => {
      if (updatedRecord) {
        setLocalDevotions((prev) => {
          const updated = prev.map((d) => (d.id === updatedRecord.id ? updatedRecord : d));
          try {
            localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
          } catch (e) {}
          return updated;
        });
        queryClient.setQueryData(["c2s-devotions"], (old: any) => {
          if (!old || !Array.isArray(old)) return [updatedRecord];
          return old.map((item: any) => (item.id === updatedRecord.id ? updatedRecord : item));
        });
      }
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Updated" });
    },
  });

  const deleteDevotionMutation = useMutation({
    mutationFn: deleteC2SDevotionRecord,
    onSuccess: (_, deletedId) => {
      setLocalDevotions((prev) => {
        const updated = prev.filter((d) => d.id !== deletedId);
        try {
          localStorage.setItem("c2s_devotions_storage", JSON.stringify(updated));
        } catch (e) {}
        return updated;
      });
      queryClient.setQueryData(["c2s-devotions"], (old: any) => {
        if (!old || !Array.isArray(old)) return [];
        return old.filter((item: any) => item.id !== deletedId);
      });
      queryClient.invalidateQueries({ queryKey: ["c2s-devotions"] });
      toast({ title: "Devotion Record Deleted" });
    },
  });

  const createGroupMutation = useMutation({
    mutationFn: createC2SGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Group Created" });
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Group Updated" });
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: deleteC2SGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      toast({ title: "Group Deleted" });
    },
  });

  const createMenteeMutation = useMutation({
    mutationFn: createC2SMentee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Mentee Added" });
    },
  });

  const updateMenteeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateC2SMentee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      toast({ title: "Mentee Updated" });
    },
  });

  const deleteMenteeMutation = useMutation({
    mutationFn: deleteC2SMentee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["c2s-mentees"] });
      queryClient.invalidateQueries({ queryKey: ["c2s-groups"] });
      toast({ title: "Mentee Deleted" });
    },
  });

  const getWorker = (id: string) => workers?.find((w) => w.id === id);

  // Find user's department: check majorMinistryId, myMinistryIds, headId, or worker department (defaults to Outreach)
  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      myMinistryIds?.includes(m.id) ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDepartment =
    userMinistry?.department || (workerProfile as any)?.department || "Outreach";

  // Dynamic cluster options: for Ministry Head, strictly returns ONLY ministries under their department (e.g. Outreach Ministries)
  const activeClusterOptions = useMemo(() => {
    const deptKey = (headDepartment || "Outreach").toUpperCase();
    const baseList =
      departmentClusters[deptKey] ||
      departmentClusters[headDepartment] ||
      departmentClusters["OUTREACH"] ||
      [];

    const seen = new Set<string>();
    const uniqueList: { value: string; label: string }[] = [];
    for (const item of baseList) {
      const lower = (item.value || "").toLowerCase().trim();
      if (lower && !seen.has(lower)) {
        seen.add(lower);
        uniqueList.push({ value: item.value.trim(), label: item.label.trim() });
      }
    }
    return uniqueList;
  }, [headDepartment, departmentClusters]);

  // Filtered devotion records
  const filteredDevotions = useMemo(() => {
    return allDevotions.filter((item) => {
      // 1. Role-based scoping
      if (isMentorUser) {
        // Mentor account strictly only views their own devotions
        const myFullName = workerProfile
          ? `${workerProfile.firstName || ""} ${workerProfile.lastName || ""}`.trim().toLowerCase()
          : "";
        const matchesMentorId = Boolean(workerProfile?.id && item.mentorId === workerProfile.id);
        const matchesMentorName = Boolean(
          myFullName && item.mentorName && item.mentorName.trim().toLowerCase() === myFullName
        );
        const matchesUserId = Boolean(user?.id && (item as any).userId === user.id);
        const matchesEmail = Boolean(
          user?.email && (item as any).mentorEmail && (item as any).mentorEmail.toLowerCase() === user.email.toLowerCase()
        );
        const userGroupIds = groups?.filter((g) => g.mentorId === workerProfile?.id).map((g) => g.id) || [];
        const matchesGroup = Boolean(item.groupId && userGroupIds.includes(item.groupId));

        if (!matchesMentorId && !matchesMentorName && !matchesUserId && !matchesEmail && !matchesGroup) {
          return false;
        }
      } else if (isMinistryHeadUser && !isAdminUser) {
        // Ministry Head account sees all devotions within their department (e.g. Outreach)
        const myDeptClusterValues = activeClusterOptions.map((c) => c.value.toLowerCase());
        const cluster = (item.clusterName || "").toLowerCase().trim();
        const mentorWorker = Array.isArray(workers) ? workers.find((w) => w.id === item.mentorId) : undefined;
        const isMentorInMyDept = Boolean(
          mentorWorker &&
          (mentorWorker.majorMinistryId === workerProfile?.majorMinistryId ||
           (mentorWorker.majorMinistryId && myMinistryIds?.includes(mentorWorker.majorMinistryId)) ||
           mentorWorker.id === workerProfile?.id)
        );
        const isClusterInMyDept = myDeptClusterValues.some((c) => cluster.includes(c) || c.includes(cluster));

        // If specific cluster is selected
        if (selectedClusterFilter !== "all") {
          const target = selectedClusterFilter.toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));
          if (!isMatch) return false;
        } else {
          // When 'all', must belong to their department's clusters or their department's mentors
          if (myDeptClusterValues.length > 0 && !isClusterInMyDept && !isMentorInMyDept && item.mentorId !== workerProfile?.id) {
            const group = groups?.find((g) => g.id === item.groupId);
            const gName = (group?.name || "").toLowerCase();
            const groupMatches = myDeptClusterValues.some((c) => gName.includes(c) || c.includes(gName));
            if (!groupMatches) return false;
          }
        }
      } else if (isAdminUser) {
        // Super Admin / Admin: Department / Ministry filter
        if (selectedDeptFilter !== "all") {
          const target = selectedDeptFilter.toLowerCase().trim();
          const cluster = (item.clusterName || "").toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));

          if (!isMatch) {
            let deptMatch = false;
            const deptClusters = (
              departmentClusters[selectedDeptFilter] ||
              departmentClusters[selectedDeptFilter.toUpperCase()] ||
              []
            ).map((c) => c.value.toLowerCase());
            if (deptClusters.some((c) => cluster.includes(c))) {
              deptMatch = true;
            }
            if (!deptMatch) {
              return false;
            }
          }
        }

        // Cluster / Ministry filter
        if (selectedClusterFilter !== "all") {
          const target = selectedClusterFilter.toLowerCase().trim();
          const cluster = (item.clusterName || "").toLowerCase().trim();
          const isMatch =
            cluster.includes(target) ||
            cluster === target ||
            cluster.replace(/\s+/g, "").includes(target.replace(/\s+/g, ""));

          if (!isMatch) {
            return false;
          }
        }
      }

      // Manual filter
      if (selectedManualFilter !== "all" && item.manualType !== selectedManualFilter) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTopic = item.topic?.toLowerCase().includes(q);
        const matchesLesson = item.lessonName?.toLowerCase().includes(q);
        const matchesModule = item.moduleName?.toLowerCase().includes(q);
        const matchesScripture = item.scripture?.toLowerCase().includes(q);
        const matchesCluster = item.clusterName?.toLowerCase().includes(q);
        const matchesMentor = item.mentorName?.toLowerCase().includes(q);
        const matchesAttendees = item.attendeeNames?.some((name: string) =>
          name.toLowerCase().includes(q)
        );
        const matchesReflection = item.reflectionNotes?.toLowerCase().includes(q);
        const matchesPrayer = item.prayerRequests?.toLowerCase().includes(q);

        if (
          !matchesTopic &&
          !matchesLesson &&
          !matchesModule &&
          !matchesScripture &&
          !matchesCluster &&
          !matchesMentor &&
          !matchesAttendees &&
          !matchesReflection &&
          !matchesPrayer
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    allDevotions,
    isMentorUser,
    isMinistryHeadUser,
    isAdminUser,
    workerProfile,
    user,
    groups,
    selectedClusterFilter,
    selectedManualFilter,
    selectedDeptFilter,
    searchQuery,
    departmentClusters,
    activeClusterOptions,
    workers,
    myMinistryIds,
  ]);

  // Handlers
  const handleSaveDevotion = async (data: any) => {
    if (editingDevotion) {
      await updateDevotionMutation.mutateAsync({
        id: editingDevotion.id,
        data,
      });
    } else {
      await createDevotionMutation.mutateAsync(data);
    }
    setIsDevotionSheetOpen(false);
    setEditingDevotion(null);
  };

  const handleSaveGroup = async (data: { name: string; mentorId: string; menteeIds: string[] }) => {
    try {
      let targetGroupId = selectedGroup?.id;
      const targetMentorId = data.mentorId || selectedGroup?.mentorId || workerProfile?.id || "";

      if (selectedGroup) {
        await updateGroupMutation.mutateAsync({
          id: selectedGroup.id,
          data: {
            name: data.name,
            mentorId: targetMentorId,
            menteeIds: data.menteeIds || [],
          },
        });
      } else {
        const createdGroup = await createGroupMutation.mutateAsync({
          name: data.name,
          mentorId: targetMentorId,
          menteeIds: data.menteeIds || [],
        });
        targetGroupId = createdGroup?.id;
      }

      // Sync all selected mentees to this group (preventing duplicates across multiple groups)
      if (targetGroupId) {
        const selectedIds = new Set(data.menteeIds || []);
        const previousMentees = mentees?.filter((m) => m.groupId === targetGroupId) || [];

        // 1. Assign selected mentees strictly to this group
        for (const mId of data.menteeIds || []) {
          const mentee = mentees?.find((m) => m.id === mId);
          if (mentee && (mentee.groupId !== targetGroupId || mentee.mentorId !== targetMentorId)) {
            await updateMenteeMutation.mutateAsync({
              id: mId,
              data: { groupId: targetGroupId, mentorId: targetMentorId },
            });
          }
        }

        // 2. Unassign mentees that were unchecked from this group
        for (const m of previousMentees) {
          if (!selectedIds.has(m.id)) {
            await updateMenteeMutation.mutateAsync({
              id: m.id,
              data: { groupId: "", mentorId: "" },
            });
          }
        }
      }

      setIsGroupSheetOpen(false);
      setSelectedGroup(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not save group.",
      });
    }
  };

  const handleSaveMentee = async (data: any) => {
    try {
      if (selectedMentee?.id) {
        await updateMenteeMutation.mutateAsync({ id: selectedMentee.id, data });
      } else {
        await createMenteeMutation.mutateAsync(data);
      }
      setIsMenteeSheetOpen(false);
      setSelectedMentee(null);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: "Could not save mentee.",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete.type === "devotion") {
        await deleteDevotionMutation.mutateAsync(itemToDelete.id);
      } else if (itemToDelete.type === "group") {
        await deleteGroupMutation.mutateAsync(itemToDelete.id);
      } else {
        await deleteMenteeMutation.mutateAsync(itemToDelete.id);
      }
      setItemToDelete(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Delete Failed" });
    }
  };

  const isDevotionsLoading = devotionsLoading && !devotions && allDevotions.length === 0;
  const isMenteesLoading = menteesLoading && !rawMentees;
  const isGroupsLoading = groupsLoading && !rawGroups;
  const isLoading = isDevotionsLoading;

  // Active Cluster Scope Name
  const scopeClusterName =
    selectedClusterFilter === "all" ? "All Clusters" : selectedClusterFilter;

  // Determine mentor's assigned cluster/group name
  const myAssignedGroup = groups?.find((g) => g.mentorId === workerProfile?.id);
  const mentorClusterLabel =
    myAssignedGroup?.name ||
    allMinistries?.find((m: any) => m.id === workerProfile?.majorMinistryId)?.name ||
    "";

  const [menteeStatusFilter, setMenteeStatusFilter] = useState("all");
  const [selectedMinistryFilter, setSelectedMinistryFilter] = useState("all");

  // Helper to determine the Ministry of a mentee
  const getMenteeMinistry = (m: any) => {
    // 1. If mentee has a group, check group name for ministry name
    const group = groups?.find((g) => g.id === m.groupId);
    if (group?.name) {
      const gLower = group.name.toLowerCase();
      for (const opt of activeClusterOptions) {
        if (
          gLower.includes(opt.value.toLowerCase()) ||
          gLower.includes(opt.label.toLowerCase()) ||
          opt.label.toLowerCase().includes(gLower)
        ) {
          return opt.label;
        }
      }
      if (group.name.includes(" - ")) {
        const parts = group.name.split(" - ");
        return parts[1]?.trim() || parts[0]?.trim();
      }
      return group.name;
    }

    // 2. Check assigned mentor's ministry
    const mentor = workers?.find(
      (w) => w.id === m.mentorId || (group?.mentorId && w.id === group.mentorId)
    );
    if (mentor?.majorMinistryId) {
      const min = allMinistries?.find((min: any) => min.id === mentor.majorMinistryId);
      if (min?.name) {
        return min.name === "YO" ? "Youth Outreach" : min.name;
      }
    }

    return "Cluster 1";
  };

  // Helper to determine the Department of a mentee
  const getMenteeDepartment = (m: any) => {
    // 1. Check assigned mentor's major ministry / department
    const group = groups?.find((g) => g.id === m.groupId);
    const mentor = workers?.find(
      (w) => w.id === m.mentorId || (group?.mentorId && w.id === group.mentorId)
    );
    if (mentor) {
      if (mentor.majorMinistryId) {
        const min = allMinistries?.find((min: any) => min.id === mentor.majorMinistryId);
        const rawDept = typeof min?.department === "string" ? min.department : min?.department?.name;
        if (rawDept) {
          const dUpper = rawDept.toUpperCase().trim();
          if (dUpper === "O" || dUpper.includes("OUTREACH")) return "Outreach";
          if (dUpper === "R" || dUpper.includes("RELATIONSHIP")) return "Relationship";
          if (dUpper === "D" || dUpper.includes("DISCIPLESHIP")) return "Discipleship";
          if (dUpper === "A" || dUpper.includes("ADMIN")) return "Administration";
          if (dUpper === "W" || dUpper.includes("WORSHIP")) return "Worship";
          return rawDept;
        }
      }
      const mDept = (mentor as any).department;
      if (mDept) {
        const dUpper = String(mDept).toUpperCase().trim();
        if (dUpper === "O" || dUpper.includes("OUTREACH")) return "Outreach";
        if (dUpper === "R" || dUpper.includes("RELATIONSHIP")) return "Relationship";
        if (dUpper === "D" || dUpper.includes("DISCIPLESHIP")) return "Discipleship";
        if (dUpper === "A" || dUpper.includes("ADMIN")) return "Administration";
        if (dUpper === "W" || dUpper.includes("WORSHIP")) return "Worship";
        return String(mDept);
      }
    }

    // 2. Check mentee ministry name against departmentClusters
    const minName = getMenteeMinistry(m).toLowerCase().trim();
    for (const [deptKey, clusterList] of Object.entries(departmentClusters)) {
      if (clusterList.some((c) => c.value.toLowerCase() === minName || c.label.toLowerCase() === minName)) {
        const dUpper = deptKey.toUpperCase();
        if (dUpper === "O" || dUpper.includes("OUTREACH")) return "Outreach";
        if (dUpper === "R" || dUpper.includes("RELATIONSHIP")) return "Relationship";
        if (dUpper === "D" || dUpper.includes("DISCIPLESHIP")) return "Discipleship";
        if (dUpper === "A" || dUpper.includes("ADMIN")) return "Administration";
        if (dUpper === "W" || dUpper.includes("WORSHIP")) return "Worship";
      }
    }

    return "Outreach";
  };

  const adminDepartments = useMemo(() => [
    { value: "WORSHIP", label: "Worship Department" },
    { value: "OUTREACH", label: "Outreach Department" },
    { value: "RELATIONSHIP", label: "Relationship Department" },
    { value: "DISCIPLESHIP", label: "Discipleship Department" },
    { value: "ADMINISTRATION", label: "Administration Department" },
  ], []);

  const availableMinistriesForMenteeFilter = useMemo(() => {
    if (!isAdminUser) return activeClusterOptions;
    if (menteeDeptFilter === "all") {
      const all: { value: string; label: string }[] = [];
      const seen = new Set<string>();
      WORDA_ORDER.forEach((dept) => {
        const list = departmentClusters[dept] || [];
        list.forEach((item) => {
          const key = item.value.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            all.push(item);
          }
        });
      });
      return all.length > 0 ? all : activeClusterOptions;
    }

    const key = menteeDeptFilter.toUpperCase();
    const deptList =
      departmentClusters[key] ||
      (key.includes("WORSHIP") ? departmentClusters["WORSHIP"] || departmentClusters["W"] : []) ||
      (key.includes("OUTREACH") ? departmentClusters["OUTREACH"] || departmentClusters["O"] : []) ||
      (key.includes("RELATIONSHIP") ? departmentClusters["RELATIONSHIP"] || departmentClusters["R"] : []) ||
      (key.includes("DISCIPLESHIP") ? departmentClusters["DISCIPLESHIP"] || departmentClusters["D"] : []) ||
      (key.includes("ADMIN") ? departmentClusters["ADMINISTRATION"] || departmentClusters["A"] : []) ||
      [];
    return deptList.length > 0 ? deptList : activeClusterOptions;
  }, [isAdminUser, menteeDeptFilter, departmentClusters, activeClusterOptions]);

  // Direct mentees for mentor role
  const myMentees = useMemo(() => {
    if (!workerProfile?.id) return [];
    const myGroupIds = new Set(
      groups?.filter((g) => g.mentorId === workerProfile.id).map((g) => g.id) || []
    );
    return (
      mentees?.filter(
        (m) =>
          m.mentorId === workerProfile.id ||
          (m.groupId && myGroupIds.has(m.groupId))
      ) || []
    );
  }, [mentees, groups, workerProfile]);

  const filteredMyMentees = useMemo(() => {
    let list = myMentees;
    if (menteeStatusFilter !== "all") {
      const isTargetActive = menteeStatusFilter.toLowerCase() === "active";
      list = list.filter((m) => {
        const s = (m.status || "Active").toLowerCase();
        const isActive = s === "active";
        return isTargetActive ? isActive : !isActive;
      });
    }
    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const email = (m.email || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        return fullName.includes(q) || email.includes(q) || phone.includes(q);
      });
    }
    return list;
  }, [myMentees, menteeStatusFilter, groupSearchQuery]);

  // Mentors list under ministry head's department / admin scope
  const departmentMentors = useMemo(() => {
    if (isAdminUser) return workers || [];
    if (!isMinistryHeadUser) return workers || [];
    const myDeptClusters = activeClusterOptions.map((c) => c.value.toLowerCase());
    const headDeptLower = headDepartment.toLowerCase().trim();

    const list = (workers || []).filter((w) => {
      if (w.id === workerProfile?.id) return true;
      if (w.majorMinistryId === workerProfile?.majorMinistryId) return true;
      if (w.majorMinistryId && myMinistryIds?.includes(w.majorMinistryId)) return true;
      const wMin = allMinistries?.find((m: any) => m.id === w.majorMinistryId);
      const wDept = (typeof wMin?.department === "string" ? wMin.department : wMin?.department?.name || (w as any)?.department || "").toLowerCase().trim();
      if (wDept && (wDept === headDeptLower || wDept.includes(headDeptLower) || headDeptLower.includes(wDept))) return true;
      if (wMin?.name && myDeptClusters.some((c) => wMin.name.toLowerCase().includes(c) || c.includes(wMin.name.toLowerCase()))) return true;
      
      const mentorGroup = groups?.find((g) => g.mentorId === w.id);
      if (mentorGroup?.name) {
        const gName = mentorGroup.name.toLowerCase();
        if (myDeptClusters.some((c) => gName.includes(c) || c.includes(gName))) return true;
      }
      return false;
    });
    return list;
  }, [isAdminUser, isMinistryHeadUser, workers, workerProfile, activeClusterOptions, myMinistryIds, allMinistries, headDepartment, groups]);

  // Individual mentees under ministry head's department / admin scope
  const headDepartmentMentees = useMemo(() => {
    if (isAdminUser) return mentees || [];
    if (isMentorUser) return myMentees;

    const myDeptClusters = activeClusterOptions.map((c) => c.value.toLowerCase());
    const headDeptLower = headDepartment.toLowerCase().trim();
    const deptMentorIds = new Set(departmentMentors.map((m) => m.id));

    const scoped = (mentees || []).filter((m) => {
      const mDept = getMenteeDepartment(m).toLowerCase().trim();
      const minName = getMenteeMinistry(m).toLowerCase().trim();

      // Check if mentee's ministry belongs to this department's clusters
      const isMinistryInDept = myDeptClusters.some((c) => minName === c || minName.includes(c) || c.includes(minName));
      // Check if mentee's derived department matches this department
      const isDeptMatch = mDept === headDeptLower || mDept.includes(headDeptLower) || headDeptLower.includes(mDept);

      if (!isMinistryInDept && !isDeptMatch) {
        return false;
      }

      if (m.mentorId && deptMentorIds.has(m.mentorId)) return true;
      if (m.groupId) {
        const group = groups?.find((g) => g.id === m.groupId);
        if (group && (deptMentorIds.has(group.mentorId) || myDeptClusters.some((c) => group.name?.toLowerCase().includes(c)))) return true;
      }
      if (m.mentorId === workerProfile?.id) return true;

      return isMinistryInDept || isDeptMatch;
    });

    return scoped;
  }, [isAdminUser, isMentorUser, myMentees, departmentMentors, activeClusterOptions, mentees, workerProfile, headDepartment, groups, workers, allMinistries]);

  // Filtered individual mentees for Ministry Head / Admin table view
  const filteredHeadMentees = useMemo(() => {
    let list = headDepartmentMentees;

    if (selectedMinistryFilter !== "all") {
      const target = selectedMinistryFilter.toLowerCase().trim();
      list = list.filter((m) => {
        const minName = getMenteeMinistry(m).toLowerCase().trim();
        if (target === "yo" || target.includes("youth outreach")) {
          return minName === "yo" || minName.includes("youth outreach") || minName.includes("youth");
        }
        return minName === target || minName.includes(target) || target.includes(minName);
      });
    }

    if (isAdminUser && menteeDeptFilter !== "all") {
      const targetDept = menteeDeptFilter.toUpperCase().trim();
      list = list.filter((m) => {
        const mDept = getMenteeDepartment(m).toUpperCase().trim();
        return (
          mDept === targetDept ||
          targetDept.includes(mDept) ||
          mDept.includes(targetDept) ||
          (targetDept.startsWith("O") && mDept.startsWith("O")) ||
          (targetDept.startsWith("R") && mDept.startsWith("R")) ||
          (targetDept.startsWith("D") && mDept.startsWith("D")) ||
          (targetDept.startsWith("A") && mDept.startsWith("A")) ||
          (targetDept.startsWith("W") && mDept.startsWith("W"))
        );
      });
    }

    if (menteeStatusFilter !== "all") {
      const isTargetActive = menteeStatusFilter.toLowerCase() === "active";
      list = list.filter((m) => {
        const s = (m.status || "Active").toLowerCase();
        const isActive = s === "active";
        return isTargetActive ? isActive : !isActive;
      });
    }

    if (groupSearchQuery.trim()) {
      const q = groupSearchQuery.toLowerCase().trim();
      list = list.filter((m) => {
        const fullName = `${m.firstName} ${m.lastName}`.toLowerCase();
        const email = (m.email || "").toLowerCase();
        const phone = (m.phone || "").toLowerCase();
        const mentor = workers?.find(
          (w) => w.id === m.mentorId || (m.groupId && groups?.find((g) => g.id === m.groupId)?.mentorId === w.id)
        );
        const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.toLowerCase() : "";
        const ministry = getMenteeMinistry(m).toLowerCase();
        return (
          fullName.includes(q) ||
          email.includes(q) ||
          phone.includes(q) ||
          mentorName.includes(q) ||
          ministry.includes(q)
        );
      });
    }

    return list;
  }, [headDepartmentMentees, selectedMinistryFilter, menteeDeptFilter, menteeStatusFilter, groupSearchQuery, groups, workers, allMinistries, activeClusterOptions, isAdminUser, departmentClusters]);

  const devotionStats = useMemo(() => {
    const list = filteredDevotions || [];
    const total = list.length;
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const thisMonth = list.filter((d: any) => {
      if (!d.devotionDate) return false;
      const date = toJsDate(d.devotionDate);
      return date >= thisMonthStart;
    }).length;

    const uniqueMentees = new Set<string>();
    list.forEach((d: any) => {
      if (Array.isArray(d.attendeeNames)) {
        d.attendeeNames.forEach((name: string) => {
          if (name && name.trim()) uniqueMentees.add(name.trim().toLowerCase());
        });
      }
    });

    const withPhotos = list.filter(
      (d: any) => (d.photoUrls && d.photoUrls.length > 0) || d.photoUrl
    ).length;

    return {
      total,
      thisMonth,
      uniqueMentees: uniqueMentees.size || (mentees?.length ?? 0),
      withPhotos,
    };
  }, [filteredDevotions, mentees]);

  const currentDisplayedMentees = useMemo(() => {
    return isMentorUser ? filteredMyMentees : filteredHeadMentees;
  }, [isMentorUser, filteredMyMentees, filteredHeadMentees]);

  const menteeStats = useMemo(() => {
    const list = currentDisplayedMentees || [];
    const total = list.length;
    const active = list.filter((m: any) => m.status === "Active" || !m.status).length;
    const completed = list.filter((m: any) => m.status === "Completed").length;
    const inactive = list.filter((m: any) => m.status === "Inactive" || m.status === "Dropped").length;
    return { total, active, completed, inactive };
  }, [currentDisplayedMentees]);

  if (!canManageC2S && !canViewC2SAnalytics && !isSuperAdmin) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
          <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have permission to access Connect 2 Souls. Contact an administrator to request access.
          </p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col space-y-6 pb-12 w-full">
        {/* ── TOP HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">
              Connect 2 Souls
            </h1>
            <p className="text-sm text-muted-foreground">
              Spiritual mentorship tracking, devotions oversight, and soul care across all departments.
            </p>
          </div>
        </div>

        {/* Tabs Content Views (Navigated via sidebar sub-items) */}
        <Tabs
          defaultValue="devotions"
          value={activeTab === "groups" ? "mentees" : activeTab}
          onValueChange={handleTabChange}
          className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >

          {/* ══════════════════ TAB 0: ADMIN OVERVIEW ══════════════════ */}
          {(isSuperAdmin || isAdminUser) && (
            <TabsContent value="overview" className="space-y-6 mt-0">
              <AdminOverview
                groups={groups || []}
                mentees={mentees || []}
                workers={workers || []}
                devotions={allDevotions}
                departmentClusters={departmentClusters}
                departmentSettings={departmentSettings || []}
                allMinistries={allMinistries || []}
                onViewDevotion={(dev) => setViewingDevotion(dev)}
              />
            </TabsContent>
          )}

          {/* ══════════════════ TAB 1: DEVOTIONS ══════════════════ */}
          <TabsContent value="devotions" className="space-y-6 mt-0">
            {/* Devotions KPI Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="TOTAL DEVOTIONS"
                value={devotionStats.total}
                sub="recorded sessions"
                icon={BookOpen}
                accentColor="bg-sidebar"
                iconClass="text-sidebar dark:text-blue-400"
                iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              />
              <StatCard
                label="THIS MONTH"
                value={devotionStats.thisMonth}
                sub="recent sessions"
                icon={Calendar}
                accentColor="bg-blue-500"
                iconClass="text-blue-600 dark:text-blue-400"
                iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              />
              <StatCard
                label="MENTEES REACHED"
                value={devotionStats.uniqueMentees}
                sub="participating mentees"
                icon={Users}
                accentColor="bg-emerald-500"
                iconClass="text-emerald-600 dark:text-emerald-400"
                iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
              <StatCard
                label="PHOTO VERIFIED"
                value={devotionStats.withPhotos}
                sub="sessions with photos"
                icon={Camera}
                accentColor="bg-purple-500"
                iconClass="text-purple-600 dark:text-purple-400"
                iconBgClass="bg-purple-50 dark:bg-purple-950/40"
              />
            </div>

            {/* Filter and Keyword Search Toolbar */}
            <div className="flex flex-col lg:flex-row gap-3 items-center justify-between bg-white dark:bg-card p-4 sm:p-5 rounded-2xl border border-gray-200/80 dark:border-border shadow-xs">
              {/* Left: Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                <Input
                  placeholder="Search keyword (lesson, mentee, mentor, prayer)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Right: Filter controls and Action Button */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">
                {isAdminUser ? (
                  <Select
                    value={selectedDeptFilter}
                    onValueChange={(val) => {
                      setSelectedDeptFilter(val);
                      setSelectedClusterFilter(val);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] h-10 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3">
                      <SelectValue placeholder="All Departments & Ministries" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Departments & Ministries
                      </SelectItem>
                      {WORDA_ORDER.map((dept) => {
                        const items = departmentClusters[dept] || [];
                        if (!items || items.length === 0) return null;
                        const titleLabel = `${dept.charAt(0) + dept.slice(1).toLowerCase()} Department`;
                        return (
                          <SelectGroup key={dept}>
                            <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                              {titleLabel}
                            </SelectLabel>
                            {items.map((item, idx) => (
                              <SelectItem key={`admin-cluster-${dept}-${item.value}-${idx}`} value={item.value} className="text-xs pl-6 cursor-pointer">
                                • {item.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                ) : isMinistryHeadUser ? (
                  <Select
                    value={selectedClusterFilter}
                    onValueChange={(val) => {
                      setSelectedClusterFilter(val);
                    }}
                  >
                    <SelectTrigger className="w-full sm:w-[220px] h-10 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3">
                      <SelectValue placeholder="All Ministries & Clusters" />
                    </SelectTrigger>
                    <SelectContent className="max-h-96 overflow-y-auto">
                      <SelectItem value="all" className="text-xs font-bold text-primary">
                        All Ministries & Clusters
                      </SelectItem>
                      <SelectGroup>
                        <SelectLabel className="px-2 py-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-muted/40 my-1 rounded-sm">
                          {headDepartment.toUpperCase()} MINISTRIES
                        </SelectLabel>
                        {activeClusterOptions.map((item, idx) => (
                          <SelectItem key={`head-cluster-${item.value}-${idx}`} value={item.value} className="text-xs pl-6 cursor-pointer">
                            • {item.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                ) : null}

                <Button
                  onClick={() => {
                    setEditingDevotion(null);
                    setIsDevotionSheetOpen(true);
                  }}
                  className="bg-sidebar hover:bg-sidebar/90 text-white shadow-xs font-bold text-xs h-10 px-4 gap-1.5 rounded-2xl transition-colors cursor-pointer shrink-0"
                >
                  <PlusCircle className="h-4 w-4" />
                  Submit Devotion Record
                </Button>
              </div>
            </div>

            {/* Devotions Grid / Feed */}
            {isDevotionsLoading ? (
              <div className="flex justify-center py-16">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredDevotions.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20">
                <BookOpen className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h3 className="text-lg font-semibold">No Devotion Records Found</h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  {searchQuery || selectedClusterFilter !== "all" || selectedManualFilter !== "all"
                    ? "Try adjusting your keyword search or filter criteria."
                    : "No devotion sessions have been recorded yet."}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:gap-5 md:grid-cols-1 lg:grid-cols-2">
                {filteredDevotions.map((record) => {
                  const photos = record.photoUrls?.length
                    ? record.photoUrls
                    : record.photoUrl
                      ? [record.photoUrl]
                      : [];
                  const isAuthor = Boolean(
                    (workerProfile && record.mentorId === workerProfile.id) ||
                    (workerProfile &&
                      record.mentorName &&
                      record.mentorName.trim().toLowerCase() ===
                        `${workerProfile.firstName || ""} ${workerProfile.lastName || ""}`.trim().toLowerCase()) ||
                    (user?.id && (record as any).userId === user.id)
                  );

                  const formattedDate = record.devotionDate
                    ? format(toJsDate(record.devotionDate), "yyyy-MM-dd")
                    : "2026-07-01";
                  const formattedTime = record.devotionDate
                    ? format(toJsDate(record.devotionDate), "hh:mm a")
                    : "09:15 AM";

                  const attendeesString =
                    record.attendeeNames && record.attendeeNames.length > 0
                      ? record.attendeeNames.join(", ")
                      : "Mentee";

                  return (
                    <div
                      key={record.id}
                      className="rounded-2xl border border-slate-200/90 dark:border-border/80 bg-white dark:bg-card p-5 sm:p-6 flex flex-col hover:border-sidebar/40 hover:shadow-md transition-all shadow-2xs"
                    >
                      {/* ── TOP HEADER BAR: DATE PILL, TIME, VIEW PHOTO BUTTON & MENU ── */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <Calendar className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            {formattedDate}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">
                            {formattedTime}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {photos.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setViewingDevotion(record)}
                              className="h-8.5 px-3 rounded-xl text-xs font-bold bg-sidebar/5 hover:bg-sidebar/10 text-sidebar dark:text-blue-400 border border-sidebar/20 hover:border-sidebar/40 flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              <span>View Photo</span>
                            </Button>
                          )}

                          {(isAuthor || isMinistryHeadUser || isAdminUser) && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8.5 w-8.5 rounded-xl hover:bg-slate-100 dark:hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 rounded-xl shadow-lg border border-border bg-popover">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingDevotion(record);
                                    setIsDevotionSheetOpen(true);
                                  }}
                                  className="cursor-pointer text-xs font-medium"
                                >
                                  <Edit className="mr-2 h-4 w-4" /> Edit Record
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive cursor-pointer text-xs font-medium"
                                  onSelect={() =>
                                    setItemToDelete({
                                      id: record.id,
                                      type: "devotion",
                                      name: record.topic,
                                    })
                                  }
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete Record
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      {/* ── TITLE & SUBTITLE ── */}
                      <div className="mt-3.5 space-y-1">
                        <h3
                          onClick={() => setViewingDevotion(record)}
                          className="text-base sm:text-lg font-bold text-foreground font-headline hover:text-sidebar cursor-pointer transition-colors leading-snug"
                        >
                          {record.lessonName || record.topic}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>
                            {attendeesString} with <strong className="font-semibold text-foreground">{record.mentorName || "Mentor"}</strong>
                          </span>
                        </div>
                      </div>

                      {/* ── REFLECTION BOX ── */}
                      {record.reflectionNotes && (
                        <div className="mt-3.5 bg-slate-50/90 dark:bg-muted/25 p-4 rounded-2xl border border-slate-200/70 dark:border-border/60 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-sidebar dark:text-blue-400">
                            <Sparkles className="h-3 w-3 text-sidebar dark:text-blue-400" />
                            Reflection
                          </div>
                          <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap font-normal">
                            {record.reflectionNotes}
                          </p>
                        </div>
                      )}

                      {/* ── PRAYER REQUEST LINE ── */}
                      {record.prayerRequests && (
                        <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-border/50 flex items-start gap-2 text-xs text-muted-foreground">
                          <Heart className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                          <span>
                            <strong className="font-bold text-foreground">
                              Prayer Request:
                            </strong>{" "}
                            {record.prayerRequests}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ══════════════════ TAB 2: GROUPS & MENTEES ══════════════════ */}
          <TabsContent value="mentees" className="space-y-6 mt-0">
            {/* Stat Cards for Mentees */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="TOTAL MENTEES"
                value={menteeStats.total}
                sub="registered souls"
                icon={Users}
                accentColor="bg-sidebar"
                iconClass="text-sidebar dark:text-blue-400"
                iconBgClass="bg-blue-50 dark:bg-blue-950/40"
              />
              <StatCard
                label="ACTIVE MENTEES"
                value={menteeStats.active}
                sub="currently mentoring"
                icon={CheckCircle2}
                accentColor="bg-emerald-500"
                iconClass="text-emerald-600 dark:text-emerald-400"
                iconBgClass="bg-emerald-50 dark:bg-emerald-950/40"
              />
              <StatCard
                label="COMPLETED JOURNEY"
                value={menteeStats.completed}
                sub="graduated curriculum"
                icon={GraduationCap}
                accentColor="bg-purple-500"
                iconClass="text-purple-600 dark:text-purple-400"
                iconBgClass="bg-purple-50 dark:bg-purple-950/40"
              />
              <StatCard
                label="INACTIVE / DROPPED"
                value={menteeStats.inactive}
                sub="requires follow-up"
                icon={Clock}
                accentColor="bg-amber-500"
                iconClass="text-amber-600 dark:text-amber-400"
                iconBgClass="bg-amber-50 dark:bg-amber-950/40"
              />
            </div>
            {isMentorUser ? (
              /* ── MENTOR VIEW: DIRECT MENTEES TABLE (Room Reservations Admin Table Style) ── */
              <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col min-h-[480px]">
                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  {/* Left: Search input */}
                  <div className="relative w-full sm:w-72 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search mentee name, email, phone..."
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                    />
                    {groupSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setGroupSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Status Filter & Mentee Count Badge */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <Select value={menteeStatusFilter} onValueChange={setMenteeStatusFilter}>
                      <SelectTrigger className="h-10 w-[130px] sm:w-36 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs cursor-pointer">
                          All Statuses
                        </SelectItem>
                        <SelectItem value="Active" className="text-xs cursor-pointer">
                          Active
                        </SelectItem>
                        <SelectItem value="Inactive" className="text-xs cursor-pointer">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => {
                        setSelectedMentee(myAssignedGroup ? { groupId: myAssignedGroup.id, mentorId: myAssignedGroup.mentorId } : null);
                        setIsMenteeSheetOpen(true);
                      }}
                      className="bg-sidebar hover:bg-sidebar/90 text-white shadow-xs font-semibold text-xs h-10 px-4 gap-1.5 rounded-2xl shrink-0 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Mentee
                    </Button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="border border-border/60 rounded-2xl mt-4 overflow-hidden flex-grow flex flex-col bg-card">
                  {isMenteesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 flex-grow">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Loading mentees...</p>
                    </div>
                  ) : filteredMyMentees.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground flex-grow flex flex-col items-center justify-center">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-muted/50 mb-3 text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No mentees found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {groupSearchQuery || menteeStatusFilter !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "No mentees are assigned under your mentorship yet."}
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedMentee(myAssignedGroup ? { groupId: myAssignedGroup.id, mentorId: myAssignedGroup.mentorId } : null);
                          setIsMenteeSheetOpen(true);
                        }}
                        className="shadow-sm font-semibold text-xs h-9 px-4 gap-1.5 mt-4"
                      >
                        <PlusCircle className="h-4 w-4" /> Add Mentee
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col">
                      {/* ── Mobile card view ── */}
                      <div className="md:hidden divide-y divide-border/30">
                        {filteredMyMentees.map((m) => {
                          const fullName = `${m.firstName} ${m.lastName}`.trim();
                          const initials = `${m.firstName ? m.firstName[0] : ""}${m.lastName ? m.lastName[0] : ""}`.toUpperCase();
                          const menteeDevotions = allDevotions?.filter((d: any) =>
                            d.attendeeNames?.some((name: string) => name.toLowerCase().includes(fullName.toLowerCase()))
                          ) || [];
                          const lastSessionDate = menteeDevotions[0]?.devotionDate
                            ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd")
                            : "—";
                          const progressPct =
                            m.status === "Completed" ? 100 :
                            m.status === "Dropped" ? 25 :
                            menteeDevotions.length > 0 ? Math.min(100, Math.max(30, Math.round((menteeDevotions.length / 24) * 100))) : 65;
                          const isMenteeActive = (m.status || "Active").toLowerCase() === "active";
                          const displayStatus = isMenteeActive ? "Active" : "Inactive";
                          const statusColorClass = isMenteeActive
                            ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                            : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
                          return (
                            <div key={m.id} className="p-4 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                                    {initials}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{m.email || m.phone || "No contact info"}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className={`${statusColorClass} font-semibold px-2.5 py-0.5 rounded-full text-[10px] border-transparent`}>
                                    {displayStatus}
                                  </Badge>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-12 bg-muted h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-primary h-full rounded-full" style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground">{progressPct}%</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-mono">{lastSessionDate}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingMenteeDetail({ ...m, fullName, initials, menteeMinistry: (m as any).majorMinistryId, mentorName: "—", progressPct, lastSessionDate, displayStatus, statusColorClass })}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                                >
                                  View Details
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                  <DropdownMenuItem onClick={() => { setSelectedMentee(m); setIsMenteeSheetOpen(true); }} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                                    <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Mentee
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setItemToDelete({ id: m.id, type: "mentee", name: fullName })} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete Mentee
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Desktop table view ── */}
                      <div className="hidden md:block overflow-x-auto flex-grow">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-5 text-left w-[28%]">
                              Mentee
                            </TableHead>
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-left w-[22%]">
                              Ministry
                            </TableHead>
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[15%]">
                              Status
                            </TableHead>
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[15%]">
                              Progress
                            </TableHead>
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[12%]">
                              Last Session
                            </TableHead>
                            <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-center w-[8%]">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredMyMentees.map((m) => {
                            const fullName = `${m.firstName} ${m.lastName}`.trim();
                            const initials = `${m.firstName ? m.firstName[0] : ""}${m.lastName ? m.lastName[0] : ""}`.toUpperCase();
                            const menteeMinistry = getMenteeMinistry(m);
                            const menteeDevotions = allDevotions?.filter((d: any) =>
                              d.attendeeNames?.some((name: string) => name.toLowerCase().includes(fullName.toLowerCase()))
                            ) || [];
                            const lastSessionDate = menteeDevotions[0]?.devotionDate
                              ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd")
                              : "2026-09-04";

                            const progressPct =
                              m.status === "Completed"
                                ? 100
                                : m.status === "Dropped"
                                  ? 25
                                  : menteeDevotions.length > 0
                                    ? Math.min(100, Math.max(30, Math.round((menteeDevotions.length / 24) * 100)))
                                    : 65;

                            const isMenteeActive = (m.status || "Active").toLowerCase() === "active";
                            const displayStatus = isMenteeActive ? "Active" : "Inactive";
                            const statusColorClass = isMenteeActive
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : "bg-slate-500/15 text-slate-700 dark:text-slate-300";

                            return (
                              <TableRow
                                key={m.id}
                                className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                              >
                                <TableCell className="px-5 py-3.5 align-middle">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">
                                      {initials}
                                    </div>
                                    <div className="overflow-hidden">
                                      <p className="font-bold text-foreground text-xs leading-none truncate">
                                        {fullName}
                                      </p>
                                      <p className="text-[10px] text-muted-foreground mt-1 truncate">
                                        {m.email || m.phone || "No contact info"}
                                      </p>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell className="px-4 py-3.5 align-middle">
                                  <Badge variant="outline" className="text-[10px] font-medium bg-muted/40 text-foreground border-border/80 rounded-lg px-2 py-0.5">
                                    {menteeMinistry}
                                  </Badge>
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-center align-middle">
                                  <Badge
                                    variant="secondary"
                                    className={`${statusColorClass} font-semibold px-3 py-1 rounded-full text-[11px] border-transparent`}
                                  >
                                    {displayStatus}
                                  </Badge>
                                </TableCell>

                                <TableCell className="px-4 py-3.5 align-middle text-center">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-primary h-full rounded-full transition-all duration-300"
                                        style={{ width: `${progressPct}%` }}
                                      />
                                    </div>
                                    <span className="font-semibold text-muted-foreground text-xs">
                                      {progressPct}%
                                    </span>
                                  </div>
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-xs text-muted-foreground text-center align-middle font-mono">
                                  {lastSessionDate}
                                </TableCell>

                                <TableCell className="px-4 py-3.5 text-center align-middle">
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
                                        onClick={() => {
                                          setSelectedMentee(m);
                                          setIsMenteeSheetOpen(true);
                                        }}
                                        className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"
                                      >
                                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Mentee
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          setItemToDelete({
                                            id: m.id,
                                            type: "mentee",
                                            name: fullName,
                                          })
                                        }
                                        className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete Mentee
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
                  )}
                </div>
              </div>
            ) : (
              /* ── MINISTRY HEAD / ADMIN VIEW: INDIVIDUAL MENTEES TABLE (Room Reservations Admin Table Style) ── */
              <div className="bg-card rounded-2xl border border-border/60 shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col min-h-[480px]">
                {/* Controls Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  {/* Left: Search input */}
                  <div className="relative w-full sm:w-72 shrink-0">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    <Input
                      type="text"
                      placeholder="Search mentee or mentor..."
                      value={groupSearchQuery}
                      onChange={(e) => setGroupSearchQuery(e.target.value)}
                      className="pl-9 pr-8 h-10 text-xs font-normal text-slate-800 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 border border-slate-200/90 dark:border-border rounded-2xl bg-background dark:bg-muted/30 shadow-2xs focus-visible:ring-1 focus-visible:ring-sidebar/40 focus-visible:border-sidebar w-full transition-all"
                    />
                    {groupSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setGroupSearchQuery("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Right: Department Filter (Admin), Ministry Filter, Status Filter & Add Mentee */}
                  <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Admin Department Filter */}
                    {isAdminUser && (
                      <Select
                        value={menteeDeptFilter}
                        onValueChange={(val) => {
                          setMenteeDeptFilter(val);
                          setSelectedMinistryFilter("all");
                        }}
                      >
                        <SelectTrigger className="h-10 w-[160px] sm:w-44 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                          <SelectValue placeholder="All Departments">
                            {menteeDeptFilter === "all"
                              ? "All Departments"
                              : adminDepartments.find((d) => d.value === menteeDeptFilter)?.label ||
                                menteeDeptFilter}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="max-h-72 overflow-y-auto">
                          <SelectItem value="all" className="text-xs font-semibold text-primary cursor-pointer">
                            All Departments
                          </SelectItem>
                          {adminDepartments.map((dept) => (
                            <SelectItem
                              key={`mentee-dept-${dept.value}`}
                              value={dept.value}
                              className="text-xs cursor-pointer"
                            >
                              {dept.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {/* Ministries Filter */}
                    <Select value={selectedMinistryFilter} onValueChange={setSelectedMinistryFilter}>
                      <SelectTrigger className="h-10 w-[160px] sm:w-48 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                        <SelectValue placeholder="All Ministries">
                          {selectedMinistryFilter === "all"
                            ? "All Ministries"
                            : availableMinistriesForMenteeFilter.find((c) => c.value === selectedMinistryFilter)?.label ||
                              selectedMinistryFilter}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-h-72 overflow-y-auto">
                        <SelectItem value="all" className="text-xs font-semibold text-primary cursor-pointer">
                          All Ministries
                        </SelectItem>
                        {availableMinistriesForMenteeFilter.map((item, idx) => (
                          <SelectItem
                            key={`head-ministry-fltr-${item.value}-${idx}`}
                            value={item.value}
                            className="text-xs cursor-pointer"
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {/* Status Filter */}
                    <Select value={menteeStatusFilter} onValueChange={setMenteeStatusFilter}>
                      <SelectTrigger className="h-10 w-[130px] sm:w-36 text-xs rounded-2xl border-slate-200/90 dark:border-border bg-background dark:bg-muted/30 font-medium shadow-2xs px-3 shrink-0">
                        <SelectValue placeholder="All Statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all" className="text-xs cursor-pointer">
                          All Statuses
                        </SelectItem>
                        <SelectItem value="Active" className="text-xs cursor-pointer">
                          Active
                        </SelectItem>
                        <SelectItem value="Inactive" className="text-xs cursor-pointer">
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => {
                        setSelectedMentee(null);
                        setIsMenteeSheetOpen(true);
                      }}
                      className="bg-sidebar hover:bg-sidebar/90 text-white shadow-xs font-semibold text-xs h-10 px-4 gap-1.5 rounded-2xl shrink-0 transition-colors cursor-pointer"
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Mentee
                    </Button>
                  </div>
                </div>

                {/* Table Container */}
                <div className="border border-border/60 rounded-2xl mt-4 overflow-hidden flex-grow flex flex-col bg-card">
                  {isMenteesLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 flex-grow">
                      <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                      <p className="text-xs text-muted-foreground font-medium">Loading mentees...</p>
                    </div>
                  ) : filteredHeadMentees.length === 0 ? (
                    <div className="py-16 text-center text-muted-foreground flex-grow flex flex-col items-center justify-center">
                      <div className="p-3 rounded-2xl bg-slate-100 dark:bg-muted/50 mb-3 text-slate-400">
                        <Users className="h-6 w-6" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">No mentees found</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                        {groupSearchQuery || menteeStatusFilter !== "all" || selectedMinistryFilter !== "all"
                          ? "Try adjusting your search or filter criteria."
                          : "No mentees are registered in this ministry yet."}
                      </p>
                      <Button
                        onClick={() => {
                          setSelectedMentee(null);
                          setIsMenteeSheetOpen(true);
                        }}
                        variant="outline"
                        className="mt-4 text-xs font-semibold rounded-2xl gap-1.5 h-9"
                      >
                        <PlusCircle className="h-3.5 w-3.5 text-primary" />
                        Add First Mentee
                      </Button>
                    </div>
                  ) : (
                    <div className="flex-grow flex flex-col">
                      {/* ── Mobile card view ── */}
                      <div className="md:hidden divide-y divide-border/30">
                        {filteredHeadMentees.map((m) => {
                          const fullName = `${m.firstName} ${m.lastName}`.trim();
                          const initials = `${m.firstName ? m.firstName[0] : ""}${m.lastName ? m.lastName[0] : ""}`.toUpperCase();
                          const mentor = workers?.find(w => w.id === m.mentorId || (m.groupId && groups?.find(g => g.id === m.groupId)?.mentorId === w.id));
                          const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : "Unassigned";
                          const menteeMinistry = getMenteeMinistry(m);
                          const menteeDevotions = allDevotions?.filter((d: any) => d.attendeeNames?.some((name: string) => name.toLowerCase().includes(fullName.toLowerCase()))) || [];
                          const progressPct = m.status === "Completed" ? 100 : m.status === "Dropped" ? 25 : menteeDevotions.length > 0 ? Math.min(100, Math.max(30, Math.round((menteeDevotions.length / 24) * 100))) : 65;
                          const lastSessionDate = menteeDevotions[0]?.devotionDate ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd") : "—";
                          const isMenteeActive = (m.status || "Active").toLowerCase() === "active";
                          const displayStatus = isMenteeActive ? "Active" : "Inactive";
                          const statusColorClass = isMenteeActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
                          return (
                            <div key={m.id} className="p-4 flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <div className="w-8 h-8 rounded-full bg-sidebar/10 text-sidebar text-xs font-bold flex items-center justify-center shrink-0 border border-sidebar/20">{initials}</div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-foreground truncate">{fullName}</p>
                                    <p className="text-[11px] text-muted-foreground truncate">{menteeMinistry} · {mentorName}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Badge variant="secondary" className={`${statusColorClass} font-semibold px-2.5 py-0.5 rounded-full text-[10px] border-transparent`}>{displayStatus}</Badge>
                                  <div className="flex items-center gap-1.5">
                                    <div className="w-12 bg-muted h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-primary h-full rounded-full" style={{ width: `${progressPct}%` }} />
                                    </div>
                                    <span className="text-[10px] font-semibold text-muted-foreground">{progressPct}%</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-mono">{lastSessionDate}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setViewingMenteeDetail({ ...m, fullName, initials, menteeMinistry, mentorName, progressPct, lastSessionDate, displayStatus, statusColorClass })}
                                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors whitespace-nowrap"
                                >
                                  View Details
                                </button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button type="button" className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                    <DropdownMenuItem onClick={() => { setSelectedMentee(m); setIsMenteeSheetOpen(true); }} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2">
                                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Mentee
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemToDelete({ id: m.id, type: "mentee", name: fullName })} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-destructive focus:text-destructive focus:bg-destructive/10">
                                      <Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete Mentee
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Desktop table view ── */}
                      <div className="hidden md:block overflow-x-auto">
                    <Table className="w-full">
                      <TableHeader>
                        <TableRow className="bg-sidebar hover:bg-sidebar border-b border-sidebar-border/40">
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-4 text-left whitespace-nowrap", isAdminUser ? "w-[22%]" : "w-[26%]")}>Mentee</TableHead>
                          {isAdminUser && (<TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-3 text-left whitespace-nowrap w-[14%]">Department</TableHead>)}
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-3 text-left whitespace-nowrap", isAdminUser ? "w-[18%]" : "w-[20%]")}>Assigned Mentor</TableHead>
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-3 text-left whitespace-nowrap", isAdminUser ? "w-[16%]" : "w-[18%]")}>Ministry</TableHead>
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-2.5 text-center whitespace-nowrap", isAdminUser ? "w-[8%]" : "w-[9%]")}>Status</TableHead>
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-2.5 text-center whitespace-nowrap", isAdminUser ? "w-[10%]" : "w-[10%]")}>Progress</TableHead>
                          <TableHead className={cn("bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-3 text-center whitespace-nowrap", isAdminUser ? "w-[10%]" : "w-[10%]")}>Last Session</TableHead>
                          <TableHead className="bg-sidebar font-bold text-white text-[11px] uppercase tracking-wider h-11 px-3.5 sm:px-4 text-center whitespace-nowrap w-[8%]"><span className="relative -left-2">Actions</span></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredHeadMentees.map((m) => {
                          const fullName = `${m.firstName} ${m.lastName}`.trim();
                          const initials = `${m.firstName ? m.firstName[0] : ""}${m.lastName ? m.lastName[0] : ""}`.toUpperCase();
                          const mentor = workers?.find(w => w.id === m.mentorId || (m.groupId && groups?.find(g => g.id === m.groupId)?.mentorId === w.id));
                          const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : "Unassigned";
                          const mentorInitials = mentor ? `${mentor.firstName?.[0] || ""}${mentor.lastName?.[0] || ""}`.toUpperCase() : "UA";
                          const menteeMinistry = getMenteeMinistry(m);
                          const menteeDepartment = getMenteeDepartment(m);
                          const menteeDevotions = allDevotions?.filter((d: any) => d.attendeeNames?.some((name: string) => name.toLowerCase().includes(fullName.toLowerCase()))) || [];
                          const lastSessionDate = menteeDevotions[0]?.devotionDate ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd") : "2026-09-04";
                          const progressPct = m.status === "Completed" ? 100 : m.status === "Dropped" ? 25 : menteeDevotions.length > 0 ? Math.min(100, Math.max(30, Math.round((menteeDevotions.length / 24) * 100))) : 65;
                          const isMenteeActive = (m.status || "Active").toLowerCase() === "active";
                          const displayStatus = isMenteeActive ? "Active" : "Inactive";
                          const statusColorClass = isMenteeActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
                          return (
                            <TableRow key={m.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                              <TableCell className="px-4 py-3 align-middle whitespace-nowrap">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 rounded-full bg-sidebar/10 text-sidebar dark:bg-sidebar/30 dark:text-sidebar-foreground text-[10px] font-bold flex items-center justify-center shrink-0 border border-sidebar/20">{initials}</div>
                                  <div className="overflow-hidden"><p className="font-bold text-foreground text-xs leading-none truncate">{fullName}</p><p className="text-[10px] text-muted-foreground mt-0.5 truncate">{m.email || m.phone || "No contact info"}</p></div>
                                </div>
                              </TableCell>
                              {isAdminUser && (<TableCell className="px-3 py-3 text-xs align-middle whitespace-nowrap"><Badge variant="outline" className="text-[10px] font-semibold bg-slate-100 dark:bg-muted/40 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-border">{menteeDepartment}</Badge></TableCell>)}
                              <TableCell className="px-3 py-3 align-middle whitespace-nowrap"><div className="flex items-center gap-2"><div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[9px] font-bold flex items-center justify-center shrink-0 border border-primary/20">{mentorInitials}</div><span className="text-xs font-medium text-foreground truncate">{mentorName}</span></div></TableCell>
                              <TableCell className="px-3 py-3 align-middle whitespace-nowrap"><Badge variant="outline" className="text-[10px] font-medium bg-muted/40 text-foreground border-border/80 rounded-lg px-2 py-0.5">{menteeMinistry}</Badge></TableCell>
                              <TableCell className="px-2.5 py-3 text-center align-middle whitespace-nowrap"><Badge variant="secondary" className={`${statusColorClass} font-semibold px-2.5 py-0.5 rounded-full text-[10px] border-transparent`}>{displayStatus}</Badge></TableCell>
                              <TableCell className="px-2.5 py-3 align-middle text-center whitespace-nowrap"><div className="flex items-center justify-center gap-1.5"><div className="w-12 bg-muted h-1.5 rounded-full overflow-hidden"><div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} /></div><span className="font-semibold text-muted-foreground text-[11px]">{progressPct}%</span></div></TableCell>
                              <TableCell className="px-3 py-3 text-xs text-muted-foreground text-center align-middle font-mono whitespace-nowrap">{lastSessionDate}</TableCell>
                              <TableCell className="px-3.5 sm:px-4 py-3 text-center align-middle whitespace-nowrap">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild><button type="button" className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"><MoreHorizontal className="h-4 w-4" /></button></DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-36 p-1 rounded-xl shadow-lg border-border/80">
                                    <DropdownMenuItem onClick={() => { setSelectedMentee(m); setIsMenteeSheetOpen(true); }} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2"><Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit Mentee</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setItemToDelete({ id: m.id, type: "mentee", name: fullName })} className="cursor-pointer gap-2 rounded-lg text-xs font-medium py-2 text-destructive focus:text-destructive focus:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /> Delete Mentee</DropdownMenuItem>
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
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          {/* ══════════════════ TAB 3: ANALYTICS ══════════════════ */}
          {isHeadOrAdmin && (
            <TabsContent value="analytics" className="mt-0">
              <C2SAnalytics
                mentees={mentees || []}
                groups={groups || []}
                devotions={allDevotions}
                workers={workers || []}
                canGenerateReport={canGenerateAnalyticsReport}
                departmentClusters={departmentClusters}
                headDepartment={headDepartment}
                isSuperAdmin={isAdminUser}
                isMinistryHead={isMinistryHeadUser}
                isHeadOrAdmin={isHeadOrAdmin}
                onViewDevotion={(dev) => setViewingDevotion(dev)}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ── Submit / Edit Devotion Record Sheet ── */}
      <Sheet open={isDevotionSheetOpen} onOpenChange={setIsDevotionSheetOpen}>
        <SheetContent className="sm:max-w-2xl max-h-[92vh] flex flex-col p-0 overflow-y-auto rounded-3xl border-border/80 shadow-2xl gap-0 bg-background [&>button:last-child]:hidden">
          {/* ── MODAL HEADER (Matches Admin Form Style) ── */}
          <div className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                <div className="h-11 w-11 rounded-2xl bg-sidebar/10 border border-sidebar/20 text-sidebar dark:text-sky-400 flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-base sm:text-lg font-bold font-headline tracking-tight text-foreground">
                    {editingDevotion ? "Edit Devotion Record" : "Submit Devotion Record"}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground truncate mt-0.5">
                    {editingDevotion
                      ? "Update mentorship session details, curriculum lesson, reflections, and proof photo."
                      : "Record a completed Connect 2 Souls devotion session with key takeaways and photo proof."}
                  </SheetDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDevotionSheetOpen(false)}
                className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer shrink-0 -mt-1 -mr-1"
                title="Close modal"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <DevotionForm
              key={editingDevotion?.id || (isDevotionSheetOpen ? "open-new" : "closed")}
              devotion={editingDevotion}
              groups={groups || []}
              mentees={mentees || []}
              workers={workers || []}
              currentWorker={workerProfile}
              isMinistryHead={isMinistryHead}
              isSuperAdmin={isSuperAdmin}
              onSave={handleSaveDevotion}
              onClose={() => setIsDevotionSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── View Devotion Details Lightbox Dialog ── */}
      <DevotionDetailsModal
        devotion={viewingDevotion}
        isOpen={!!viewingDevotion}
        onClose={() => setViewingDevotion(null)}
        isSuperAdmin={isSuperAdmin}
      />

      {/* ── Mentee Detail Sheet (Mobile View Details) ── */}
      <Sheet open={!!viewingMenteeDetail} onOpenChange={(open) => { if (!open) setViewingMenteeDetail(null); }}>
        <SheetContent className="p-0 overflow-y-auto rounded-2xl gap-0 border-border/80 shadow-2xl [&>button]:hidden">
          {viewingMenteeDetail && (() => {
            const md = viewingMenteeDetail;
            const mentor = workers?.find((w: any) => w.id === md.mentorId || (md.groupId && groups?.find((g: any) => g.id === md.groupId)?.mentorId === w.id));
            const mentorName = mentor ? `${mentor.firstName} ${mentor.lastName}`.trim() : (md.mentorName || "Unassigned");
            const mentorInitials = mentor ? `${mentor.firstName?.[0] || ""}${mentor.lastName?.[0] || ""}`.toUpperCase() : "UA";
            const menteeMinistry = md.menteeMinistry || getMenteeMinistry(md);
            const menteeDepartment = getMenteeDepartment ? getMenteeDepartment(md) : "—";
            const menteeDevotions = allDevotions?.filter((d: any) => d.attendeeNames?.some((name: string) => name.toLowerCase().includes(md.fullName?.toLowerCase()))) || [];
            const progressPct = md.progressPct ?? (md.status === "Completed" ? 100 : md.status === "Dropped" ? 25 : 65);
            const lastSessionDate = md.lastSessionDate ?? (menteeDevotions[0]?.devotionDate ? format(toJsDate(menteeDevotions[0].devotionDate), "yyyy-MM-dd") : "—");
            const isMenteeActive = (md.status || "Active").toLowerCase() === "active";
            const displayStatus = isMenteeActive ? "Active" : "Inactive";
            const statusColorClass = isMenteeActive ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" : "bg-slate-500/15 text-slate-700 dark:text-slate-300";
            return (
              <>
                {/* Header */}
                <SheetHeader className="p-5 pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10 text-left space-y-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-sidebar/10 text-sidebar text-sm font-bold flex items-center justify-center shrink-0 border-2 border-sidebar/20">
                        {md.initials || (md.firstName?.[0] || "") + (md.lastName?.[0] || "")}
                      </div>
                      <div className="min-w-0">
                        <SheetTitle className="text-lg font-bold text-foreground truncate">{md.fullName || `${md.firstName} ${md.lastName}`}</SheetTitle>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{md.email || md.phone || "No contact info"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setViewingMenteeDetail(null)} className="h-8 w-8 p-0 rounded-xl shrink-0 -mt-1 -mr-1">
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </SheetHeader>

                {/* Body */}
                <div className="p-5 space-y-4">
                  {/* Status + Progress */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
                      <Badge variant="secondary" className={`${statusColorClass} font-semibold px-2.5 py-0.5 rounded-full text-xs border-transparent`}>{displayStatus}</Badge>
                    </div>
                    <div className="p-3 rounded-xl border border-border/60 bg-card/60 space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
                          <div className="bg-primary h-full rounded-full" style={{ width: `${progressPct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-foreground">{progressPct}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Details cards */}
                  {[
                    { label: "Ministry", value: menteeMinistry },
                    { label: "Department", value: menteeDepartment },
                    { label: "Last Session", value: lastSessionDate },
                  ].map(({ label, value }) => (
                    <div key={label} className="p-3.5 rounded-xl border border-border/60 bg-card/60">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">{label}</p>
                      <p className="text-sm font-semibold text-foreground">{value || "—"}</p>
                    </div>
                  ))}

                  {/* Assigned Mentor */}
                  <div className="p-3.5 rounded-xl border border-border/60 bg-card/60">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Assigned Mentor</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 border border-primary/20">{mentorInitials}</div>
                      <span className="text-sm font-semibold text-foreground">{mentorName}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 grid grid-cols-2 gap-2.5">
                    <Button
                      onClick={() => { setViewingMenteeDetail(null); setSelectedMentee(md); setIsMenteeSheetOpen(true); }}
                      className="h-10 rounded-xl bg-primary text-primary-foreground text-sm font-semibold gap-1.5"
                    >
                      <Pencil className="h-4 w-4" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => { setViewingMenteeDetail(null); setItemToDelete({ id: md.id, type: "mentee", name: md.fullName || `${md.firstName} ${md.lastName}` }); }}
                      className="h-10 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/5 text-sm font-semibold gap-1.5"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Mentee Sheet ── */}
      <Sheet open={isMenteeSheetOpen} onOpenChange={setIsMenteeSheetOpen}>
        <SheetContent className="sm:max-w-lg p-0 overflow-y-auto rounded-2xl gap-0 border-border/80 shadow-2xl [&>button:last-child]:hidden">
          {/* Header */}
          <SheetHeader className="p-5 pb-4 sm:p-6 sm:pb-4 border-b border-border/70 bg-card/80 backdrop-blur-md sticky top-0 z-10 text-left space-y-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 shadow-xs">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <SheetTitle className="text-lg font-bold font-headline tracking-tight text-foreground flex items-center gap-2">
                    <span className="truncate">{selectedMentee?.id ? "Edit Mentee" : "Add Mentee"}</span>
                    {selectedMentee?.status && (
                      <Badge
                        className={cn(
                          "text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shrink-0",
                          selectedMentee.status === "Active"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                        )}
                      >
                        {selectedMentee.status}
                      </Badge>
                    )}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                    Manage mentee profile and assigned mentor.
                  </SheetDescription>
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsMenteeSheetOpen(false)}
                className="h-8 w-8 p-0 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 cursor-pointer shrink-0 -mt-1 -mr-1"
                title="Close modal"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </SheetHeader>

          <div className="p-6">
            <MenteeForm
              mentee={selectedMentee}
              groups={groups || []}
              workers={workers || []}
              onSave={handleSaveMentee}
              onClose={() => setIsMenteeSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Delete Confirmation Dialog ── */}
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title={
          itemToDelete?.type === "mentee"
            ? "Delete Mentee Profile"
            : itemToDelete?.type === "group"
            ? "Delete C2S Group"
            : itemToDelete?.type === "devotion"
            ? "Delete Devotion Record"
            : "Delete Item"
        }
        itemName={itemToDelete?.name}
        confirmLabel={
          itemToDelete?.type === "mentee"
            ? "Delete Mentee"
            : itemToDelete?.type === "group"
            ? "Delete Group"
            : itemToDelete?.type === "devotion"
            ? "Delete Devotion"
            : "Delete"
        }
      />
    </AppLayout>
  );
}

export default function C2SPage() {
  return (
    <Suspense
      fallback={
        <AppLayout>
          <div className="flex justify-center items-center py-24">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AppLayout>
      }
    >
      <C2SPageContent />
    </Suspense>
  );
}


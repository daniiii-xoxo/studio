"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Avatar, AvatarFallback } from "@studio/ui";
import { Card, CardContent } from "@studio/ui";
import { Button } from "@studio/ui";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@studio/database";
import { requestPasswordReset } from "@/actions/auth";
import {
  UserCircle,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Hash,
  KeyRound,
  Clock,
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { workerProfile } = useUserRole();
  const { toast } = useToast();

  const displayName =
    workerProfile?.firstName && workerProfile?.lastName
      ? `${workerProfile.firstName} ${workerProfile.lastName}`
      : user?.email?.split("@")[0] || "User";

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const res = await requestPasswordReset(user.email, window.location.origin);
      if (!res.success) {
        toast({
          variant: "destructive",
          title: res.isDeactivated ? "Account Deactivated" : "Error",
          description: res.error || "Failed to send password reset email.",
        });
        return;
      }
      toast({
        title: "Password Reset Email Sent",
        description: `Instructions sent to ${res.email}. Check your inbox.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    }
  };

  const statusColor =
    workerProfile?.status === "Active"
      ? "bg-green-100 text-green-700"
      : workerProfile?.status === "Inactive"
      ? "bg-red-100 text-red-700"
      : "bg-yellow-100 text-yellow-700";

  const startDate =
    workerProfile?.startMonth && workerProfile?.startYear
      ? `${workerProfile.startMonth} ${workerProfile.startYear}`
      : null;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-8 pb-10">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold font-headline tracking-tight text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground">Your personal information and account settings.</p>
        </div>

        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Profile Hero Card */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent" />
          <CardContent className="pt-0 pb-8 px-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-12">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg shrink-0">
                <AvatarFallback className="bg-muted">
                  <UserCircle className="h-14 w-14 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <h2 className="text-2xl font-bold truncate">{displayName}</h2>
                  {workerProfile?.status && (
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusColor}`}>
                      {workerProfile.status}
                    </span>
                  )}
                </div>
                <p className="text-muted-foreground mt-0.5">{user?.email}</p>
                {workerProfile?.employmentType && (
                  <p className="text-sm text-muted-foreground mt-0.5">{workerProfile.employmentType}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

          {/* Contact */}
          <Card>
            <CardContent className="pt-6 pb-6 px-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
              <InfoRow icon={Mail} label="Email" value={workerProfile?.email || user?.email} />
              <InfoRow icon={Phone} label="Phone" value={workerProfile?.phone} />
              <InfoRow icon={MapPin} label="Address" value={workerProfile?.address} />
            </CardContent>
          </Card>

          {/* Work Info */}
          <Card>
            <CardContent className="pt-6 pb-6 px-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Work Info</p>
              <InfoRow icon={Hash} label="Worker ID" value={workerProfile?.workerId ? String(workerProfile.workerId).replace(/^COG-?/i, "").padStart(6, "0") : "—"} />
              <InfoRow icon={Briefcase} label="Worker Type" value={workerProfile?.employmentType} />
              <InfoRow icon={Clock} label="Start Date" value={startDate} />
            </CardContent>
          </Card>

          {/* Personal */}
          <Card>
            <CardContent className="pt-6 pb-6 px-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal</p>
              <InfoRow icon={Calendar} label="Birth Date" value={workerProfile?.birthDate} />
            </CardContent>
          </Card>

          {/* Account */}
          <Card>
            <CardContent className="pt-6 pb-6 px-6 space-y-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Account</p>
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-muted">
                  <KeyRound className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Password</p>
                  <p className="text-sm text-muted-foreground">Send a reset link to your email</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleChangePassword}>
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
        </div>
      </div>
    </AppLayout>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value?: string | null;
}) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-4">
      <div className="p-2.5 rounded-lg bg-muted shrink-0">
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

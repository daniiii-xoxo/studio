"use client";

import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@studio/ui";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { supabase } from "@studio/database";
import { useAuthStore } from "@studio/store";
import { useUserRole } from "@/hooks/use-user-role";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useQuery } from "@tanstack/react-query";
import { getMinistries, getC2SGroups } from "@/actions/db";
import { LogOut, ChevronDown, QrCode, KeyRound, User } from "lucide-react";

export function UserNav() {
  const { user } = useAuthStore();
  const { workerProfile, allRoles, isSuperAdmin, isMinistryHead } = useUserRole();
  const { toast } = useToast();
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();

  const { data: allMinistries } = useQuery({
    queryKey: ["ministries"],
    queryFn: getMinistries,
  });

  const { data: c2sGroups } = useQuery({
    queryKey: ["c2s-groups"],
    queryFn: getC2SGroups,
  });

  const handleLogout = async () => {
    if (impersonatedWorkerId) {
      stopImpersonation();
      return;
    }
    await supabase.auth.signOut();
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });
      if (error) throw error;
      toast({
        title: "Password Reset Email Sent",
        description: "Please check your inbox to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to send password reset email.",
      });
    }
  };

  const initial =
    workerProfile?.firstName?.[0]?.toUpperCase() ||
    user?.displayName?.[0]?.toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    "S";

  const displayName =
    workerProfile?.firstName && workerProfile?.lastName
      ? `${workerProfile.firstName} ${workerProfile.lastName}`
      : workerProfile?.firstName || user?.displayName || user?.email?.split("@")[0] || "System Admin";

  // Resolve role title
  const roleName = isSuperAdmin
    ? "Administrator"
    : allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name ||
      (workerProfile as any)?.role ||
      "Administrator";

  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDept = userMinistry?.department || "Outreach";

  const rawRole = (allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name || "").toLowerCase();
  const isHead = isMinistryHead || rawRole.includes("head") || Boolean(allMinistries && workerProfile?.id && allMinistries.some((m: any) => m.headId === workerProfile.id));

  let indicatorBadge = "";
  if (isSuperAdmin) {
    indicatorBadge = "Super Admin • All Departments";
  } else if (isHead) {
    indicatorBadge = `Ministry Head • ${headDept}`;
  } else {
    const clusterLabel = userMinistry?.name || (workerProfile as any)?.department || "Outreach";
    indicatorBadge = `Mentor • ${clusterLabel}`;
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center gap-1.5 p-1 sm:px-2 mr-1 sm:mr-2 rounded-lg hover:bg-muted/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer select-none"
        >
          {/* Avatar circle */}
          <div className="h-8 w-8 rounded-full bg-indigo-600 dark:bg-indigo-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0 ring-2 ring-indigo-300/50">
            {initial}
          </div>

          {/* User name - font-medium and nudged down slightly */}
          <span className="hidden sm:inline-block text-xs sm:text-[13px] font-medium text-foreground leading-none ml-1 translate-y-[1px]">
            {displayName}
          </span>

          {/* Down Chevron - closer to text */}
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 translate-y-[1px]" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56 mt-1.5 shadow-lg rounded-xl" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-semibold leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {indicatorBadge || roleName}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {impersonatedWorkerId && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={stopImpersonation} className="cursor-pointer">
                <LogOut className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>Exit Impersonation</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem
          onSelect={handleLogout}
          className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

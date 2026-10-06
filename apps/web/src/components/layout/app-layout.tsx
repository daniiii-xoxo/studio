"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarTrigger,
  SidebarInset,
} from "@studio/ui";
import { Nav } from "@/components/layout/nav";
import { UserNav } from "@/components/layout/user-nav";
import { ThemeToggle } from "@/components/settings/theme-toggle";
import {
  LoaderCircle,
  Info,
  X,
  LayoutDashboard,
  Users,
  Calendar as CalendarIcon,
  Menu,
  QrCode,
} from "lucide-react";
import Image from "next/image";
import { useAuthStore } from "@studio/store";
import { useImpersonation } from "@/hooks/use-impersonation";
import { useUserRole } from "@/hooks/use-user-role";
import { Button } from "@studio/ui";
import { useSidebar } from "@studio/ui";
import { useState } from "react";

const MobileSidebarTrigger = () => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground active:scale-95 transition-all"
      onClick={() => setOpenMobile(true)}
    >
      <Menu className="h-5 w-5" />
      <span className="text-[10px] font-medium leading-none">More</span>
    </Button>
  );
};

const HeaderMobileTrigger = () => {
  const { setOpenMobile } = useSidebar();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 -ml-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all md:hidden shrink-0"
      onClick={() => setOpenMobile(true)}
      aria-label="Open Navigation Menu"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};

import { useMinistries } from "@/hooks/use-ministries";

const ImpersonationBanner = () => {
  const { impersonatedWorkerId, stopImpersonation } = useImpersonation();
  const { workerProfile, allRoles, isMinistryHead } = useUserRole();
  const { allMinistries } = useMinistries();

  if (!impersonatedWorkerId) {
    return null;
  }

  const userMinistry = allMinistries?.find(
    (m: any) =>
      m.id === workerProfile?.majorMinistryId ||
      m.headId === workerProfile?.id ||
      m.approverId === workerProfile?.id
  );
  const headDept = userMinistry?.department || "Outreach";

  const rawRole = (allRoles?.find((r: any) => r.id === workerProfile?.roleId)?.name || "").toLowerCase();
  const isHead = isMinistryHead || rawRole.includes("head") || Boolean(allMinistries && workerProfile?.id && allMinistries.some((m: any) => m.headId === workerProfile.id));

  let indicatorLabel = "";
  if (isHead) {
    indicatorLabel = `Ministry Head • ${headDept} Department`;
  } else {
    const clusterLabel = userMinistry?.name || (workerProfile as any)?.department || "Outreach";
    indicatorLabel = `Mentor • ${clusterLabel}`;
  }

  return (
    <div className="bg-amber-400 text-amber-950 p-2 text-center text-sm font-semibold flex items-center justify-center gap-3 flex-wrap shadow-sm">
      <Info className="h-4 w-4" />
      <span>
        You are viewing as{" "}
        <strong>
          {workerProfile?.firstName} {workerProfile?.lastName}
        </strong>{" "}
        <span className="bg-amber-100 text-amber-900 border border-amber-300/80 px-2 py-0.5 rounded-full text-xs font-bold shadow-xs">
          {indicatorLabel}
        </span>
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="hover:bg-amber-500/80 text-xs h-7 px-2 font-bold"
      >
        <X className="mr-1.5 h-3.5 w-3.5" />
        Exit View-As Mode
      </Button>
    </div>
  );
};

export function AppLayout({ children }: { children: React.ReactNode }) {
  const currentPathname = usePathname();
  const router = useRouter();
  const { user, isUserLoading } = useAuthStore();

  useEffect(() => {
    // If auth is done loading and there's no user, redirect to login
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);


  // While auth is loading, show a full-screen loader
  if (isUserLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user, we are in the process of redirecting, so don't render the layout
  if (!user) {
    return null;
  }

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="pb-1.5 px-3 pt-2.5 sticky top-0 z-10 bg-sidebar">
          <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
            <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:hidden">
              <Image
                src="/church-logo.png"
                alt="COG Logo"
                width={50}
                height={50}
                className="w-12 h-12 object-contain shrink-0"
                priority
              />
              <span
                className="font-extrabold font-headline tracking-tight text-white translate-y-0.5 leading-none brand-title"
                style={{ fontSize: "28px" }}
              >
                COG APP
              </span>
            </div>
            <SidebarTrigger className="flex text-white/80 hover:text-white hover:bg-white/10" />
          </div>
          <div className="h-[1px] bg-white/15 mx-1.5 mt-2.5 mb-1 group-data-[collapsible=icon]:hidden" />
        </SidebarHeader>
        <SidebarContent className="overflow-y-auto scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <Nav pathname={currentPathname} />
        </SidebarContent>
      </Sidebar>
      {/* Fixed Header - mobile only. Desktop uses the sidebar header instead. */}
      <header className="md:hidden flex h-14 items-center gap-2.5 border-b border-border/50 bg-white/95 dark:bg-card/95 backdrop-blur-md px-3 fixed top-0 left-0 right-0 z-50 pt-[env(safe-area-inset-top)] box-content shadow-2xs">
        <div className="flex items-center gap-2.5 shrink-0">
          <HeaderMobileTrigger />
          <div className="flex items-center gap-2">
            <Image
              src="/church-logo.png"
              alt="COG Logo"
              width={36}
              height={36}
              className="w-9 h-9 object-contain"
              priority
            />
            <span
              className="font-extrabold font-headline tracking-tight brand-title"
              style={{ fontSize: "22px" }}
            >
              COG APP
            </span>
          </div>
        </div>
        <div className="w-full flex-1" />
        <ThemeToggle variant="compact" />
        <UserNav />
      </header>

      <SidebarInset className="pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-0 min-w-0 max-w-full flex flex-col h-screen overflow-hidden">
        <ImpersonationBanner />
        {/* Desktop header bar (inside SidebarInset, sticky) */}
        <header className="hidden md:flex h-[52px] items-center gap-3 border-b border-border/50 bg-white/95 dark:bg-card/95 backdrop-blur-md px-4 lg:px-6 sticky top-0 z-40 shrink-0 shadow-2xs">
          <div className="w-full flex-1" />
          <ThemeToggle variant="compact" />
          <UserNav />
        </header>
        {/* Mobile spacer so content doesn't hide behind fixed header */}
        <div className="md:hidden h-14 shrink-0 pt-[env(safe-area-inset-top)] box-content" />
        <main className="flex-1 overflow-y-auto flex flex-col gap-4 p-3 sm:p-4 lg:gap-6 lg:p-6 min-w-0 max-w-full">
          {children}
        </main>
      </SidebarInset>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/95 backdrop-blur-md border-t border-border/60 flex justify-around items-center z-50 pb-[env(safe-area-inset-bottom)] box-content shadow-lg">
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground data-[active=true]:text-primary active:scale-95 transition-all"
          data-active={currentPathname === "/dashboard" || currentPathname === "/"}
          onClick={() => router.push("/dashboard")}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-semibold leading-none">Home</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground data-[active=true]:text-primary active:scale-95 transition-all"
          data-active={currentPathname.startsWith("/workers/my-qr")}
          onClick={() => router.push("/workers/my-qr")}
        >
          <QrCode className="h-5 w-5" />
          <span className="text-[10px] font-semibold leading-none">My QR</span>
        </Button>
        <Button
          variant="ghost"
          className="flex-1 h-full flex flex-col justify-center items-center gap-1 rounded-none text-muted-foreground hover:text-foreground data-[active=true]:text-primary active:scale-95 transition-all"
          data-active={currentPathname.startsWith("/reservations")}
          onClick={() => router.push("/reservations/my")}
        >
          <CalendarIcon className="h-5 w-5" />
          <span className="text-[10px] font-semibold leading-none">Rooms</span>
        </Button>

        {/* Connects with Sidebar to open the side menu - removed */}
      </div>
    </SidebarProvider>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { LoaderCircle } from "lucide-react";

export default function LegacyCalendarPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/reservations/masterview/daily");
  }, [router]);

  return (
    <AppLayout>
      <div className="flex h-[50vh] w-full items-center justify-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    </AppLayout>
  );
}

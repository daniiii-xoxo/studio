"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppLayout } from "@/components/layout/app-layout";
import { EditWorkerDialog } from "@/components/workers/edit-worker-dialog";
import { useRoles } from "@/hooks/use-roles";
import { useMinistries } from "@/hooks/use-ministries";
import { useUserRole } from "@/hooks/use-user-role";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { CheckCircle2, Clock, LoaderCircle } from "lucide-react";
import { getWorkerById, updateWorker as updateWorkerSql, createApproval as createApprovalSql, assignRolesToWorker, adminSendPasswordResetEmail } from "@/actions/db";
import { useAuditLog } from "@/hooks/use-audit-log";
import { supabase } from "@studio/database";
import type { Worker } from "@studio/types";

export default function EditWorkerPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { toast } = useToast();
  const { logAction } = useAuditLog();
  
  const [worker, setWorker] = useState<Worker | null>(null);
  const [isFetchingWorker, setIsFetchingWorker] = useState(true);

  const { roles, isLoading: rolesLoading } = useRoles();
  const { ministries, isLoading: ministriesLoading } = useMinistries();
  const { workerProfile, canManageWorkers, isSuperAdmin, myMinistryIds, isLoading: userRoleLoading } = useUserRole();

  useEffect(() => {
    if (userRoleLoading) return;
    if (id) {
      getWorkerById(id)
        .then((data) => {
          if (!data) {
            router.push("/workers");
            return;
          }
          if (!isSuperAdmin) {
            if (!myMinistryIds || myMinistryIds.length === 0) {
              toast({
                variant: "destructive",
                title: "Unauthorized",
                description: "No ministry assignment available to edit workers.",
              });
              router.push("/workers");
              return;
            }
            const wMajor = (data as any).majorMinistryId;
            const wMinor = (data as any).minorMinistryId;
            const wAssigned = (data as any).assignedMinistryIds || [];
            const hasAccess =
              myMinistryIds.includes(wMajor) ||
              myMinistryIds.includes(wMinor) ||
              (Array.isArray(wAssigned) && wAssigned.some((mid: string) => myMinistryIds.includes(mid)));

            if (!hasAccess) {
              toast({
                variant: "destructive",
                title: "Unauthorized",
                description: "You cannot edit a worker outside your assigned ministry.",
              });
              router.push("/workers");
              return;
            }
          }
          setWorker(data as any);
        })
        .catch((err) => {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch worker details.",
          });
          router.push("/workers");
        })
        .finally(() => {
          setIsFetchingWorker(false);
        });
    }
  }, [id, router, toast, isSuperAdmin, myMinistryIds, userRoleLoading]);

  const handleSave = async (workerData: Partial<Worker>, roleIds: string[]) => {
    if (!worker || !id) return;

    try {
      const isMinistryChanging =
        (workerData.majorMinistryId !== undefined &&
          workerData.majorMinistryId !== (worker.majorMinistryId || "")) ||
        (workerData.minorMinistryId !== undefined &&
          workerData.minorMinistryId !== (worker.minorMinistryId || ""));

      if (isMinistryChanging && !isSuperAdmin) {
        const details =
          `Ministry change request for ${worker.firstName} ${worker.lastName}.\n` +
          (workerData.majorMinistryId !== undefined
            ? `Major: ${ministries.find((m) => m.id === worker.majorMinistryId)?.name || "None"} -> ${ministries.find((m) => m.id === workerData.majorMinistryId)?.name || "None"}\n`
            : "") +
          (workerData.minorMinistryId !== undefined
            ? `Minor: ${ministries.find((m) => m.id === worker.minorMinistryId)?.name || "None"} -> ${ministries.find((m) => m.id === workerData.minorMinistryId)?.name || "None"}`
            : "");

        await createApprovalSql({
          requester: `${workerProfile?.firstName} ${workerProfile?.lastName}`,
          type: "Ministry Change",
          details,
          status: "Pending Outgoing Approval",
          workerId: worker.id,
          oldMajorId: worker.majorMinistryId || "",
          newMajorId: workerData.majorMinistryId ?? worker.majorMinistryId,
          oldMinorId: worker.minorMinistryId || "",
          newMinorId: workerData.minorMinistryId ?? worker.minorMinistryId,
          outgoingApproved: false,
          incomingApproved: false,
        });

        const { majorMinistryId, minorMinistryId, ...otherFields } = workerData;
        await updateWorkerSql(id, otherFields);

        await logAction(
          "Requested Ministry Change",
          "Workers",
          `Requested ministry change for ${worker.firstName} ${worker.lastName}`,
          worker.id,
          `${worker.firstName} ${worker.lastName}`,
        );
        toast({
          title: "Change Pending Approval",
          description: "The ministry change has been submitted for approval.",
        });
      } else {
        await updateWorkerSql(id, workerData);
        await logAction(
          "Updated Worker",
          "Workers",
          `Updated worker: ${workerData.firstName} ${workerData.lastName}`,
          id,
          `${workerData.firstName} ${workerData.lastName}`,
        );
        toast({
          title: "Worker Updated",
          description: "Worker profile has been updated successfully.",
        });
      }

      // Sync the WorkerRole join table
      await assignRolesToWorker(id, roleIds);

      router.push("/workers");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Save Failed",
        description: error.message || "Could not save worker profile.",
      });
    }
  };

  const handleResetPassword = async (w: Worker) => {
    try {
      await adminSendPasswordResetEmail(id, window.location.origin);
      toast({
        title: "Reset Link Sent",
        description: `A password reset link has been successfully emailed to ${w.email}.`,
      });
      await logAction(
        "Requested Password Reset",
        "Workers",
        `Admin sent password reset email to ${w.firstName} ${w.lastName}`,
        id,
        `${w.firstName} ${w.lastName}`,
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Email Failed",
        description: error.message || "Failed to force send reset email.",
      });
    }
  };

  const isLoading = rolesLoading || ministriesLoading || userRoleLoading || isFetchingWorker;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center py-10">
          <LoaderCircle className="h-8 w-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  if (!canManageWorkers) {
    return (
      <AppLayout>
        <div className="p-10 text-center">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p>You do not have permission to manage workers.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <EditWorkerDialog
        worker={worker}
        open={true}
        onOpenChange={(open) => {
          if (!open) router.push("/workers");
        }}
        roles={roles}
        ministries={ministries}
        canManage={canManageWorkers}
        isSuperAdmin={isSuperAdmin}
        currentWorkerProfile={workerProfile}
        onSuccess={() => router.push("/workers")}
      />
    </AppLayout>
  );
}

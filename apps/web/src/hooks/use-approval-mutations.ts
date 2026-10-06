'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateApproval } from '@/actions/db';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/use-user-role';
import type { ApprovalRequest } from '@/lib/types';

/**
 * Hook for approval-related mutations.
 * Centralizes multi-stage approval logic, actor authorization, and side-effects.
 */
export function useApprovalMutations() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { workerProfile } = useUserRole();

    const updateStatusMutation = useMutation({
        mutationFn: async ({
            request,
            status,
            options = {},
        }: {
            request: ApprovalRequest;
            status: string;
            options?: {
                outgoingApproved?: boolean;
            };
        }) => {
            if (!request.id) throw new Error('Missing request ID');

            const updateData: any = { status };
            if (options.outgoingApproved !== undefined) {
                updateData.outgoingApproved = options.outgoingApproved;
            }

            return await updateApproval(request.id, updateData, workerProfile?.id);
        },
        onSuccess: (data: any) => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
            queryClient.invalidateQueries({ queryKey: ['bookings'] });

            if (data?.status === 'Approved' && data?.type === 'Room Booking') {
                if (data.emailNotificationSent) {
                    toast({
                        title: 'Reservation Approved',
                        description: 'Reservation approved successfully. The worker has been notified by email.',
                    });
                } else if (data.emailNotificationError) {
                    toast({
                        variant: 'destructive',
                        title: 'Reservation Approved',
                        description: 'Reservation approved successfully, but the notification email could not be sent.',
                    });
                } else {
                    toast({
                        title: 'Reservation Approved',
                        description: 'Reservation approved successfully.',
                    });
                }
            } else if (data?.status === 'Pending Admin Approval') {
                toast({
                    title: 'Ministry Head Approval Recorded',
                    description: 'Request has been forwarded to System Admin for final approval.',
                });
            } else {
                toast({
                    title: `Request ${data?.status || 'Updated'}`,
                    description: `Successfully updated the status of the request.`,
                });
            }
        },
        onError: (error: any) => {
            console.error('Approval update error:', error);
            toast({
                variant: 'destructive',
                title: 'Update Failed',
                description: error?.message || 'Could not update the approval request.',
            });
        },
    });

    return {
        updateStatus: updateStatusMutation.mutate,
        isUpdating: updateStatusMutation.isPending,
    };
}

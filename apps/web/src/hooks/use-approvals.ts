import { ApprovalRequest } from '@studio/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getApprovals, createApproval, updateApproval } from '@/actions/db';
import { useUserRole } from '@/hooks/use-user-role';

export function useApprovals(filters?: { ministryIds?: string[]; actorId?: string }) {
    const { workerProfile, myMinistryIds, isSuperAdmin } = useUserRole();
    const queryClient = useQueryClient();

    const actorId = filters?.actorId || workerProfile?.id;
    let effectiveMinistryIds = filters?.ministryIds;
    if (!isSuperAdmin) {
        if (!myMinistryIds || myMinistryIds.length === 0) {
            effectiveMinistryIds = ['__NONE__'];
        } else if (effectiveMinistryIds && effectiveMinistryIds.length > 0) {
            effectiveMinistryIds = effectiveMinistryIds.filter(id => myMinistryIds.includes(id));
            if (effectiveMinistryIds.length === 0) effectiveMinistryIds = ['__NONE__'];
        } else {
            effectiveMinistryIds = myMinistryIds;
        }
    }

    const { data, isLoading, error } = useQuery({
        queryKey: ['approvals', actorId, effectiveMinistryIds],
        queryFn: () => getApprovals({ ministryIds: effectiveMinistryIds, actorId }),
        refetchInterval: 3000, // Auto-refresh every 3 seconds for real-time updates
        refetchOnWindowFocus: true, // Refresh when user returns to tab
        staleTime: 0, // Always consider data stale to ensure fresh data
    });

    const createMutation = useMutation({
        mutationFn: createApproval,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateApproval(id, data, actorId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['approvals'] });
        },
    });

    return {
        approvals: (data as ApprovalRequest[]) || [],
        isLoading,
        error,
        createApproval: createMutation.mutateAsync,
        updateApproval: updateMutation.mutateAsync,
    };
}

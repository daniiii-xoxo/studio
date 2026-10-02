'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceRecords, createAttendanceRecord, recordAutoAttendance } from '@/actions/db';
import { useUserRole } from '@/hooks/use-user-role';

export function useAttendance(filters: {
    workerProfileId?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    ministryIds?: string[];
    actorId?: string;
    enabled?: boolean;
} = {}) {
    const { workerProfile, myMinistryIds, isSuperAdmin } = useUserRole();
    const queryClient = useQueryClient();
    const { enabled = true, ...queryFilters } = filters;

    const actorId = filters.actorId || workerProfile?.id;
    let effectiveMinistryIds = filters.ministryIds;
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

    const { data, isPending, error } = useQuery({
        queryKey: ['attendance', { ...queryFilters, actorId, ministryIds: effectiveMinistryIds }],
        queryFn: () => getAttendanceRecords({ ...queryFilters, actorId, ministryIds: effectiveMinistryIds }),
        enabled: enabled,
    });

    // When enabled=false, isPending is true but we shouldn't show a loader
    const isLoading = enabled && isPending;

    const createMutation = useMutation({
        mutationFn: createAttendanceRecord,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['mealStubs'] });
        },
    });

    const autoMutation = useMutation({
        mutationFn: recordAutoAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
            queryClient.invalidateQueries({ queryKey: ['mealStubs'] });
            queryClient.invalidateQueries({ queryKey: ['scanLogs'] });
        },
    });

    return {
        attendanceRecords: data || [],
        isLoading,
        error,
        createAttendanceRecord: createMutation.mutateAsync,
        recordAutoAttendance: autoMutation.mutateAsync,
    };
}


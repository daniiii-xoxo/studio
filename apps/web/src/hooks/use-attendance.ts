'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceRecords, createAttendanceRecord, recordAutoAttendance } from '@/actions/db';

export function useAttendance(filters: { workerProfileId?: string; dateFrom?: Date; enabled?: boolean } = {}) {
    const queryClient = useQueryClient();
    const { enabled = true, ...queryFilters } = filters;

    const { data, isPending, error } = useQuery({
        queryKey: ['attendance', queryFilters],
        queryFn: () => getAttendanceRecords(queryFilters),
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


'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceSettings, updateAttendanceSettings } from '@/actions/db';
import { type AttendanceShiftSettings, DEFAULT_ATTENDANCE_SETTINGS } from '@/lib/attendance-config';

export function useAttendanceSettings() {
    const queryClient = useQueryClient();

    const { data: settings, isLoading, error } = useQuery({
        queryKey: ['attendance-settings'],
        queryFn: () => getAttendanceSettings(),
    });

    const mutation = useMutation({
        mutationFn: (newSettings: Partial<AttendanceShiftSettings>) => updateAttendanceSettings(newSettings),
        onSuccess: (updated) => {
            queryClient.setQueryData(['attendance-settings'], updated);
            queryClient.invalidateQueries({ queryKey: ['attendance-settings'] });
            queryClient.invalidateQueries({ queryKey: ['attendance'] });
        },
    });

    return {
        settings: settings || DEFAULT_ATTENDANCE_SETTINGS,
        isLoading,
        error,
        updateSettings: mutation.mutateAsync,
        isSaving: mutation.isPending,
    };
}

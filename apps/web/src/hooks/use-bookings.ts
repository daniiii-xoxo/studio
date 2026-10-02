'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBookings } from '@/actions/db';
import { useUserRole } from '@/hooks/use-user-role';

export function useBookings(filters: {
    workerProfileId?: string;
    dateFrom?: Date | string;
    dateTo?: Date | string;
    roomId?: string;
    status?: string;
    ministryIds?: string[];
    actorId?: string;
} = {}) {
    const { workerProfile, myMinistryIds, isSuperAdmin } = useUserRole();
    const queryClient = useQueryClient();

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

    const { data, isLoading, error } = useQuery({
        queryKey: ['bookings', { ...filters, actorId, ministryIds: effectiveMinistryIds }],
        queryFn: () => getBookings({ ...filters, actorId, ministryIds: effectiveMinistryIds }),
    });

    return {
        bookings: data || [],
        isLoading,
        error,
    };
}

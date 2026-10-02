'use client';

import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMinistries, createMinistry, updateMinistry, deleteMinistry } from '@/actions/db';
import { useUserRole } from '@/hooks/use-user-role';

export function useMinistries(options: { all?: boolean } = {}) {
    const queryClient = useQueryClient();
    const { myMinistryIds, isSuperAdmin, isLoading: isRoleLoading } = useUserRole();

    const { data, isLoading, error } = useQuery({
        queryKey: ['ministries'],
        queryFn: () => getMinistries(),
        staleTime: 10_000,
        refetchOnWindowFocus: true,
    });

    const createMutation = useMutation({
        mutationFn: createMinistry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => updateMinistry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: deleteMinistry,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ministries'] });
        },
    });

    const allMinistriesList = data || [];

    const filteredMinistries = useMemo(() => {
        // If explicitly requesting all ministries, or user is SuperAdmin, return all
        if (options.all || isSuperAdmin) {
            return allMinistriesList;
        }

        // Avoid premature empty list while role / user profile is still loading
        if (isRoleLoading) {
            return [];
        }

        // If user has no ministry assignment, return empty list
        if (!myMinistryIds || myMinistryIds.length === 0) {
            return [];
        }

        // Return only ministries the user is assigned to
        return allMinistriesList.filter((m: any) => myMinistryIds.includes(m.id));
    }, [options.all, isSuperAdmin, isRoleLoading, myMinistryIds, allMinistriesList]);

    const hasNoMinistryAssignment = !isSuperAdmin && !isRoleLoading && (!myMinistryIds || myMinistryIds.length === 0);

    return {
        ministries: filteredMinistries,
        allMinistries: allMinistriesList,
        hasNoMinistryAssignment,
        isLoading: isLoading || isRoleLoading,
        error,
        createMinistry: createMutation.mutateAsync,
        updateMinistry: updateMutation.mutateAsync,
        deleteMinistry: deleteMutation.mutateAsync,
    };
}

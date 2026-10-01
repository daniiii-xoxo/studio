'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMinistries, createMinistry, updateMinistry, deleteMinistry } from '@/actions/db';

export function useMinistries() {
    const queryClient = useQueryClient();

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

    return {
        ministries: data || [],
        isLoading,
        error,
        createMinistry: createMutation.mutateAsync,
        updateMinistry: updateMutation.mutateAsync,
        deleteMinistry: deleteMutation.mutateAsync,
    };
}

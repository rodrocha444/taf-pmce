import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogApi } from '../services/supabase-api';
import type { ExerciseCatalogItem } from '../types';

export const CATALOG_KEY = ['exercise_catalog'] as const;

export function useExerciseCatalog() {
  return useQuery({
    queryKey: CATALOG_KEY,
    queryFn: catalogApi.getAll,
  });
}

export function useAddCatalogExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: ExerciseCatalogItem) => catalogApi.insert(item),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: CATALOG_KEY });
      const prev = qc.getQueryData<ExerciseCatalogItem[]>(CATALOG_KEY) ?? [];
      qc.setQueryData<ExerciseCatalogItem[]>(CATALOG_KEY, [...prev, item]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CATALOG_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useSaveCatalogExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (item: ExerciseCatalogItem) => catalogApi.upsert(item),
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: CATALOG_KEY });
      const prev = qc.getQueryData<ExerciseCatalogItem[]>(CATALOG_KEY) ?? [];
      const exists = prev.some((c) => c.id === item.id);
      qc.setQueryData<ExerciseCatalogItem[]>(
        CATALOG_KEY,
        exists ? prev.map((c) => (c.id === item.id ? item : c)) : [...prev, item]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CATALOG_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

export function useDeleteCatalogExercise() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => catalogApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: CATALOG_KEY });
      const prev = qc.getQueryData<ExerciseCatalogItem[]>(CATALOG_KEY) ?? [];
      qc.setQueryData<ExerciseCatalogItem[]>(CATALOG_KEY, prev.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(CATALOG_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: CATALOG_KEY }),
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { historyApi } from '../services/supabase-api';
import type { WorkoutSessionLog } from '../types';

export const HISTORY_KEY = ['history'] as const;

export function useHistory() {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: historyApi.getAll,
  });
}

export function useAddHistoryLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (log: WorkoutSessionLog) => historyApi.insert(log),
    onMutate: async (log) => {
      await qc.cancelQueries({ queryKey: HISTORY_KEY });
      const prev = qc.getQueryData<WorkoutSessionLog[]>(HISTORY_KEY) ?? [];
      qc.setQueryData<WorkoutSessionLog[]>(HISTORY_KEY, [log, ...prev]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HISTORY_KEY }),
  });
}

export function useDeleteHistoryLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => historyApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: HISTORY_KEY });
      const prev = qc.getQueryData<WorkoutSessionLog[]>(HISTORY_KEY) ?? [];
      qc.setQueryData<WorkoutSessionLog[]>(HISTORY_KEY, prev.filter((h) => h.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HISTORY_KEY }),
  });
}

export function useClearHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => historyApi.deleteAll(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: HISTORY_KEY });
      const prev = qc.getQueryData<WorkoutSessionLog[]>(HISTORY_KEY) ?? [];
      qc.setQueryData<WorkoutSessionLog[]>(HISTORY_KEY, []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: HISTORY_KEY }),
  });
}

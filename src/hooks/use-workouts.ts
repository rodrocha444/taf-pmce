import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workoutsApi } from '../services/turso-api';
import type { Workout } from '../types';

export const WORKOUTS_KEY = ['workouts'] as const;

export function useWorkouts() {
  return useQuery({
    queryKey: WORKOUTS_KEY,
    queryFn: workoutsApi.getAll,
  });
}

export function useSaveWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workout: Workout) => workoutsApi.upsert(workout),
    onMutate: async (workout) => {
      await qc.cancelQueries({ queryKey: WORKOUTS_KEY });
      const prev = qc.getQueryData<Workout[]>(WORKOUTS_KEY) ?? [];
      const exists = prev.some((w) => w.id === workout.id);
      qc.setQueryData<Workout[]>(
        WORKOUTS_KEY,
        exists ? prev.map((w) => (w.id === workout.id ? workout : w)) : [...prev, workout]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(WORKOUTS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: WORKOUTS_KEY }),
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workoutsApi.delete(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: WORKOUTS_KEY });
      const prev = qc.getQueryData<Workout[]>(WORKOUTS_KEY) ?? [];
      qc.setQueryData<Workout[]>(WORKOUTS_KEY, prev.filter((w) => w.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(WORKOUTS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: WORKOUTS_KEY }),
  });
}

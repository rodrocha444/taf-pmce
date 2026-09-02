import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { runningApi } from '../services/turso-api';
import { calculatePaceSecPerKm, calculateSpeedKmH } from '../utils/formatters';
import type { RunningWorkout, RunningLog } from '../types';

export const RUNNING_WORKOUTS_KEY = ['running_workouts'] as const;
export const RUNNING_HISTORY_KEY = ['running_history'] as const;

// ─── Running Workouts ─────────────────────────────────────────────────────────

export function useRunningWorkouts() {
  return useQuery({
    queryKey: RUNNING_WORKOUTS_KEY,
    queryFn: runningApi.getAllWorkouts,
  });
}

export function useSaveRunningWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (workout: RunningWorkout) => runningApi.upsertWorkout(workout),
    onMutate: async (workout) => {
      await qc.cancelQueries({ queryKey: RUNNING_WORKOUTS_KEY });
      const prev = qc.getQueryData<RunningWorkout[]>(RUNNING_WORKOUTS_KEY) ?? [];
      const exists = prev.some((w) => w.id === workout.id);
      qc.setQueryData<RunningWorkout[]>(
        RUNNING_WORKOUTS_KEY,
        exists ? prev.map((w) => (w.id === workout.id ? workout : w)) : [workout, ...prev]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(RUNNING_WORKOUTS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RUNNING_WORKOUTS_KEY }),
  });
}

export function useDeleteRunningWorkout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runningApi.deleteWorkout(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: RUNNING_WORKOUTS_KEY });
      const prev = qc.getQueryData<RunningWorkout[]>(RUNNING_WORKOUTS_KEY) ?? [];
      qc.setQueryData<RunningWorkout[]>(RUNNING_WORKOUTS_KEY, prev.filter((w) => w.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(RUNNING_WORKOUTS_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RUNNING_WORKOUTS_KEY }),
  });
}

// ─── Running History ──────────────────────────────────────────────────────────

export function useRunningHistory() {
  return useQuery({
    queryKey: RUNNING_HISTORY_KEY,
    queryFn: runningApi.getAllHistory,
  });
}

export function useAddRunningLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logData: Omit<RunningLog, 'paceSecPerKm' | 'speedKmH'>) => {
      const paceSecPerKm = calculatePaceSecPerKm(logData.distanceKm, logData.durationSeconds);
      const speedKmH = calculateSpeedKmH(logData.distanceKm, logData.durationSeconds);
      const log: RunningLog = { ...logData, paceSecPerKm, speedKmH };
      return runningApi.insertLog(log);
    },
    onMutate: async (logData) => {
      await qc.cancelQueries({ queryKey: RUNNING_HISTORY_KEY });
      const prev = qc.getQueryData<RunningLog[]>(RUNNING_HISTORY_KEY) ?? [];
      const optimistic: RunningLog = {
        ...logData,
        paceSecPerKm: calculatePaceSecPerKm(logData.distanceKm, logData.durationSeconds),
        speedKmH: calculateSpeedKmH(logData.distanceKm, logData.durationSeconds),
      };
      qc.setQueryData<RunningLog[]>(RUNNING_HISTORY_KEY, [optimistic, ...prev]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(RUNNING_HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RUNNING_HISTORY_KEY }),
  });
}

export function useDeleteRunningLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => runningApi.deleteLog(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: RUNNING_HISTORY_KEY });
      const prev = qc.getQueryData<RunningLog[]>(RUNNING_HISTORY_KEY) ?? [];
      qc.setQueryData<RunningLog[]>(RUNNING_HISTORY_KEY, prev.filter((l) => l.id !== id));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(RUNNING_HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RUNNING_HISTORY_KEY }),
  });
}

export function useClearRunningHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => runningApi.deleteAllHistory(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: RUNNING_HISTORY_KEY });
      const prev = qc.getQueryData<RunningLog[]>(RUNNING_HISTORY_KEY) ?? [];
      qc.setQueryData<RunningLog[]>(RUNNING_HISTORY_KEY, []);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(RUNNING_HISTORY_KEY, ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: RUNNING_HISTORY_KEY }),
  });
}

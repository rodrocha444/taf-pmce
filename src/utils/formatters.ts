import type { Exercise } from '../types';

export function formatSecondsToMMSS(seconds: number): string {
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.floor(Math.max(0, seconds) % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatTimeHoursMins(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hrs > 0) {
    return `${hrs}h ${mins > 0 ? `${mins}m` : ''}`;
  }
  if (mins > 0) {
    return `${mins} min${secs > 0 ? ` ${secs}s` : ''}`;
  }
  return `${secs} s`;
}

export function getExerciseStartTime(exercises: Exercise[], targetIndex: number): string {
  let accumulatedSeconds = 0;
  for (let i = 0; i < targetIndex && i < exercises.length; i++) {
    accumulatedSeconds += exercises[i].durationSeconds;
  }
  return formatSecondsToMMSS(accumulatedSeconds);
}

export function getTotalWorkoutDuration(exercises: Exercise[]): number {
  return exercises.reduce((acc, curr) => acc + curr.durationSeconds, 0);
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return isoString;
  }
}

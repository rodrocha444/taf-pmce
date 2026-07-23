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

// Calcula o Pace (min/km) a partir de distancia (km) e tempo (segundos)
export function calculatePaceSecPerKm(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0 || durationSeconds <= 0) return 0;
  return Math.round(durationSeconds / distanceKm);
}

// Formata pace em formato string ex: "4:58 min/km"
export function formatPace(paceSecPerKm: number): string {
  if (!paceSecPerKm || paceSecPerKm <= 0) return '--:-- min/km';
  const mins = Math.floor(paceSecPerKm / 60);
  const secs = Math.round(paceSecPerKm % 60);
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`;
}

// Calcula velocidade em km/h a partir de distancia (km) e tempo (segundos)
export function calculateSpeedKmH(distanceKm: number, durationSeconds: number): number {
  if (distanceKm <= 0 || durationSeconds <= 0) return 0;
  const hours = durationSeconds / 3600;
  return Number((distanceKm / hours).toFixed(2));
}

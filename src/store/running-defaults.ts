import type { RunningWorkout } from '../types';

export const DEFAULT_RUNNING_WORKOUTS: RunningWorkout[] = [
  {
    id: 'run-taf-pmce',
    title: 'Corrida TAF PMCE (2.400m)',
    targetMode: 'distance',
    targetDistanceKm: 2.4,
    targetDurationSeconds: 720,
    targetPaceSecPerKm: 300,
    notes: 'Meta Oficial TAF PMCE: 2.400 metros em 12 minutos (Pace 5:00 min/km)',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'run-interval-6x400',
    title: 'Treino Intervalado por Voltas (6x 400m)',
    targetMode: 'interval',
    targetDistanceKm: 2.4,
    targetDurationSeconds: 720,
    targetPaceSecPerKm: 300,
    lapsCount: 6,
    lapDistanceMeters: 400,
    lapTargetSeconds: 120,
    restBetweenLapsSeconds: 60,
    notes: '6 tiros de 400m em pista com 1 minuto de trote/descanso entre tiros',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'run-5k',
    title: 'Rodagem 5km',
    targetMode: 'distance',
    targetDistanceKm: 5.0,
    targetDurationSeconds: 1650,
    targetPaceSecPerKm: 330,
    notes: 'Treino de resistência aeróbica contínua',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'run-30min-time',
    title: 'Corrida Livre (30 Minutos)',
    targetMode: 'time',
    targetDurationSeconds: 1800,
    notes: 'Treino contínuo por tempo. A distância e o ritmo são livres.',
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'run-sprint-400m',
    title: 'Tiro de Velocidade (400m)',
    targetMode: 'distance',
    targetDistanceKm: 0.4,
    targetDurationSeconds: 90,
    targetPaceSecPerKm: 225,
    notes: 'Treino de velocidade anaeróbica',
    isDefault: true,
    createdAt: new Date().toISOString()
  }
];

import type { ExerciseCatalogItem } from '../types';

export const DEFAULT_EXERCISE_CATALOG: ExerciseCatalogItem[] = [
  {
    id: 'cat-flexao-braco',
    name: 'Flexão de Braço no Solo',
    category: 'flexao',
    executionType: 'reps',
    defaultTargetReps: 20,
    defaultWorkDurationSeconds: 60,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Corpo alinhado, peito rente ao solo',
    isDefault: true
  },
  {
    id: 'cat-barra-fixa-dinamica',
    name: 'Barra Fixa Dinâmica (Masculino)',
    category: 'barra',
    executionType: 'reps',
    defaultTargetReps: 8,
    defaultWorkDurationSeconds: 60,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Queixo acima da barra na subida, extensão total na descida',
    isDefault: true
  },
  {
    id: 'cat-isometria-barra',
    name: 'Isometria na Barra (Feminino)',
    category: 'isometria',
    executionType: 'time',
    defaultWorkDurationSeconds: 30,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Queixo mantido acima da barra sem apoiar',
    isDefault: true
  },
  {
    id: 'cat-abdominal-remador',
    name: 'Abdominal Remador (1 Minuto)',
    category: 'abdominal',
    executionType: 'reps',
    defaultTargetReps: 35,
    defaultWorkDurationSeconds: 60,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Abraçar os joelhos na flexão e estender braços/pernas na descida',
    isDefault: true
  },
  {
    id: 'cat-shuttle-run',
    name: 'Corrida de Ir e Vir (Shuttle Run 9,14m)',
    category: 'perna',
    executionType: 'time',
    defaultWorkDurationSeconds: 15,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Pegar o primeiro bloco, retornar e pegar o segundo',
    isDefault: true
  },
  {
    id: 'cat-agachamento',
    name: 'Agachamento Livre',
    category: 'perna',
    executionType: 'reps',
    defaultTargetReps: 25,
    defaultWorkDurationSeconds: 60,
    defaultRestDurationSeconds: 60,
    focusNotes: 'Coluna ereta, joelhos a 90 graus',
    isDefault: true
  }
];

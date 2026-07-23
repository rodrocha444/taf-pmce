import type { Workout } from '../types';

export const DEFAULT_TAF_WORKOUT: Workout = {
  id: 'taf-pmce-default',
  title: 'Treino TAF PMCE (30 Minutos)',
  description: 'Série progressiva de condicionamento físico baseada na biblioteca de exercícios TAF PMCE com 15 séries em blocos de 2 minutos cada.',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  exercises: [
    {
      id: 'ex-1',
      catalogId: 'cat-barra-fixa-dinamica',
      name: 'Barra Fixa Dinâmica (Masculino)',
      focusNotes: 'Queixo acima da barra na subida, extensão total na descida',
      executionType: 'reps',
      targetReps: 6,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-2',
      catalogId: 'cat-abdominal-remador',
      name: 'Abdominal Remador (1 Minuto)',
      focusNotes: 'Abraçar os joelhos na flexão e estender braços/pernas na descida',
      executionType: 'reps',
      targetReps: 30,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-3',
      catalogId: 'cat-flexao-braco',
      name: 'Flexão de Braço no Solo',
      focusNotes: 'Corpo alinhado, peito rente ao solo',
      executionType: 'reps',
      targetReps: 20,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-4',
      catalogId: 'cat-agachamento',
      name: 'Agachamento Livre',
      focusNotes: 'Coluna ereta, joelhos a 90 graus',
      executionType: 'reps',
      targetReps: 30,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-5',
      catalogId: 'cat-barra-fixa-dinamica',
      name: 'Barra Fixa Dinâmica (Masculino)',
      focusNotes: 'Manter velocidade e cadência constante',
      executionType: 'reps',
      targetReps: 5,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-6',
      catalogId: 'cat-abdominal-remador',
      name: 'Abdominal Remador (1 Minuto)',
      focusNotes: 'Ritmo constante sem pausar no chão',
      executionType: 'reps',
      targetReps: 35,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-7',
      catalogId: 'cat-flexao-braco',
      name: 'Flexão de Braço no Solo',
      focusNotes: 'Tronco paralelo ao solo sem curvar a lombar',
      executionType: 'reps',
      targetReps: 15,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-8',
      catalogId: 'cat-shuttle-run',
      name: 'Corrida de Ir e Vir (Shuttle Run 9,14m)',
      focusNotes: 'Pegar o primeiro bloco, retornar e pegar o segundo',
      executionType: 'time',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-9',
      catalogId: 'cat-barra-fixa-dinamica',
      name: 'Barra Fixa Dinâmica (Masculino)',
      focusNotes: 'Manter a força na subida',
      executionType: 'reps',
      targetReps: 4,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-10',
      catalogId: 'cat-abdominal-remador',
      name: 'Abdominal Remador (1 Minuto)',
      focusNotes: 'Série 3 (Resistência máxima)',
      executionType: 'reps',
      targetReps: 30,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-11',
      catalogId: 'cat-flexao-braco',
      name: 'Flexão de Braço no Solo',
      focusNotes: 'Manter apoio firme das mãos',
      executionType: 'reps',
      targetReps: 18,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-12',
      catalogId: 'cat-agachamento',
      name: 'Agachamento Livre',
      focusNotes: 'Respirar fundo a cada repetição',
      executionType: 'reps',
      targetReps: 25,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-13',
      catalogId: 'cat-isometria-barra',
      name: 'Isometria na Barra (Feminino)',
      focusNotes: 'Queixo mantido acima da barra sem apoiar',
      executionType: 'time',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-14',
      catalogId: 'cat-abdominal-remador',
      name: 'Abdominal Remador (1 Minuto)',
      focusNotes: 'Última série de abdominais',
      executionType: 'reps',
      targetReps: 25,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    },
    {
      id: 'ex-15',
      catalogId: 'cat-flexao-braco',
      name: 'Flexão de Braço no Solo',
      focusNotes: 'Finalização de força - sustentação total',
      executionType: 'reps',
      targetReps: 15,
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120
    }
  ]
};

import type { Workout } from '../types';

export const DEFAULT_TAF_WORKOUT: Workout = {
  id: 'taf-pmce-default',
  title: 'Treino TAF PMCE (30 Minutos)',
  description: 'Série progressiva de condicionamento físico com 15 exercícios em blocos de 2 minutos cada, divididos entre 1 min de Execução e 1 min de Descanso.',
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  exercises: [
    {
      id: 'ex-1',
      name: 'Barra Fixa Pronada',
      focusNotes: 'Foco TAF - Pegada em pronação, execução com amplitude total',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'barra'
    },
    {
      id: 'ex-2',
      name: 'Abdominal Remador',
      focusNotes: 'Foco TAF - Série 1 (Extensão completa e flexão alinhada)',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'abdominal'
    },
    {
      id: 'ex-3',
      name: 'Flexão Militar no Colchonete',
      focusNotes: 'Cotovelos para trás, tronco paralelo ao solo',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'flexao'
    },
    {
      id: 'ex-4',
      name: 'Agachamento Livre',
      focusNotes: 'Postura ereta, joelhos em direção às pontas dos pés',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'perna'
    },
    {
      id: 'ex-5',
      name: 'Barra Fixa Pronada',
      focusNotes: 'Manter velocidade e cadência constante',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'barra'
    },
    {
      id: 'ex-6',
      name: 'Abdominal Supra',
      focusNotes: 'Pés apoiados no chão/colchonete - sem atrito no cóccix',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'abdominal'
    },
    {
      id: 'ex-7',
      name: 'Flexão Pike',
      focusNotes: 'Foco nos ombros e tríceps com estabilização do core',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'flexao'
    },
    {
      id: 'ex-8',
      name: 'Ponte de Glúteos no Colchonete',
      focusNotes: 'Prevenção lombar - contração dos glúteos no topo',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'isometria'
    },
    {
      id: 'ex-9',
      name: 'Barra Fixa Pronada',
      focusNotes: 'Use a band se necessário para manter as repetições',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'barra'
    },
    {
      id: 'ex-10',
      name: 'Abdominal Remador',
      focusNotes: 'Foco TAF - Série 2 (Ritmo constante)',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'abdominal'
    },
    {
      id: 'ex-11',
      name: 'Flexão Militar no Colchonete',
      focusNotes: 'Manter tronco firme, respiração controlada',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'flexao'
    },
    {
      id: 'ex-12',
      name: 'Afundo Alternado',
      focusNotes: 'Controle na descida, joelho não passa da ponta do pé',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'perna'
    },
    {
      id: 'ex-13',
      name: 'Dead Hang (Suspensão na Barra)',
      focusNotes: 'Foco na pegada, ombros encaixados para resistência',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'barra'
    },
    {
      id: 'ex-14',
      name: 'Abdominal Infra',
      focusNotes: 'Deitado, elevação de pernas com as mãos sob o quadril',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'abdominal'
    },
    {
      id: 'ex-15',
      name: 'Prancha Isométrica no Colchonete',
      focusNotes: 'Sustentação final - abdômen e glúteos bem travados',
      workDurationSeconds: 60,
      restDurationSeconds: 60,
      durationSeconds: 120,
      category: 'isometria'
    }
  ]
};

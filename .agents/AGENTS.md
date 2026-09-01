# TAF PMCE — Diretrizes do Projeto

## 1. Regras Críticas (Obrigatórias)
- **Git & Deploy**: NUNCA execute `git commit`, `git push` ou `npm run deploy` sem solicitação explícita do usuário.
- **Atomic Design Estrito**:
  - `src/components/atoms/`: Primitivos (`Button`, `Input`, `Select`, `Badge`, `Card`, `ModalBase`).
  - `src/components/molecules/`: Combinações (`ConfirmModal`, `EmptyState`, `FormField`, `StatBox`, `ProgressRing`).
  - `src/components/organisms/`: Blocos compostos (`Header`, `BottomNav`, `WorkoutCard`, `ExerciseCard`, `ExerciseCatalogCard`).
  - `src/components/pages/`: Telas da aplicação.
- **Estrutura & Barrels**: PROIBIDO criar arquivos soltos em `src/components/`. Mantenha os `index.ts` de cada camada sempre atualizados e use imports da camada (ex: `import { Button } from '../components/atoms'`).
- **Reutilização**: Sempre priorize reutilizar e compor componentes existentes antes de criar novos estilos ou elementos ad-hoc.

## 2. Stack & Padrões
- **Tech**: React 19, TypeScript, Tailwind CSS v4, Zustand, Dexie (IndexedDB), Lucide React.
- **Qualidade**: Utilize `npm run lint` (`oxlint`) e `npm run build` (`tsc -b && vite build`) para validar o código quando necessário.

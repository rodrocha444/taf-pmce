# TAF PMCE — Diretrizes do Projeto

## 1. Regras Críticas (Obrigatórias)
- **Git & Deploy**: NUNCA execute `git commit`, `git push` ou `npm run deploy` sem solicitação explícita do usuário.
- **Atomic Design Estrito**:
  - `src/components/atoms/`: Primitivos (`Button`, `Input`, `Select`, `Badge`, `Card`, `ModalBase`).
  - `src/components/molecules/`: Combinações (`ConfirmModal`, `EmptyState`, `FormField`, `StatBox`, `ProgressRing`).
  - `src/components/organisms/`: Blocos compostos (`Header`, `BottomNav`, `WorkoutCard`, `ExerciseCard`, `ExerciseCatalogCard`).
  - `src/components/pages/`: Telas da aplicação.
- **Estrutura & Barrels**: PROIBIDO criar arquivos soltos em `src/components/`. Mantenha os `index.ts` de cada camada sempre atualizados e use imports da camada (ex: `import { Button } from '../components/atoms'`).
- **Comunicação Concisa**: As respostas da IA devem ser sempre diretas, objetivas e concisas, evitando explicações desnecessárias ou prolixas.

## 2. Stack & Padrões
- **Tech**: React 19, TypeScript, Tailwind CSS v4, Zustand, Turso LibSQL / Local-First, Lucide React.
- **Qualidade**: Utilize `npm run lint` (`oxlint`) e `npm run build` (`tsc -b && vite build`) para validar o código quando necessário.

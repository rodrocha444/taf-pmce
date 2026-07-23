# Directivas e Regras do Projeto (TAF PMCE)

## Controle de Versão e GitHub
- **NÃO fazer commits ou git push automaticamente** após edições de código ou compilações.
- **Aguardar a solicitação explícita do usuário** antes de executar `git commit`, `git push` ou `npm run deploy`.

## Arquitetura de Interface (Atomic Design)
- **Seguir rigorosamente o padrão Atomic Design** para a criação e organização de componentes frontend:
  - `src/components/atoms/`: Componentes primitivos e reutilizáveis (Button, Input, Select, Badge, Card, ModalBase).
  - `src/components/molecules/`: Combinações de átomos (ConfirmModal, EmptyState, FormField, StatBox, ProgressRing).
  - `src/components/organisms/`: Blocos funcionais complexos (Header, BottomNav, WorkoutCard, ExerciseCard, ExerciseCatalogCard).
  - `src/views/`: Páginas da aplicação montadas a partir de organismos, moléculas e átomos.
- **Reutilização Obrigatória**: A IA DEVE SEMPRE priorizar a reutilização e composição dos componentes atômicos já existentes em `src/components/` antes de criar novos estilos ou elementos ad-hoc.

## Estrutura de Componentes (Regra Crítica)
- **PROIBIDO criar arquivos soltos dentro de `src/components/`**. Todo componente DEVE estar em uma das subpastas do Atomic Design:
  - `src/components/atoms/`
  - `src/components/molecules/`
  - `src/components/organisms/`
- Cada camada possui um barrel export (`index.ts`) que deve ser mantido atualizado.
- Imports de componentes devem sempre apontar para a camada correta:
  - ✅ `import { ConfirmModal } from '../components/molecules'`
  - ✅ `import { Header, BottomNav } from '../components/organisms'`
  - ✅ `import { Button, Input } from '../components/atoms'`
  - ❌ `import { ConfirmModal } from '../components/confirm-modal'` *(arquivo solto proibido)*

## Inventário Atual de Componentes

### Átomos (`src/components/atoms/`)
| Componente | Arquivo | Descrição |
|---|---|---|
| `Button` | `button.tsx` | Botão reutilizável com variantes de cor e tamanho |
| `Input` | `input.tsx` | Campo de texto estilizado |
| `Select` | `select.tsx` | Seletor dropdown |
| `Badge` | `badge.tsx` | Etiqueta informativa |
| `Card` | `card.tsx` | Container base com bordas |
| `ModalBase` | `modal-base.tsx` | Modal base com backdrop |

### Moléculas (`src/components/molecules/`)
| Componente | Arquivo | Descrição |
|---|---|---|
| `ConfirmModal` | `confirm-modal.tsx` | Modal de confirmação |
| `EmptyState` | `empty-state.tsx` | Estado de lista vazia |
| `FormField` | `form-field.tsx` | Wrapper de campos de formulário |
| `StatBox` | `stat-box.tsx` | Caixa de métricas |
| `ProgressRing` | `progress-ring.tsx` | Anel de progresso SVG |

### Organismos (`src/components/organisms/`)
| Componente | Arquivo | Descrição |
|---|---|---|
| `Header` | `header.tsx` | Cabeçalho global com botões contextuais por página |
| `BottomNav` | `bottom-nav.tsx` | Navegação inferior por abas |
| `WorkoutCard` | `workout-card.tsx` | Card de treino na lista principal |
| `ExerciseCard` | `exercise-card.tsx` | Card de exercício no player/edição |
| `ExerciseCatalogCard` | `exercise-catalog-card.tsx` | Card de exercício na biblioteca |

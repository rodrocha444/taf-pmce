# Directivas e Regras do Projeto (TAF PMCE)

## Controle de Versão e GitHub
- **NÃO fazer commits ou git push automaticamente** após edições de código ou compilações.
- **Aguardar a solicitação explícita do usuário** antes de executar `git commit`, `git push` ou `npm run deploy`.

## Arquitetura de Interface (Atomic Design)
- **Seguir rigorosamente o padrão Atomic Design** para a criação e organização de componentes frontend:
  - `src/components/atoms/`: Componentes primitivos e reutilizáveis (Botões, Inputs, Selects, Badges, Cards base, Modais base).
  - `src/components/molecules/`: Combinações de átomos (FormFields, EmptyStates, StatBoxes, ConfirmModals).
  - `src/components/organisms/`: Blocos funcionais complexos (Header, BottomNav, WorkoutCard, ExerciseCard, ExerciseCatalogCard).
  - `src/views/`: Páginas da aplicação montadas a partir de organismos, moléculas e átomos.
- **Reutilização Obrigatória**: A IA DEVE SEMPRE priorizar a reutilização e composição dos componentes atômicos já existentes em `src/components/` antes de criar novos estilos ou elementos ad-hoc.


# TAF PMCE — Preparatório Físico

Aplicativo moderno e offline-first para preparação e controle de treinos para o TAF (Teste de Aptidão Física) da PMCE.

## 🚀 Tecnologias

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Turso Database (LibSQL / SQLite distribuído)**
- **Drizzle ORM** (Type-safe query builder e migrations)
- **TanStack Query (React Query v5)** (Gerenciamento de cache, mutações e sincronização)
- **Zustand** (Estado local de cronômetro e sessão ativa)
- **Lucide React** (Ícones)
- **Vite PWA** (Suporte a Progressive Web App offline)

## ⚙️ Configuração do Banco de Dados (Turso)

1. Crie um banco de dados no [Turso](https://turso.tech/):
   ```bash
   turso db create taf-pmce
   turso db tokens create taf-pmce
   turso db show taf-pmce --url
   ```

2. Crie um arquivo `.env` na raiz do projeto com as credenciais:
   ```env
   VITE_TURSO_DATABASE_URL=libsql://taf-pmce-seu-usuario.turso.io
   VITE_TURSO_AUTH_TOKEN=seu-token-aqui
   ```

3. Execute o schema inicial no seu banco Turso:
   ```bash
   turso db shell taf-pmce < turso-schema.sql
   ```
   *Ou utilize o Drizzle Kit:*
   ```bash
   npx drizzle-kit push
   ```

## 🛠️ Scripts Disponíveis

- `npm run dev`: Inicia o servidor de desenvolvimento na porta 5555.
- `npm run build`: Valida os tipos TypeScript e gera o build de produção (`dist`).
- `npm run lint`: Executa o linter com Oxlint.
- `npm run preview`: Visualiza o build de produção localmente.

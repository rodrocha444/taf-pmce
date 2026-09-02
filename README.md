# TAF PMCE — Preparatório Físico

Aplicativo moderno e offline-first para preparação e controle de treinos para o TAF (Teste de Aptidão Física) da PMCE.

---

## 🚀 Executando em Desenvolvimento

### Opção 1: Via Docker (Recomendado)

1. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   *(Preencha as variáveis de ambiente no `.env` caso necessário)*

2. **Subir os containers:**
   ```bash
   npm run docker:dev
   # ou diretamente:
   docker compose up --build
   ```

3. **Acessar a aplicação:**
   Abra no navegador em [http://localhost:5555](http://localhost:5555).

4. **Encerrar os containers:**
   ```bash
   npm run docker:down
   # ou
   docker compose down
   ```

---

### Opção 2: Localmente via Node / NPM

1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Executar em modo dev:**
   ```bash
   npm run dev
   ```

3. **Acessar a aplicação:**
   Abra em [http://localhost:5555](http://localhost:5555).

---

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
- `npm run docker:dev`: Sobe o ambiente completo via Docker Compose.
- `npm run docker:down`: Encerra os containers do Docker.
- `npm run db:push`: Executa o script de inicialização e seed no banco de dados.
- `npm run db:generate`: Gera as migrações do Drizzle ORM.

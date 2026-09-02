# TAF PMCE - Auxiliar de Treino

Aplicativo PWA para cronometragem e auxílio de treino TAF PMCE (30 Minutos) com suporte a offline, Supabase e TanStack Query.

---

## 🚀 Executando em Desenvolvimento

### Opção 1: Via Docker (Recomendado)

1. **Configurar variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   *(Preencha as variáveis do Supabase no `.env` caso necessário)*

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

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

// Carrega .env manualmente
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...rest] = trimmed.split('=');
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
}

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url) {
  console.error('VITE_TURSO_DATABASE_URL não configurado.');
  process.exit(1);
}

const client = createClient({
  url: url.replace('turso://', 'libsql://'),
  authToken,
});

async function main() {
  console.log('Conectando ao Turso em:', url);
  const rawSql = fs.readFileSync(path.resolve(process.cwd(), 'turso-schema.sql'), 'utf8');

  // Remove linhas de comentário e divide por ponto e vírgula
  const cleanedSql = rawSql
    .split('\n')
    .map(line => {
      const idx = line.indexOf('--');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');

  const statements = cleanedSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  console.log(`Encontrados ${statements.length} comandos SQL para executar.`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`Executando [${i + 1}/${statements.length}]:`, statement.substring(0, 50).replace(/\s+/g, ' ') + '...');
    await client.execute(statement);
  }

  console.log('✅ Todas as tabelas foram criadas/verificadas com sucesso no Turso!');
}

main().catch(err => {
  console.error('Erro ao executar migration:', err);
  process.exit(1);
});

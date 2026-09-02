import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql/web';
import * as schema from './schema';

const rawUrl = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

// Normaliza o protocolo se fornecido como turso://
const normalizedUrl = rawUrl.startsWith('turso://')
  ? rawUrl.replace('turso://', 'libsql://')
  : rawUrl;

if (!normalizedUrl) {
  console.warn('[Turso] VITE_TURSO_DATABASE_URL não foi informada nas variáveis de ambiente.');
}

export const tursoClient = createClient({
  url: normalizedUrl || 'http://127.0.0.1:8080',
  authToken: authToken || undefined,
});

export const db = drizzle(tursoClient, { schema });
export * from './schema';

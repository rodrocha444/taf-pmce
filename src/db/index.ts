import { createClient } from '@libsql/client/web';
import { drizzle } from 'drizzle-orm/libsql/web';
import * as schema from './schema';

const rawUrl = import.meta.env.VITE_TURSO_DATABASE_URL || '';
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN || '';

// Normaliza o protocolo se fornecido como turso://
const normalizedUrl = rawUrl.startsWith('turso://')
  ? rawUrl.replace('turso://', 'libsql://')
  : rawUrl;

export const isTursoConfigured = Boolean(
  normalizedUrl &&
  !normalizedUrl.includes('seu-banco') &&
  !normalizedUrl.includes('127.0.0.1:8080') &&
  (normalizedUrl.startsWith('libsql://') || normalizedUrl.startsWith('https://') || normalizedUrl.startsWith('http://'))
);

if (!isTursoConfigured) {
  console.info('[TAF PMCE DB] Modo Local (Offline/LocalStorage) ativado.');
}

export const tursoClient = isTursoConfigured
  ? createClient({
      url: normalizedUrl,
      authToken: authToken || undefined,
    })
  : null;

export const db = tursoClient ? drizzle(tursoClient, { schema }) : null;
export * from './schema';


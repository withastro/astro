import type { AstroConfig } from 'astro';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { loadEnv } from 'vite';
import { createRemoteDatabaseClient as runtimeCreateRemoteDatabaseClient } from './utils-runtime.js';
 
export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export const STUDIO_ADMIN_TABLE = 'ReservedAstroStudioAdmin';
export const STUDIO_ADMIN_TABLE_ROW_ID = 'admin';

export const adminTable = sqliteTable(STUDIO_ADMIN_TABLE, {
	id: text('id').primaryKey(),
	collections: text('collections').notNull(),
});

export const STUDIO_MIGRATIONS_TABLE = 'ReservedAstroStudioMigrations';

export const migrationsTable = sqliteTable(STUDIO_MIGRATIONS_TABLE, {
	name: text('name').primaryKey(),
});

export function getAstroStudioEnv(envMode = ''): Record<`ASTRO_STUDIO_${string}`, string> {
	const env = loadEnv(envMode, process.cwd(), 'ASTRO_STUDIO_');
	return env;
}

export function getStudioUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_BASE_URL;
}

export function getRemoteDatabaseUrl(): string {
	const env = getAstroStudioEnv();
	return env.ASTRO_STUDIO_REMOTE_DB_URL;
}

export function createRemoteDatabaseClient(appToken: string) {
	return runtimeCreateRemoteDatabaseClient(appToken, getRemoteDatabaseUrl());
}

import type { InStatement } from "@libsql/client";
import type { AstroConfig } from 'astro';
import { sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { drizzle } from 'drizzle-orm/sqlite-proxy';
import { loadEnv } from 'vite';
import { z } from 'zod';


export type VitePlugin = Required<AstroConfig['vite']>['plugins'][number];

export const STUDIO_ADMIN_TABLE = 'ReservedAstroStudioAdmin';
export const STUDIO_ADMIN_TABLE_ROW_ID = 'admin';

export const adminTable = sqliteTable(STUDIO_ADMIN_TABLE, {
	id: text('id').primaryKey(),
	collections: text('collections').notNull(),
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
	const url = new URL('./db/query/', getRemoteDatabaseUrl());

	const db = drizzle(async (sql, parameters, method) => {
		const requestBody: InStatement = { sql, args: parameters };
		// eslint-disable-next-line no-console
		console.info(JSON.stringify(requestBody));
		const res = await fetch(url, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${appToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(requestBody),
		});
		if (!res.ok) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: ${res.status} ${await res.text()}}`
			);
		}

		const queryResultSchema = z.object({
			rows: z.array(z.unknown()),
		});
		let rows: unknown[];
		try {
			const json = await res.json();
			rows = queryResultSchema.parse(json).rows;
		} catch (e) {
			throw new Error(
				`Failed to execute query.\nQuery: ${sql}\nFull error: Unexpected JSON response. ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}

		// Drizzle expects each row as an array of its values
		const rowValues: unknown[][] = [];

		for (const row of rows) {
			if (row != null && typeof row === 'object') {
				rowValues.push(Object.values(row));
			}
		}

		if (method === 'get') {
			return { rows: rowValues[0] };
		}

		return { rows: rowValues };
	});
	return db;
}

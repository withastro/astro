import { promises as fs } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createD1HttpExecutor } from '../node/d1-http.js';
import type { SqliteDriver } from './types.js';

export interface D1DriverOptions {
	/** Name of the D1 binding in the Worker's environment. */
	binding: string;
	/** Defaults to the `CLOUDFLARE_ACCOUNT_ID` environment variable. */
	accountId?: string;
	/** Defaults to the `CLOUDFLARE_D1_DATABASE_ID` environment variable. */
	databaseId?: string;
	/** An API token with D1 edit permissions. Defaults to the `CLOUDFLARE_API_TOKEN` environment variable. */
	apiToken?: string;
}

/**
 * Reads the data from a Cloudflare D1 database at runtime, and pushes it there
 * at build time through the D1 REST API. When no API credentials are configured
 * the build writes a SQL file instead, to apply with `wrangler d1 execute`.
 */
export function d1(options: D1DriverOptions): SqliteDriver {
	return {
		name: 'd1',
		runtime: {
			entrypoint: '@astrojs/sqlite/runtime/d1',
			options: { binding: options.binding },
		},
		async push({ config, logger, sync, dump }) {
			const accountId = options.accountId ?? process.env.CLOUDFLARE_ACCOUNT_ID;
			const databaseId = options.databaseId ?? process.env.CLOUDFLARE_D1_DATABASE_ID;
			const apiToken = options.apiToken ?? process.env.CLOUDFLARE_API_TOKEN;
			if (!accountId || !databaseId || !apiToken) {
				const file = new URL('astro-sqlite/d1-seed.sql', config.cacheDir);
				await fs.mkdir(new URL('./', file), { recursive: true });
				await fs.writeFile(file, `${dump().join(';\n')};\n`);
				logger.warn(
					`No Cloudflare API credentials found, so the content was not pushed to D1. Set CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_D1_DATABASE_ID and CLOUDFLARE_API_TOKEN to push automatically, or apply it yourself with:\n  npx wrangler d1 execute ${options.binding} --remote --file=${fileURLToPath(file)}`,
				);
				return;
			}
			const started = performance.now();
			const result = await sync(createD1HttpExecutor({ accountId, databaseId, apiToken }));
			const summary = Object.entries(result.collections)
				.map(([name, counts]) => `${name} (+${counts.upserted}/-${counts.deleted})`)
				.join(', ');
			logger.info(
				result.changed
					? `Pushed ${summary} to D1 in ${Math.round(performance.now() - started)}ms`
					: 'D1 is already up to date',
			);
		},
	};
}

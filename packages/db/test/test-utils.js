import { createServer } from 'node:http';
import { createClient } from '@libsql/client';
import { z } from 'zod';
import { cli } from '../dist/core/cli/index.js';
import { resolveDbConfig } from '../dist/core/load-file.js';
import { getCreateIndexQueries, getCreateTableQuery } from '../dist/core/queries.js';
import { isDbError } from '../dist/runtime/utils.js';

const singleQuerySchema = z.object({
	sql: z.string(),
	args: z.array(z.any()).or(z.record(z.string(), z.any())),
});

const querySchema = z.union([
	singleQuerySchema.or(z.array(singleQuerySchema)),
	z.object({
		requests: z.array(
			z.union([
				z.object({
					type: z.literal('execute'),
					stmt: z.object({}).passthrough(),
				}),
				z.object({
					type: z.literal('batch'),
					batch: z.object({}).passthrough(),
				}),
				z.object({
					type: z.literal('store_sql'),
					sql_id: z.number(),
					sql: z.string(),
				}),
				z.object({
					type: z.literal('close'),
				}),
			]),
		),
	}),
]);

let portIncrementer = 8030;

/**
 * @param {import('astro').AstroConfig} astroConfig
 * @param {number | undefined} port
 */
export async function setupRemoteDbServer(astroConfig) {
	const port = portIncrementer++;
	process.env.ASTRO_DB_REMOTE_URL = `http://localhost:${port}`;
	process.env.ASTRO_INTERNAL_TEST_REMOTE = true;
	const server = createRemoteDbServer().listen(port);

	const { dbConfig } = await resolveDbConfig(astroConfig);
	const setupQueries = [];
	for (const [name, table] of Object.entries(dbConfig?.tables ?? {})) {
		const createQuery = getCreateTableQuery(name, table);
		const indexQueries = getCreateIndexQueries(name, table);
		setupQueries.push(createQuery, ...indexQueries);
	}
	await fetch(`http://localhost:${port}/db/query`, {
		method: 'POST',
		body: JSON.stringify(setupQueries.map((sql) => ({ sql, args: [] }))),
		headers: {
			'Content-Type': 'application/json',
		},
	});
	await cli({
		config: astroConfig,
		flags: {
			_: [undefined, 'astro', 'db', 'execute', 'db/seed.ts'],
			remote: true,
		},
	});

	return {
		server,
		async stop() {
			delete process.env.ASTRO_DB_REMOTE_URL;
			delete process.env.ASTRO_INTERNAL_TEST_REMOTE;
			return new Promise((resolve, reject) => {
				server.close((err) => {
					if (err) {
						reject(err);
					} else {
						resolve();
					}
				});
			});
		},
	};
}

export async function initializeRemoteDb(astroConfig) {
	await cli({
		config: astroConfig,
		flags: {
			_: [undefined, 'astro', 'db', 'push'],
			remote: true,
		},
	});
	await cli({
		config: astroConfig,
		flags: {
			_: [undefined, 'astro', 'db', 'execute', 'db/seed.ts'],
			remote: true,
		},
	});
}

/**
 * Clears the environment variables related to Astro DB.
 */
export function clearEnvironment() {
	const keys = Array.from(Object.keys(process.env));
	for (const key of keys) {
		if (key.startsWith('ASTRO_DB_')) {
			delete process.env[key];
		}
	}
}

// Save the original fetch if needed
const originalFetch = fetch;

// Replace fetch with your own version
globalThis.fetch = async (url, options) => {
	console.log(url);
	// You can modify the request here

	// Optionally call the original fetch
	const response = await originalFetch(url, options);

	// Optionally modify the response here
	console.dir(await response.clone().json(), { depth: null })

	return response;
};
function createRemoteDbServer() {
	const dbClient = createClient({
		url: ':memory:',
	});
	const server = createServer((req, res) => {
		const isPipeline = req.url.startsWith('/v2/pipeline');
		if (
			!(req.url.startsWith('/db/query') || isPipeline) ||
			req.method !== 'POST' ||
			req.headers['content-type'] !== 'application/json'
		) {
			res.writeHead(404, { 'Content-Type': 'application/json' });
			res.end(
				JSON.stringify({
					success: false,
				}),
			);
			return;
		}
		const rawBody = [];
		req.on('data', (chunk) => {
			rawBody.push(chunk);
		});
		req.on('end', async () => {
			let json;
			try {
				json = JSON.parse(Buffer.concat(rawBody).toString());
			} catch {
				applyParseError(res);
				return;
			}
			// console.log(json)
			const parsed = querySchema.safeParse(json);
			if (parsed.success === false) {
				applyParseError(res);
				return;
			}
			const body = parsed.data;
			try {
				let result;
				if (isPipeline) {
					result = {
						baton: null,
						base_url: null,
						results: [],
					};
					const map = new Map();
					for (const e of body.requests) {
						if (e.type === 'execute') {
							result.results.push(await dbClient.execute(e.stmt));
						} else if (e.type === 'store_sql') {
							// Get queries first, that will be used in batch calls
							map.set(e.sql_id, e.sql);
						} else if (e.type === 'batch') {
							const stmts = e.batch.steps
								.filter(
									({ stmt }) =>
										stmt.sql !== 'BEGIN DEFERRED' &&
										stmt.sql !== 'COMMIT' &&
										stmt.sql !== 'ROLLBACK',
								)
								.map(({ stmt }) => ({
									sql: map.get(stmt.sql_id) ?? stmt.sql,
									args: stmt.args.map((_e) => _e.value),
								}));
							result.results.push(...(await dbClient.batch(stmts)));
						}
					}
				} else {
					result = Array.isArray(body) ? await dbClient.batch(body) : await dbClient.execute(body);
				}
				res.writeHead(200, { 'Content-Type': 'application/json' });
				res.end(JSON.stringify(result));
			} catch (e) {
				res.writeHead(500, { 'Content-Type': 'application/json' });
				res.statusMessage = e.message;
				res.end(
					JSON.stringify({
						success: false,
						error: {
							code: isDbError(e) ? e.code : 'SQLITE_QUERY_FAILED',
							details: e.message,
						},
					}),
				);
			}
		});
	});

	server.on('close', () => {
		dbClient.close();
	});

	return server;
}

function applyParseError(res) {
	res.writeHead(400, { 'Content-Type': 'application/json' });
	res.statusMessage = 'Invalid request body';
	res.end(
		JSON.stringify({
			// Use JSON response with `success: boolean` property
			// to match remote error responses.
			success: false,
		}),
	);
}

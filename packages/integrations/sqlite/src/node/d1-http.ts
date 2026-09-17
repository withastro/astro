import type { SqlValue } from '../runtime/types.js';
import type { SqlExecutor } from './sync.js';

export interface D1HttpOptions {
	accountId: string;
	databaseId: string;
	apiToken: string;
	fetch?: typeof globalThis.fetch;
}

interface D1QueryResponse {
	success: boolean;
	errors?: Array<{ code: number; message: string }>;
	result?: Array<{ success: boolean; results?: Array<Record<string, unknown>> }>;
}

/** D1 rejects statements above 100KB; keep requests comfortably below that. */
const MAX_REQUEST_BYTES = 90_000;

/** Talks to a D1 database through Cloudflare's REST API, for pushing data at build time. */
export function createD1HttpExecutor(options: D1HttpOptions): SqlExecutor {
	const fetchImpl = options.fetch ?? globalThis.fetch;
	const endpoint = `https://api.cloudflare.com/client/v4/accounts/${options.accountId}/d1/database/${options.databaseId}/query`;

	async function request(sql: string, params: SqlValue[] = []) {
		const response = await fetchImpl(endpoint, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${options.apiToken}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ sql, params }),
		});
		let json: D1QueryResponse | undefined;
		try {
			json = (await response.json()) as D1QueryResponse;
		} catch {
			// handled below
		}
		if (!response.ok || !json?.success) {
			const errors = json?.errors?.map((error) => `${error.code}: ${error.message}`).join('; ');
			throw new Error(
				`[@astrojs/sqlite] D1 request failed (${response.status})${errors ? `: ${errors}` : ''}`,
			);
		}
		return json.result ?? [];
	}

	return {
		async query(sql, params = []) {
			const result = await request(sql, params);
			return result[0]?.results ?? [];
		},
		async execute(statements) {
			let batch: string[] = [];
			let bytes = 0;
			const flush = async () => {
				if (batch.length === 0) return;
				await request(batch.join(';\n'));
				batch = [];
				bytes = 0;
			};
			for (const statement of statements) {
				const size = Buffer.byteLength(statement, 'utf-8');
				if (size > MAX_REQUEST_BYTES) {
					throw new Error(
						`[@astrojs/sqlite] A single entry is larger than D1's statement limit (${size} bytes): ${statement.slice(0, 80)}...`,
					);
				}
				if (bytes + size > MAX_REQUEST_BYTES) await flush();
				batch.push(statement);
				bytes += size;
			}
			await flush();
		},
	};
}

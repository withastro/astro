import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { getSecret } from 'astro:env/server';

/**
 * A collection storage driver that writes each snapshot to a JSON file in `dir`. A snapshot
 * file only exists once its writer committed it. It refuses to start unless `getSecret()`
 * returns `expectedSecret` for `secretEnv`, which needs `astro:env/server` to resolve both
 * during sync and in the built server.
 *
 * @param {{ dir: string, secretEnv: string, expectedSecret: string }} config
 * @returns {import('astro').CollectionStorageDriver}
 */
export default function createDriver({ dir, secretEnv, expectedSecret }) {
	if (getSecret(secretEnv) !== expectedSecret) {
		throw new Error(`The secret ${secretEnv} is missing`);
	}
	const fileOf = (snapshot) => join(dir, `${snapshot}.json`);
	return {
		async openWriter({ snapshot }) {
			const collections = {};
			return {
				async write(collection, entries) {
					collections[collection] = Object.fromEntries(entries.map((entry) => [entry.id, entry]));
				},
				async commit() {
					mkdirSync(dir, { recursive: true });
					writeFileSync(fileOf(snapshot), JSON.stringify(collections));
				},
			};
		},
		async openReader({ snapshot }) {
			const file = fileOf(snapshot);
			if (!existsSync(file)) throw new Error(`Snapshot ${snapshot} was never committed`);
			const collections = JSON.parse(readFileSync(file, 'utf-8'));
			const select = (entry, content) =>
				content ? entry : { id: entry.id, metadata: entry.metadata };
			return {
				async get(collection, id, { content }) {
					const entry = collections[collection]?.[id];
					return entry && select(entry, content);
				},
				async entries(collection, { content }) {
					return Object.values(collections[collection] ?? {}).map((entry) => select(entry, content));
				},
			};
		},
	};
}

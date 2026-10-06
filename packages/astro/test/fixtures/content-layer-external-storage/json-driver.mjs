import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * A content storage driver that saves collections in a JSON file. The file is read on every
 * call, so the driver returns the changes made by other drivers and by tests.
 *
 * @param {{ file: string }} config
 * @returns {import('astro').ContentStorageDriver}
 */
export default function createDriver({ file }) {
	function read() {
		return existsSync(file) ? JSON.parse(readFileSync(file, 'utf-8')) : { entries: {}, meta: {} };
	}

	function update(change) {
		const state = read();
		change(state);
		mkdirSync(dirname(file), { recursive: true });
		writeFileSync(file, JSON.stringify(state, null, '\t'));
	}

	function withContent(entry, content) {
		return entry && !content ? { id: entry.id, metadata: entry.metadata } : entry;
	}

	return {
		async hasCollection(collection) {
			return Object.keys(read().entries[collection] ?? {}).length > 0;
		},
		async get(collection, id, { content }) {
			return withContent(read().entries[collection]?.[id], content);
		},
		async keys(collection) {
			return Object.keys(read().entries[collection] ?? {});
		},
		async values(collection, { content }) {
			return Object.values(read().entries[collection] ?? {}).map((entry) =>
				withContent(entry, content),
			);
		},
		async set(collection, entry) {
			update((state) => {
				state.entries[collection] ??= {};
				state.entries[collection][entry.id] = entry;
			});
		},
		async delete(collection, id) {
			update((state) => {
				delete state.entries[collection]?.[id];
			});
		},
		async clear(collection) {
			update((state) => {
				delete state.entries[collection];
			});
		},
		async getMeta(collection, key) {
			return read().meta[collection]?.[key];
		},
		async setMeta(collection, key, value) {
			update((state) => {
				state.meta[collection] ??= {};
				state.meta[collection][key] = value;
			});
		},
		async deleteMeta(collection, key) {
			update((state) => {
				delete state.meta[collection]?.[key];
			});
		},
		async clearMeta(collection) {
			update((state) => {
				delete state.meta[collection];
			});
		},
	};
}

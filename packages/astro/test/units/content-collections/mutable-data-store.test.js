import { describe, it, before, after } from 'node:test';
import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as devalue from 'devalue';
import { MutableDataStore } from '../../../dist/content/mutable-data-store.js';

describe('MutableDataStore', () => {
	let tmpDir;

	before(async () => {
		tmpDir = await mkdtemp(path.join(tmpdir(), 'astro-test-'));
	});

	after(async () => {
		try {
			await rm(tmpDir, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	it('reproduces race condition: concurrent writeToDisk() calls lose data', async () => {
		const filePath = pathToFileURL(path.join(tmpDir, 'data-store.json'));
		const store = await MutableDataStore.fromFile(filePath);

		store.set('c', 'key1', { id: 'key1', data: {} });
		const p1 = store.writeToDisk();

		store.set('c', 'key2', { id: 'key2', data: {} });
		const p2 = store.writeToDisk();

		await Promise.all([p1, p2]);

		const raw = await fs.readFile(filePath, 'utf-8');
		const collections = devalue.parse(raw);
		const collection = collections.get('c');

		assert.ok(collection.has('key1'), 'key1 should be present in the written file');
		assert.ok(
			collection.has('key2'),
			'key2 should be present in the written file (this will FAIL before the fix)',
		);
	});
});

import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import {
	createContentCollectionStorage,
	createContentReader,
	createContentWriter,
} from '../../dist/index.js';
import createReader from '../../dist/reader.js';

describe('SQLite content storage', () => {
	let directory: string;
	let url: string;

	before(async () => {
		directory = await mkdtemp(join(tmpdir(), 'astro-content-sqlite-'));
		url = `file:${join(directory, 'content.db')}`;
	});

	after(async () => {
		await rm(directory, { recursive: true, force: true });
	});

	it('replaces and queries content collection data', async () => {
		const writer = createContentWriter({ url });
		const reader = createContentReader({ url });

		await writer.write(
			new Map([
				[
					'posts',
					new Map([
						['beta', { id: 'beta', data: { title: 'Beta' } }],
						['alpha', { id: 'alpha', data: { title: 'Alpha' } }],
					]),
				],
				['empty', new Map()],
			]),
		);

		assert.equal(await reader.hasCollection('empty'), true);
		assert.deepEqual(await reader.get('posts', 'beta'), {
			id: 'beta',
			data: { title: 'Beta' },
		});
		assert.deepEqual(
			(await reader.values('posts')).map((entry) => entry.id),
			['alpha', 'beta'],
		);

		await writer.write(new Map([['posts', new Map([['next', { id: 'next', data: {} }]])]]));
		assert.equal(await reader.get('posts', 'alpha'), undefined);
		assert.deepEqual(await reader.get('posts', 'next'), { id: 'next', data: {} });
	});

	it('validates adapter configuration', () => {
		assert.throws(() => createReader(undefined), /expected object/);
		assert.throws(() => createReader({ url: '' }), /requires a database URL/);
	});

	it('creates adapter storage providers', () => {
		const storage = createContentCollectionStorage({ url });

		assert.equal(
			storage.reader.entrypoint.toString(),
			new URL('../../dist/reader.js', import.meta.url).toString(),
		);
		assert.equal(
			storage.writer.entrypoint.toString(),
			new URL('../../dist/writer.js', import.meta.url).toString(),
		);
		assert.deepEqual(storage.reader.config, { url });
		assert.deepEqual(storage.writer.config, { url });
	});
});

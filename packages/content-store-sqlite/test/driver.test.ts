import assert from 'node:assert/strict';
import { mkdtempSync, truncateSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createClient } from '@libsql/client';
import type { ContentStorageDriver } from 'astro';
import createDriver from '../dist/driver.js';
import { createContentCollectionStorage } from '../dist/index.js';

/** Returns the path of a database file in a new directory */
function createDatabaseFile() {
	return join(mkdtempSync(join(tmpdir(), 'astro-content-store-sqlite-')), 'content.db');
}

/** Returns the URL of a new database file */
function createDatabaseUrl() {
	return `file:${createDatabaseFile()}`;
}

async function readValues(driver: ContentStorageDriver, collection: string, content = true) {
	const entries = [];
	for await (const entry of await driver.values(collection, { content })) {
		entries.push(entry);
	}
	return entries;
}

const hello = { id: 'hello', metadata: '[{"title":1},"Hello"]', content: '[{"body":1},"# Hello"]' };
const data = { id: 'data', metadata: '[{"count":1},2]' };

describe('SQLite content storage driver', () => {
	it('reads an empty database', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });

		assert.equal(await driver.hasCollection('posts'), false);
		assert.equal(await driver.get('posts', 'hello', { content: true }), undefined);
		assert.deepEqual(await driver.keys('posts'), []);
		assert.deepEqual(await readValues(driver, 'posts'), []);
		assert.equal(await driver.getMeta('posts', 'cursor'), undefined);
		await driver.close?.();
	});

	it('saves and reads entries, with or without their content', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });
		await driver.set('posts', hello);
		await driver.set('posts', data);

		assert.equal(await driver.hasCollection('posts'), true);
		assert.deepEqual(await driver.get('posts', 'hello', { content: true }), hello);
		assert.deepEqual(await driver.get('posts', 'hello', { content: false }), {
			id: 'hello',
			metadata: hello.metadata,
		});
		assert.deepEqual(await driver.get('posts', 'data', { content: true }), data);
		assert.deepEqual((await driver.keys('posts')).sort(), ['data', 'hello']);
		assert.deepEqual(await readValues(driver, 'posts'), [data, hello]);
		assert.deepEqual(await readValues(driver, 'posts', false), [
			data,
			{ id: 'hello', metadata: hello.metadata },
		]);
		await driver.close?.();
	});

	it('replaces entries and keeps collections apart', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });
		await driver.set('posts', hello);
		await driver.set('posts', { id: 'hello', metadata: '[{"title":1},"Hi"]' });
		await driver.set('drafts', hello);

		assert.deepEqual(await driver.get('posts', 'hello', { content: true }), {
			id: 'hello',
			metadata: '[{"title":1},"Hi"]',
		});
		assert.deepEqual(await driver.get('drafts', 'hello', { content: true }), hello);
		await driver.close?.();
	});

	it('reads all the entries of a collection larger than a page', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });
		const ids = Array.from({ length: 1201 }, (_, i) => `entry-${String(i).padStart(4, '0')}`);
		for (const id of ids) {
			await driver.set('posts', { id, metadata: '[{}]' });
		}

		const values = await readValues(driver, 'posts', false);

		assert.deepEqual(
			values.map((entry) => entry.id),
			ids,
		);
		await driver.close?.();
	});

	it('removes entries, and keeps meta values when a collection is cleared', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });
		await driver.set('posts', hello);
		await driver.set('posts', data);
		await driver.setMeta('posts', 'cursor', '1');

		await driver.delete('posts', 'hello');
		await driver.delete('posts', 'missing');
		assert.deepEqual(await driver.keys('posts'), ['data']);

		await driver.clear('posts');
		assert.equal(await driver.hasCollection('posts'), false);
		assert.equal(await driver.getMeta('posts', 'cursor'), '1');
		await driver.close?.();
	});

	it('saves, replaces and removes meta values', async () => {
		const driver = await createDriver({ url: createDatabaseUrl() });
		await driver.setMeta('posts', 'cursor', '1');
		await driver.setMeta('posts', 'cursor', '2');
		await driver.setMeta('posts', 'token', 'abc');
		await driver.setMeta('drafts', 'cursor', '9');
		assert.equal(await driver.getMeta('posts', 'cursor'), '2');

		await driver.deleteMeta('posts', 'token');
		assert.equal(await driver.getMeta('posts', 'token'), undefined);

		await driver.clearMeta('posts');
		assert.equal(await driver.getMeta('posts', 'cursor'), undefined);
		assert.equal(await driver.getMeta('drafts', 'cursor'), '9');
		await driver.close?.();
	});

	it('reads the writes of another driver for the same database', async () => {
		const url = createDatabaseUrl();
		const writer = await createDriver({ url });
		const reader = await createDriver({ url });
		assert.equal(await reader.hasCollection('posts'), false);

		await writer.set('posts', hello);
		await writer.setMeta('posts', 'cursor', '1');

		assert.deepEqual(await reader.get('posts', 'hello', { content: true }), hello);
		assert.equal(await reader.getMeta('posts', 'cursor'), '1');
		await writer.close?.();
		await reader.close?.();
	});

	it('throws when it cannot create its tables, and tries again on the next call', async () => {
		const file = createDatabaseFile();
		writeFileSync(file, 'not a database'.repeat(100));
		const driver = await createDriver({ url: `file:${file}` });

		await assert.rejects(driver.keys('posts'), (error: Error) => {
			assert.match(
				error.message,
				/^The SQLite content storage driver could not create its tables.*file is not a database/,
			);
			assert.ok(error.cause);
			return true;
		});

		truncateSync(file, 0);
		assert.deepEqual(await driver.keys('posts'), []);
		await driver.close?.();
	});

	it('throws when it cannot connect to the database', () => {
		const file = join(createDatabaseFile(), 'missing', 'content.db');

		assert.throws(
			() => createDriver({ url: `file:${file}` }),
			(error: Error) => {
				assert.match(error.message, /^The SQLite content storage driver could not connect/);
				assert.ok(error.cause);
				return true;
			},
		);
	});

	it('throws an error that names the failed operation when a query fails', async () => {
		const url = createDatabaseUrl();
		const driver = await createDriver({ url });
		await driver.keys('posts');
		const client = createClient({ url });
		await client.batch(['DROP TABLE astro_content_entries', 'DROP TABLE astro_content_meta']);
		client.close();

		const failures: Array<[() => Promise<unknown>, string]> = [
			[() => driver.hasCollection('posts'), 'check if the collection "posts" has entries'],
			[() => driver.get('posts', 'a', { content: true }), 'read the entry "a" of the collection'],
			[() => driver.keys('posts'), 'read the entry IDs of the collection "posts"'],
			[() => readValues(driver, 'posts'), 'read the entries of the collection "posts"'],
			[() => driver.set('posts', hello), 'save the entry "hello" of the collection "posts"'],
			[() => driver.delete('posts', 'a'), 'delete the entry "a" of the collection "posts"'],
			[() => driver.clear('posts'), 'delete the entries of the collection "posts"'],
			[() => driver.getMeta('posts', 'a'), 'read the meta value "a" of the collection "posts"'],
			[() => driver.setMeta('posts', 'a', '1'), 'save the meta value "a" of the collection'],
			[() => driver.deleteMeta('posts', 'a'), 'delete the meta value "a" of the collection'],
			[() => driver.clearMeta('posts'), 'delete the meta values of the collection "posts"'],
		];
		for (const [run, operation] of failures) {
			await assert.rejects(run(), (error: Error) => {
				assert.ok(error.message.includes(`could not ${operation}`), error.message);
				assert.match(error.message, /no such table/);
				assert.ok(error.cause);
				return true;
			});
		}
		await driver.close?.();
	});

	it('throws when the config has no database URL', () => {
		assert.throws(() => createDriver(undefined), /needs the URL of a database/);
		assert.throws(() => createDriver({ url: '' }), /needs the URL of a database/);
		assert.throws(() => createDriver({ url: 'file:a.db', token: 1 }), /must be a string/);
	});
});

describe('createContentCollectionStorage()', () => {
	it('returns the driver entrypoint and its config', () => {
		assert.deepEqual(createContentCollectionStorage({ url: 'file:content.db' }), {
			entrypoint: new URL('../dist/driver.js', import.meta.url),
			config: { url: 'file:content.db' },
		});
		assert.deepEqual(
			createContentCollectionStorage({ url: 'libsql://db.example.com', token: 'secret' }).config,
			{ url: 'libsql://db.example.com', token: 'secret' },
		);
	});

	it('throws when the database URL is missing', () => {
		assert.throws(() => createContentCollectionStorage({ url: '' }), /needs the URL of a database/);
	});
});

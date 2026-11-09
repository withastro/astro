import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { createClient } from '@libsql/client';
import { createStorageDriverTests } from 'astro/content/storage-driver-tests';
import { createSqliteDriver } from '../dist/create-driver.js';
import { sqlite } from '../dist/index.js';

// `dist/driver.js` imports `astro:env/server`, which only resolves when Astro loads it through Vite
const createDriver = (config: unknown) =>
	createSqliteDriver(createClient, config, (name) => process.env[name]);

function createTestDriver() {
	const dir = mkdtempSync(join(tmpdir(), 'collection-storage-sqlite-'));
	return createDriver({ url: `file:${join(dir, 'collections.db')}` });
}

describe('sqlite()', () => {
	it('returns a storage descriptor for the driver', () => {
		assert.deepEqual(sqlite({ url: 'libsql://example.turso.io', authTokenEnv: 'TOKEN' }), {
			entrypoint: new URL('../dist/driver.js', import.meta.url),
			config: { url: 'libsql://example.turso.io', authTokenEnv: 'TOKEN' },
		});
	});
});

describe('SQLite collection storage driver', () => {
	it('reads the auth token with getSecret', () => {
		let authToken: string | undefined;
		createSqliteDriver(
			(config) => {
				authToken = config.authToken;
				return createClient({ url: 'file::memory:' });
			},
			{ url: 'libsql://example.turso.io', authTokenEnv: 'DOCS_TOKEN' },
			(name) => (name === 'DOCS_TOKEN' ? 'secret' : undefined),
		);
		assert.equal(authToken, 'secret');
	});

	for (const test of createStorageDriverTests(createTestDriver)) {
		it(test.name, test.run);
	}

	it('refuses to open a snapshot before it is committed', async () => {
		const driver = await createTestDriver();
		const writer = await driver.openWriter({ snapshot: 'build-1', dev: false });

		await assert.rejects(driver.openReader({ snapshot: 'build-1' }), /never committed/);
		await writer.commit();
		await driver.openReader({ snapshot: 'build-1' });
	});

	it('throws without a database URL', () => {
		assert.throws(() => createDriver({}), /needs the URL of a database/);
		assert.throws(() => createDriver(undefined), /needs the URL of a database/);
	});
});

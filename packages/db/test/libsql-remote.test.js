import assert from 'node:assert/strict';
import { rm } from 'node:fs/promises';
import { relative } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';
import { clearEnvironment, initializeRemoteDb } from './test-utils.js';

describe('astro:db local database', () => {
	describe('build --remote with local libSQL file (absolute path)', () => {
		let fixture;
		before(async () => {
			clearEnvironment();

			const absoluteFileUrl = new URL('./fixtures/libsql-remote/temp/absolute.db', import.meta.url);
			// Remove the file if it exists to avoid conflict between test runs
			await rm(absoluteFileUrl, { force: true });

			process.env.ASTRO_INTERNAL_TEST_REMOTE = true;
			process.env.ASTRO_DB_REMOTE_URL = absoluteFileUrl.toString();

			const root = new URL('./fixtures/libsql-remote/', import.meta.url);
			fixture = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/absolute/', root)),
				output: 'server',
				adapter: testAdapter(),
			});

			await fixture.build();
			await initializeRemoteDb(fixture.config);
		});

		after(async () => {
			delete process.env.ASTRO_INTERNAL_TEST_REMOTE;
			delete process.env.ASTRO_DB_REMOTE_URL;
		});

		it('Can render page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('build --remote with local libSQL file (relative path)', () => {
		let fixture;
		before(async () => {
			clearEnvironment();

			const absoluteFileUrl = new URL('./fixtures/libsql-remote/temp/relative.db', import.meta.url);
			const prodDbPath = relative(process.cwd(), fileURLToPath(absoluteFileUrl));

			// Remove the file if it exists to avoid conflict between test runs
			await rm(prodDbPath, { force: true });

			process.env.ASTRO_INTERNAL_TEST_REMOTE = true;
			process.env.ASTRO_DB_REMOTE_URL = `file:${prodDbPath}`;

			const root = new URL('./fixtures/libsql-remote/', import.meta.url);
			fixture = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/relative/', root)),
				output: 'server',
				adapter: testAdapter(),
			});

			await fixture.build();
			await initializeRemoteDb(fixture.config);
		});

		after(async () => {
			delete process.env.ASTRO_INTERNAL_TEST_REMOTE;
			delete process.env.ASTRO_DB_REMOTE_URL;
		});

		it('Can render page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});
});

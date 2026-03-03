import assert from 'node:assert/strict';
import { relative } from 'node:path';
import { after, before, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import testAdapter from '../../astro/test/test-adapter.js';
import { loadFixture } from '../../astro/test/test-utils.js';

describe('astro:db local database', () => {
	describe('build (not remote) with DATABASE_FILE env (file URL)', () => {
		let fixture;
		const prodDbPath = new URL('./fixtures/basics/dist/astro.db', import.meta.url).toString();
		before(async () => {
			process.env.ASTRO_DATABASE_FILE = prodDbPath;
			const root = new URL('./fixtures/local-prod/', import.meta.url);
			fixture = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/file-url/', root)),
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		after(async () => {
			delete process.env.ASTRO_DATABASE_FILE;
		});

		it('Can render page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('build (not remote) with DATABASE_FILE env (relative file path)', () => {
		let fixture;
		const absoluteFileUrl = new URL('./fixtures/basics/dist/astro.db', import.meta.url);
		const prodDbPath = relative(process.cwd(), fileURLToPath(absoluteFileUrl));

		before(async () => {
			process.env.ASTRO_DATABASE_FILE = prodDbPath;
			const root = new URL('./fixtures/local-prod/', import.meta.url);
			fixture = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/relative/', root)),
				output: 'server',
				adapter: testAdapter(),
			});
			await fixture.build();
		});

		after(async () => {
			delete process.env.ASTRO_DATABASE_FILE;
		});

		it('Can render page', async () => {
			const app = await fixture.loadTestAdapterApp();
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('build (not remote)', () => {
		it('should throw during the build for server output', async () => {
			delete process.env.ASTRO_DATABASE_FILE;
			const root = new URL('./fixtures/local-prod/', import.meta.url);
			const fixture = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/not-remote/', root)),
				output: 'server',
				adapter: testAdapter(),
			});
			let buildError = null;
			try {
				await fixture.build();
			} catch (err) {
				buildError = err;
			}

			assert.equal(buildError instanceof Error, true);
		});

		it('should throw during the build for hybrid output', async () => {
			let root = new URL('./fixtures/local-prod/', import.meta.url);
			const fixture2 = await loadFixture({
				root,
				outDir: fileURLToPath(new URL('./dist/hybrid-output/', root)),
				output: 'static',
				adapter: testAdapter(),
			});

			delete process.env.ASTRO_DATABASE_FILE;
			let buildError = null;
			try {
				await fixture2.build();
			} catch (err) {
				buildError = err;
			}

			assert.equal(buildError instanceof Error, true);
		});
	});
});

import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import cloudflare from '../dist/index.js';
import { loadFixture } from './_test-utils.js';

describe('.assetsignore generation', () => {
	describe('with base path', () => {
		/** @type {import('../../../astro/test/test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/with-base/', import.meta.url).toString(),
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('creates .assetsignore file with _worker.js entry', async () => {
			const assetsIgnore = await fixture.readFile('/.assetsignore');
			assert.ok(assetsIgnore.includes('_worker.js'), '.assetsignore should contain _worker.js');
		});
	});

	describe('without base path', () => {
		/** @type {import('../../../astro/test/test-utils').Fixture} */
		let fixture;

		before(async () => {
			fixture = await loadFixture({
				root: new URL('./fixtures/routes-json/', import.meta.url).toString(),
				srcDir: './src/mixed',
				adapter: cloudflare({}),
			});
			await fixture.build();
		});

		it('does not create .assetsignore file', async () => {
			try {
				await fixture.readFile('/.assetsignore');
				assert.fail('.assetsignore file should not exist');
			} catch (error) {
				// Expected: file should not exist
				assert.ok(error.message.includes('ENOENT') || error.code === 'ENOENT');
			}
		});
	});
});

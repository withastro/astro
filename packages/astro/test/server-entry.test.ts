import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';
import testAdapter, { selfTestAdapter } from './test-adapter.ts';
import { type App, type Fixture, loadFixture } from './test-utils.ts';

type FakeAdapter = (
	options:
		| { type: 'rollupInput'; shape: 'string' | 'object' | 'array' }
		| { type: 'serverEntrypoint' },
) => AstroIntegration;

const fakeAdapter: FakeAdapter = await (async () => {
	const importPath: string = './fixtures/server-entry/fake-adapter/index.js';
	const mod = await import(importPath);
	return mod.default;
})();

describe('Server entry', () => {
	describe('legacy entrypoint', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-entry',
				output: 'server',
				adapter: testAdapter(),
				build: {
					serverEntry: 'custom.mjs',
				},
			});
			await fixture.build();
			app = await fixture.loadTestAdapterApp(false);
		});

		it('should load the custom entry and render', async () => {
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	describe('self entrypoint', () => {
		let fixture: Fixture;
		let app: App;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-entry',
				output: 'server',
				adapter: selfTestAdapter(),
				build: {
					serverEntry: 'custom.mjs',
				},
			});
			await fixture.build();
			app = await fixture.loadSelfAdapterApp(false);
		});

		it('should load the custom entry and render', async () => {
			const request = new Request('http://example.com/');
			const response = await app.render(request);
			assert.equal(response.status, 200);
		});
	});

	for (const shape of ['string', 'object', 'array'] as const) {
		describe(`rollupInput entrypoint (${shape})`, () => {
			let fixture: Fixture;

			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/server-entry',
					output: 'server',
					adapter: fakeAdapter({ type: 'rollupInput', shape }),
					build: {
						serverEntry: 'custom.mjs',
					},
				});
				await fixture.build();
			});

			it('should produce custom.mjs', async () => {
				assert.ok(
					existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))),
				);
			});
		});
	}

	describe('serverEntrypoint', () => {
		let fixture: Fixture;

		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/server-entry',
				output: 'server',
				adapter: fakeAdapter({ type: 'serverEntrypoint' }),
				build: {
					serverEntry: 'custom.mjs',
				},
			});
			await fixture.build();
		});

		it('should produce custom.mjs via serverEntrypoint', async () => {
			assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
		});
	});
});

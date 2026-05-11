import { describe, it } from 'node:test';
import { type App, type Fixture, loadFixture } from './test-utils.ts';
import testAdapter, { selfTestAdapter } from './test-adapter.ts';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { AstroIntegration } from 'astro';

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
	let fixture: Fixture;
	let app: App;

	it('should load the custom entry when using legacy entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: testAdapter(),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/server-entry-server-entry/',
		});

		await fixture.build();
		app = await fixture.loadTestAdapterApp(false);

		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('should load the custom entry when using self entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: selfTestAdapter(),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/erver-entry-server-entry/',
		});

		await fixture.build();
		app = await fixture.loadSelfAdapterApp(false);

		const request = new Request('http://example.com/');
		const response = await app.render(request);
		assert.equal(response.status, 200);
	});

	it('should load the custom entry when using package export (string) as rollup self entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: fakeAdapter({ type: 'rollupInput', shape: 'string' }),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/server-entry-server-entry/',
		});

		await fixture.build();

		assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
	});

	it('should load the custom entry when using package export (object) as rollup self entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: fakeAdapter({ type: 'rollupInput', shape: 'object' }),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/server-entry-server-entry/',
		});

		await fixture.build();

		assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
	});

	it('should load the custom entry when using package export (array) as rollup self entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: fakeAdapter({ type: 'rollupInput', shape: 'array' }),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/server-entry-server-entry/',
		});

		await fixture.build();

		assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
	});

	it('should load the custom entry when using serverEntrypoint with entryType: self', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: fakeAdapter({ type: 'serverEntrypoint' }),
			build: {
				serverEntry: 'custom.mjs',
			},
			outDir: './dist/server-entry-server-entry/',
		});

		await fixture.build();

		assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
	});
});

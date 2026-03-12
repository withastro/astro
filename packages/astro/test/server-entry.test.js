// @ts-check

import { describe, it } from 'node:test';
import { loadFixture } from './test-utils.js';
import testAdapter, { selfTestAdapter } from './test-adapter.js';
import assert from 'node:assert/strict';
import fakeAdapter from './fixtures/server-entry/fake-adapter/index.js';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

describe('Server entry', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let app;

	it('should load the custom entry when using legacy entrypoint', async () => {
		fixture = await loadFixture({
			root: './fixtures/server-entry',
			output: 'server',
			adapter: testAdapter(),
			build: {
				serverEntry: 'custom.mjs',
			},
		});

		await fixture.build({});
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
		});

		await fixture.build({});
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
		});

		await fixture.build({});

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
		});

		await fixture.build({});

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
		});

		await fixture.build({});

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
		});

		await fixture.build({});

		assert.ok(existsSync(fileURLToPath(new URL('server/custom.mjs', fixture.config.outDir))));
	});
});

import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture, getVercelConfig } from './test-utils.ts';

describe('Server Islands', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-islands/',
		});
		await fixture.build({});
	});

	it('server islands route is in the config', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);
		let found = null;
		for (const route of config.routes) {
			if (route.src?.includes('_server-islands')) {
				found = route;
				break;
			}
		}
		assert.notEqual(found, null, 'Default server islands route included');
	});
});

describe('Server Islands (static output)', () => {
	let fixture: Fixture;
	let renderFunction: { default: { fetch(request: Request): Promise<Response> } };

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-islands-static/',
		});
		await fixture.build({});

		const functionConfig = JSON.parse(
			await fixture.readFile('../.vercel/output/functions/_render.func/.vc-config.json'),
		);
		const functionEntry = new URL(
			`../.vercel/output/functions/_render.func/${functionConfig.handler}`,
			fixture.config.outDir,
		);
		renderFunction = await import(functionEntry.href);
	});

	it('creates _render.func for server islands in static builds', { timeout: 30000 }, async () => {
		const renderFuncDir = new URL('.vercel/output/functions/_render.func/', fixture.config.root);
		assert.ok(existsSync(renderFuncDir), '_render.func directory should exist');
		assert.ok(
			existsSync(new URL('.vc-config.json', renderFuncDir)),
			'.vc-config.json should exist in _render.func',
		);
	});

	it('renders the server island', { timeout: 30000 }, async () => {
		const html = await fixture.readFile('../.vercel/output/static/index.html');
		const islandUrl = /fetch\((["'])(\/_server-islands\/[^"']+)\1/.exec(html)?.[2];
		assert.ok(islandUrl, 'prerendered HTML should include the server island URL');

		const response = await renderFunction.default.fetch(
			new Request(new URL(islandUrl, 'https://example.com')),
		);
		assert.equal(response.status, 200);
		assert.match(await response.text(), /I'm an island/);
	});

	it('does not publish the server entry as a static file', () => {
		assert.equal(
			existsSync(new URL('.vercel/output/static/entry.mjs', fixture.config.root)),
			false,
		);
	});

	it('includes server islands route in config', { timeout: 30000 }, async () => {
		const config = await getVercelConfig(fixture);
		let found = null;
		for (const route of config.routes) {
			if (route.src?.includes('_server-islands')) {
				found = route;
				break;
			}
		}
		assert.ok(found, 'Server islands route should be in config');
		assert.equal(found.dest, '_render', 'Server islands route should point to _render');
	});
});

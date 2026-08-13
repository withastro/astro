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

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/server-islands-static/',
		});
		await fixture.build({});
	});

	it('creates _render.func for server islands in static builds', { timeout: 30000 }, async () => {
		const renderFuncDir = new URL('.vercel/output/functions/_render.func/', fixture.config.root);
		assert.ok(existsSync(renderFuncDir), '_render.func directory should exist');
		assert.ok(
			existsSync(new URL('.vc-config.json', renderFuncDir)),
			'.vc-config.json should exist in _render.func',
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
		assert.notEqual(found, null, 'Server islands route should be in config');
		assert.equal(found.dest, '_render', 'Server islands route should point to _render');
	});
});

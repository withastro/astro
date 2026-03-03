import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { loadFixture } from '../../../astro/test/test-utils.js';

describe('Content Layer MDX rendering dev', () => {
	/** @type {import("../../../astro/test/test-utils.js").Fixture} */
	let fixture;

	let devServer;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/content-layer/', import.meta.url),
		});
		devServer = await fixture.startDevServer();
	});

	after(async () => {
		await devServer?.stop();
	});

	it('Render an MDX file', async () => {
		const html = await fixture.fetch('/reptiles/iguana').then((r) => r.text());

		assert.match(html, /Iguana/);
		assert.match(html, /This is a rendered entry/);
	});
});

describe('Content Layer MDX rendering build', () => {
	/** @type {import("../../../astro/test/test-utils.js").Fixture} */
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/content-layer/', import.meta.url),
		});
		await fixture.build();
	});

	it('Render an MDX file', async () => {
		const html = await fixture.readFile('/reptiles/iguana/index.html');

		assert.match(html, /Iguana/);
		assert.match(html, /This is a rendered entry/);
	});
});

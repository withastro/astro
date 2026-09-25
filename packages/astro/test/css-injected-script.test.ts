import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('CSS imported from an injectScript("page") script', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-injected-script/',
		});
		await fixture.build();
	});

	it('keeps the stylesheet of a lazily imported module', async () => {
		const assets = await fixture.readdir('/_astro');
		const stylesheets = await Promise.all(
			assets.filter((f) => f.endsWith('.css')).map((f) => fixture.readFile(`/_astro/${f}`)),
		);
		assert.ok(
			stylesheets.some((css) => css.includes('.injected-widget')),
			'Expected a stylesheet with the .injected-widget rule',
		);
	});

	it('loads the stylesheet with its chunk, not up front in the page', async () => {
		const html = await fixture.readFile('/index.html');
		assert.ok(!html.includes('injected-widget'));
	});
});

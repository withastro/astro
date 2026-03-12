import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import woof from './fixtures/multiple-jsx-renderers/renderers/woof/index.mjs';
import meow from './fixtures/multiple-jsx-renderers/renderers/meow/index.mjs';
import { loadFixture } from './test-utils.js';

describe('With include option', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multiple-jsx-renderers/',
			integrations: [woof({ include: '**/*.woof.jsx' }), meow({ include: '**/*.meow.jsx' })],
		});
		await fixture.build();
	});

	describe('SSR', () => {
		it('WoofCounter rendered by woof', async () => {
			const html = await fixture.readFile('/ssr/index.html');
			const $ = cheerio.load(html);
			const woofRoot = $('#woof-root');
			assert.equal(woofRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(woofRoot.text().includes('Woof Counter'));
		});

		it('MeowCounter rendered by woof incorrectly (known limitation)', async () => {
			const html = await fixture.readFile('/ssr/index.html');
			const $ = cheerio.load(html);
			const meowRoot = $('#meow-root');

			// BUG: SSR-only components don't have metadata.componentUrl, so check()
			// can't filter by include pattern. Woof is registered first and claims
			// MeowCounter. This should be fixed so meow renders its own component.
			assert.equal(meowRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(meowRoot.text().includes('Meow Counter'));
		});
	});

	describe('client:load', () => {
		it('WoofCounter rendered by woof', async () => {
			const html = await fixture.readFile('/client-load/index.html');
			const $ = cheerio.load(html);
			const woofRoot = $('#woof-root');
			const island = woofRoot.find('astro-island');
			assert.equal(woofRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(woofRoot.text().includes('Woof Counter'));
			assert.ok(island.attr('component-url')?.includes('WoofCounter.woof'));
			assert.ok(island.attr('renderer-url')?.includes('woof-client'));
		});

		it('MeowCounter rendered by meow', async () => {
			const html = await fixture.readFile('/client-load/index.html');
			const $ = cheerio.load(html);
			const meowRoot = $('#meow-root');
			const island = meowRoot.find('astro-island');
			assert.equal(meowRoot.find('[data-renderer="meow"]').length, 1);
			assert.ok(meowRoot.text().includes('Meow Counter'));
			assert.ok(island.attr('component-url')?.includes('MeowCounter.meow'));
			assert.ok(island.attr('renderer-url')?.includes('meow-client'));
		});
	});

	describe('client:only', () => {
		it('WoofCounter uses woof renderer', async () => {
			const html = await fixture.readFile('/client-only/index.html');
			const $ = cheerio.load(html);
			const island = $('#woof-root').find('astro-island');
			assert.ok(island.attr('component-url')?.includes('WoofCounter.woof'));
			assert.ok(island.attr('renderer-url')?.includes('woof-client'));
		});

		it('MeowCounter uses meow renderer', async () => {
			const html = await fixture.readFile('/client-only/index.html');
			const $ = cheerio.load(html);
			const island = $('#meow-root').find('astro-island');
			assert.ok(island.attr('component-url')?.includes('MeowCounter.meow'));
			assert.ok(island.attr('renderer-url')?.includes('meow-client'));
		});
	});
});

describe('Without include option', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/multiple-jsx-renderers/',
			integrations: [woof(), meow()],
		});
		await fixture.build();
	});

	describe('SSR', () => {
		it('WoofCounter rendered by woof', async () => {
			const html = await fixture.readFile('/ssr/index.html');
			const $ = cheerio.load(html);
			const woofRoot = $('#woof-root');
			assert.equal(woofRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(woofRoot.text().includes('Woof Counter'));
		});

		it('MeowCounter rendered by woof incorrectly', async () => {
			const html = await fixture.readFile('/ssr/index.html');
			const $ = cheerio.load(html);
			const meowRoot = $('#meow-root');

			// Without include/exclude options, woof is registered first and claims
			// all components. It's the user's responsibility to provide include/exclude
			// options when using multiple renderers.
			assert.equal(meowRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(meowRoot.text().includes('Meow Counter'));
		});
	});

	describe('client:load', () => {
		it('WoofCounter rendered by woof', async () => {
			const html = await fixture.readFile('/client-load/index.html');
			const $ = cheerio.load(html);
			const woofRoot = $('#woof-root');
			const island = woofRoot.find('astro-island');
			assert.equal(woofRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(woofRoot.text().includes('Woof Counter'));
			assert.ok(island.attr('component-url')?.includes('WoofCounter.woof'));
			assert.ok(island.attr('renderer-url')?.includes('woof-client'));
		});

		it('MeowCounter rendered by woof incorrectly', async () => {
			const html = await fixture.readFile('/client-load/index.html');
			const $ = cheerio.load(html);
			const meowRoot = $('#meow-root');
			const island = meowRoot.find('astro-island');

			// Without include/exclude options, woof is registered first and claims
			// all components. It's the user's responsibility to provide include/exclude
			// options when using multiple renderers.
			assert.equal(meowRoot.find('[data-renderer="woof"]').length, 1);
			assert.ok(meowRoot.text().includes('Meow Counter'));
			assert.ok(island.attr('component-url')?.includes('MeowCounter.meow'));
			assert.ok(island.attr('renderer-url')?.includes('woof-client'));
		});
	});

	describe('client:only', () => {
		it('WoofCounter uses woof renderer', async () => {
			const html = await fixture.readFile('/client-only/index.html');
			const $ = cheerio.load(html);
			const island = $('#woof-root').find('astro-island');
			assert.ok(island.attr('component-url')?.includes('WoofCounter.woof'));
			assert.ok(island.attr('renderer-url')?.includes('woof-client'));
		});

		it('MeowCounter uses meow renderer', async () => {
			const html = await fixture.readFile('/client-only/index.html');
			const $ = cheerio.load(html);
			const island = $('#meow-root').find('astro-island');
			assert.ok(island.attr('component-url')?.includes('MeowCounter.meow'));
			assert.ok(island.attr('renderer-url')?.includes('meow-client'));
		});
	});
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-framework-slots.prelude.ts';

describe('Slots: Svelte', () => {
	it('Renders default slot', async () => {
		const html = await fixture.readFile('/svelte/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#default-self-closing').text().trim(), 'Fallback');
		assert.equal($('#default-empty').text().trim(), 'Fallback');
		assert.equal($('#zero').text().trim(), '0');
		assert.equal($('#false').text().trim(), '');
		assert.equal($('#string').text().trim(), '');
		assert.equal($('#content').text().trim(), 'Hello world!');
	});

	it('Renders named slot', async () => {
		const html = await fixture.readFile('/svelte/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#named').text().trim(), 'Fallback / Named');
	});

	it('Preserves dash-case slot', async () => {
		const html = await fixture.readFile('/svelte/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#dash-case').text().trim(), 'Fallback / Dash Case');
	});

	describe('For MDX Pages', () => {
		it('Renders default slot', async () => {
			const html = await fixture.readFile('/svelte/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#content').text().trim(), 'Hello world!');
		});

		it('Renders named slot', async () => {
			const html = await fixture.readFile('/svelte/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#named').text().trim(), 'Fallback / Named');
		});

		it('Preserves dash-case slot', async () => {
			const html = await fixture.readFile('/svelte/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#dash-case').text().trim(), 'Fallback / Dash Case');
		});
	});
});

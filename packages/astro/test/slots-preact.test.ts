import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-framework-slots.prelude.ts';

describe('Slots: Preact', () => {
	it('Renders default slot', async () => {
		const html = await fixture.readFile('/preact/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#default-self-closing').text().trim(), 'Fallback');
		assert.equal($('#default-empty').text().trim(), 'Fallback');
		assert.equal($('#zero').text().trim(), '0');
		assert.equal($('#false').text().trim(), '');
		assert.equal($('#string').text().trim(), '');
		assert.equal($('#content').text().trim(), 'Hello world!');
	});

	it('Renders named slot', async () => {
		const html = await fixture.readFile('/preact/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#named').text().trim(), 'Fallback / Named');
	});

	it('Converts dash-case slot to camelCase', async () => {
		const html = await fixture.readFile('/preact/index.html');
		const $ = cheerio.load(html);
		assert.equal($('#dash-case').text().trim(), 'Fallback / Dash Case');
	});

	describe('For MDX Pages', () => {
		it('Renders default slot', async () => {
			const html = await fixture.readFile('/preact/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#content').text().trim(), 'Hello world!');
		});

		it('Renders named slot', async () => {
			const html = await fixture.readFile('/preact/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#named').text().trim(), 'Fallback / Named');
		});

		it('Converts dash-case slot to camelCase', async () => {
			const html = await fixture.readFile('/preact/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#dash-case').text().trim(), 'Fallback / Dash Case');
		});
	});
});

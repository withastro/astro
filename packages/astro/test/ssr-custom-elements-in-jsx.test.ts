import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.js';

describe('SSR custom elements in JSX', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/ssr-custom-elements-in-jsx/',
		});
		await fixture.build();
	});

	it('routes custom elements in MDX through the renderer pipeline', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		assert.equal($('my-element').attr('data-ssr'), 'yes');
	});
});

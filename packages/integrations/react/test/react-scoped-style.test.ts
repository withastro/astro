import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { load as cheerioLoad } from 'cheerio';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('React with scopedStyleStrategy: where', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: new URL('./fixtures/react-scoped-style/', import.meta.url),
		});
		await fixture.build();
	});

	it('merges scoped class into className prop', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const el = $('#with-classname');
		const classes = (el.attr('class') ?? '').split(/\s+/);
		assert.ok(classes.includes('scoped'), 'element should have user-provided "scoped" class');
		assert.ok(
			classes.some((c) => c.startsWith('astro-')),
			'element should have an astro scope class',
		);
	});

	it('adds scoped class when no className is provided', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const el = $('#without-classname');
		const classes = (el.attr('class') ?? '').split(/\s+/);
		assert.ok(
			classes.some((c) => c.startsWith('astro-')),
			'element should have an astro scope class',
		);
	});

	it('generates CSS with :where selector', async () => {
		const html = await fixture.readFile('/index.html');
		const $ = cheerioLoad(html);
		const style = $('style').text();
		assert.match(style, /:where/, 'CSS should use :where pseudo-selector');
		assert.match(style, /\.scoped/, 'CSS should include .scoped selector');
	});
});

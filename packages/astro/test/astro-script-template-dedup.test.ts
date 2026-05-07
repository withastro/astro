import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { fixture } from './preludes/standard-static.prelude.ts';

function countSubstring(str: string, sub: string) {
	let count = 0;
	let pos = 0;
	while ((pos = str.indexOf(sub, pos)) !== -1) {
		count++;
		pos += sub.length;
	}
	return count;
}

describe('Scripts inside template elements', () => {
	it('renders script outside template when component is used in template first, then outside', async () => {
		const html = await fixture.readFile('/script-dedup/template-then-component/index.html');
		const $ = cheerio.load(html);

		// One script inside the <template> (inert), one outside (executes)
		assert.equal($('body > script').length, 1);
		assert.equal(countSubstring(html, '<script type="module">'), 2);
	});

	it('renders script outside template when component is used outside first, then in template', async () => {
		const html = await fixture.readFile('/script-dedup/component-then-template/index.html');
		const $ = cheerio.load(html);

		// One script outside (executes, deduplicated normally), one inside the template
		assert.equal($('body > script').length, 1);
		assert.equal(countSubstring(html, '<script type="module">'), 2);
	});

	it('renders script outside nested templates', async () => {
		const html = await fixture.readFile('/script-dedup/nested-templates/index.html');
		const $ = cheerio.load(html);

		// One script outside (executes), one inside the nested templates
		assert.equal($('body > script').length, 1);
		assert.equal(countSubstring(html, '<script type="module">'), 2);
	});

	it('deduplicates scripts outside template while keeping one inside', async () => {
		const html = await fixture.readFile('/script-dedup/template-and-two-outside/index.html');
		const $ = cheerio.load(html);

		// Two components outside the template should still deduplicate to one script.
		// The template gets its own (inert) copy. Total: 2 scripts.
		assert.equal($('body > script').length, 1);
		assert.equal(countSubstring(html, '<script type="module">'), 2);
	});
});

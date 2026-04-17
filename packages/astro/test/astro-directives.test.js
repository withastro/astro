import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

describe('Directives', async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-directives/',
			// test suite was authored when inlineStylesheets defaulted to never
			build: { inlineStylesheets: 'never' },
		});
		await fixture.build();
	});

	it('Passes define:vars to script elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		assert.equal($('script').length, 5);

		let i = 0;
		for (const script of $('script').toArray()) {
			// Wrap script in scope ({}) to avoid redeclaration errors
			assert.equal($(script).text().startsWith('(function(){'), true);
			assert.equal($(script).text().endsWith('})();'), true);
			if (i < 2) {
				// Inline defined variables
				assert.equal($(script).toString().includes('const foo = "bar"'), true);
			} else if (i < 3) {
				// Convert invalid keys to valid identifiers
				assert.equal($(script).toString().includes('const dashCase = "bar"'), true);
			} else if (i < 4) {
				// Closing script tags in strings are escaped
				assert.equal(
					$(script).toString().includes('const bar = "\\u003cscript>bar\\u003c/script>"'),
					true,
				);
			} else {
				// Vars with undefined values are handled
				assert.equal($(script).toString().includes('const undef = undefined'), true);
			}
			i++;
		}
	});

	it('Passes define:vars to style elements', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		// All styles should be bundled
		assert.equal($('style').length, 0);

		// Inject style attribute on top-level element in page
		assert.equal($('html').attr('style').toString().includes('--bg: white;'), true);
		assert.equal($('html').attr('style').toString().includes('--fg: black;'), true);

		// Inject style attribute on top-level elements in component
		assert.equal($('h1').attr('style').toString().includes('--textColor: red;'), true);
	});

	it('Properly handles define:vars on style elements with style object', async () => {
		const html = await fixture.readFile('/define-vars/index.html');
		const $ = cheerio.load(html);

		// All styles should be bundled
		assert.equal($('style').length, 0);

		// Inject style attribute on top-level element in page
		assert.equal(
			$('#compound-style')
				.attr('style')
				.toString()
				.includes('color:var(--fg);--bg: white;--fg: black;'),
			true,
		);
	});

	it('set:html', async () => {
		const html = await fixture.readFile('/set-html/index.html');
		const $ = cheerio.load(html);

		assert.equal($('#text').length, 1);
		assert.equal($('#text').text(), 'a');

		assert.equal($('#zero').length, 1);
		assert.equal($('#zero').text(), '0');

		assert.equal($('#number').length, 1);
		assert.equal($('#number').text(), '1');

		assert.equal($('#undefined').length, 1);
		assert.equal($('#undefined').text(), '');

		assert.equal($('#null').length, 1);
		assert.equal($('#null').text(), '');

		assert.equal($('#false').length, 1);
		assert.equal($('#false').text(), '');

		assert.equal($('#true').length, 1);
		assert.equal($('#true').text(), 'true');
	});

	it('ignores client directives on Astro components', async () => {
		const html = await fixture.readFile('/client/index.html');
		const $ = cheerio.load(html);

		const hello = $('h1.hello');
		assert.equal(hello.text(), 'Hello');

		// Astro components should not have client directives
		assert.equal(hello.attr('client:load'), undefined);

		// Should not create Astro islands
		assert.equal($('astro-island').length, 0);
	});

	it('set:html Fragment as slot (children)', async () => {
		let res = await fixture.readFile('/set-html-children/index.html');
		assert.equal(res.includes('Test'), true);
	});
});

describe('set:html dev', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/astro-directives/',
		});
	});

	describe('Development', () => {
		/** @type {import('./test-utils').DevServer} */
		let devServer;

		before(async () => {
			devServer = await fixture.startDevServer();
			globalThis.TEST_FETCH = (fetch, url, init) => {
				return fetch(fixture.resolveUrl(url), init);
			};
		});

		after(async () => {
			await devServer.stop();
		});

		it('set:html can take a fetch()', async () => {
			let res = await fixture.fetch('/set-html-fetch');
			assert.equal(res.status, 200);
			let html = await res.text();
			const $ = cheerio.load(html);
			assert.equal($('#fetched-html').length, 1);
			assert.equal($('#fetched-html').text(), 'works');
		});

		it('set:html Fragment as slot (children) in dev', async () => {
			let res = await fixture.fetch('/set-html-children');
			assert.equal(res.status, 200);
			let html = await res.text();
			assert.equal(html.includes('Test'), true);
		});
	});
});

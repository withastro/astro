import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture } from '../../../astro/test/test-utils.js';

const FIXTURE_ROOT = new URL('./fixtures/mdx-optimize/', import.meta.url);

describe('MDX optimize', () => {
	/** @type {import('../../../astro/test/test-utils').Fixture} */
	let fixture;
	before(async () => {
		fixture = await loadFixture({
			root: FIXTURE_ROOT,
		});
		await fixture.build();
	});

	it('renders an MDX page fine', async () => {
		const html = await fixture.readFile('/index.html');
		const { document } = parseHTML(html);

		assert.equal(document.querySelector('h1').textContent.includes('MDX page'), true);
		assert.equal(
			document.querySelector('p').textContent.includes('I once heard a very inspirational quote:'),
			true,
		);

		const blockquote = document.querySelector('blockquote.custom-blockquote');
		assert.notEqual(blockquote, null);
		assert.equal(blockquote.textContent.includes('I like pancakes'), true);

		const code = document.querySelector('pre.astro-code');
		assert.notEqual(code, null);
		assert.equal(code.textContent.includes(`const pancakes = 'yummy'`), true);
	});

	it('renders an Astro page that imports MDX fine', async () => {
		const html = await fixture.readFile('/import/index.html');
		const { document } = parseHTML(html);

		assert.equal(document.querySelector('h1').textContent.includes('Astro page'), true);
		assert.equal(
			document.querySelector('p').textContent.includes('I once heard a very inspirational quote:'),
			true,
		);

		const blockquote = document.querySelector('blockquote.custom-blockquote');
		assert.notEqual(blockquote, null);
		assert.equal(blockquote.textContent.includes('I like pancakes'), true);
	});

	it('supports components passed to the MDX `<Content/> component if in the ignoreElementNames config', async () => {
		const html = await fixture.readFile('/content-component/index.html');
		const { document } = parseHTML(html);

		const strong = document.querySelector('strong.custom-strong');
		assert.ok(strong);
		assert.equal(strong.textContent.trim(), 'inspirational');
	});

	// This is skipped because we currently do support this (for top-level elements only). This is
	// unintentional but it would be a breaking change to remove support, so leaving as-is for now.
	it.skip('does not support components passed to the MDX `<Content/> component not in the ignoreElementNames config', async () => {
		const html = await fixture.readFile('/content-component/index.html');
		const { document } = parseHTML(html);

		const blockquote = document.querySelector('blockquote');
		assert.ok(blockquote);
		assert.ok(!blockquote.classList.contains('custom-blockquote'));
	});

	it('extracts components export from more complex MDX nodes', async () => {
		const html = await fixture.readFile('/import-export-block/index.html');
		const { document } = parseHTML(html);

		// Strong is expected because its in the `ignoreElementNames` config.
		const strong = document.querySelector('strong.custom-strong');
		assert.ok(strong);
		assert.equal(strong.textContent.trim(), 'Bold bullet point');

		// Blockquote is specified in the test document, and should also be extracted correctly.
		const blockquote = document.querySelector('blockquote.custom-blockquote');
		assert.ok(blockquote);
		assert.equal(blockquote.textContent.trim(), 'This is a blockquote');
	});

	it('renders MDX with rehype plugin that incorrectly injects root hast node', async () => {
		const html = await fixture.readFile('/import/index.html');
		const { document } = parseHTML(html);

		assert.doesNotMatch(html, /set:html=/);
		assert.equal(
			document.getElementById('injected-root-hast').textContent,
			'Injected root hast from rehype plugin',
		);
	});
});

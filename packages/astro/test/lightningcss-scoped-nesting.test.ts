import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type Fixture, loadFixture } from './test-utils.ts';

// Regression test for https://github.com/withastro/astro/issues/16524.
//
// When `vite.css.transformer: 'lightningcss'` is enabled, lightningcss
// flattens nested selectors before the Astro compiler injects scope
// attributes. The injector then sees `:where(...)` as the leading compound
// of the top-level rule and (before the fix) prepended `[data-astro-cid-X]`
// as a NEW leading compound — incorrectly constraining the matched child
// rather than `.parent`.
//
// The fix in `packages/astro/src/core/compile/style.ts` excludes
// lightningcss's `Nesting` lowering pass during the per-component
// `preprocessCSS()` call, so the compiler still sees `.parent` as the
// leading compound and attaches the cid to it. Vite's downstream pipeline
// still lowers nesting before the bundle is emitted.
describe('vite.css.transformer: lightningcss + scoped styles + nested `&`', () => {
	let fixture: Fixture;
	let stylesheet: string;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/lightningcss-scoped-nesting/',
		});
		await fixture.build();

		const html = await fixture.readFile('/index.html');
		const $ = cheerio.load(html);
		const href = $('link[rel=stylesheet]').attr('href')!;
		stylesheet = await fixture.readFile(href);
	});

	it('attaches the scope attribute to `.parent`, not as a fresh leading compound', () => {
		// Correct: .parent[data-astro-cid-...] (or class-strategy variant).
		// Either way `.parent` must appear immediately before the cid attribute.
		assert.match(
			stylesheet,
			/\.parent\[data-astro-cid-[^\]]+\]/,
			'expected `.parent[data-astro-cid-...]` in the produced CSS',
		);
	});

	it('does NOT prepend the scope attribute as a leading compound on the descendant rule', () => {
		// Bug shape (must not appear): `[data-astro-cid-...]:where(.parent ...)`
		// where the cid is constraining the matched child rather than `.parent`.
		assert.doesNotMatch(
			stylesheet,
			/\[data-astro-cid-[^\]]+\]:where\(\s*\.parent\b/,
			'cid was incorrectly attached to the descendant of `.parent` (bug shape from #16524)',
		);
	});
});

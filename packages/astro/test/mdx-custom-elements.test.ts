/**
 * Regression test for https://github.com/withastro/astro/issues/16273
 *
 * Bug: In renderJSXVNode (packages/astro/src/runtime/server/jsx.ts), the
 * `case typeof vnode.type === 'string' && vnode.type !== ClientOnlyPlaceholder`
 * branch routed ALL string-typed vnodes — including hyphenated custom elements
 * like <my-element> — straight to renderElement, bypassing renderComponentToString
 * and therefore every configured renderer.
 *
 * Fix: Add `&& !vnode.type.includes('-')` to the guard so custom elements fall
 * through to renderComponentToString, which runs the renderer's check /
 * renderToStaticMarkup lifecycle normally.
 *
 * Key insight: the Astro compiler routes hyphenated tags in .astro templates
 * through renderComponent (not as literal HTML), so a configured renderer IS
 * invoked there. Before the fix, MDX was the odd one out. After the fix, both
 * .astro and .mdx behave identically — the primary parity assertion below.
 *
 * Fixtures:
 *   fixtures/mdx-custom-elements/            — MDX + custom-element-renderer
 *   fixtures/mdx-custom-elements-no-renderer/ — MDX only (fallback baseline)
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import { type DevServer, type Fixture, loadFixture } from './test-utils.ts';

// ─── With renderer ────────────────────────────────────────────────────────────

describe('MDX custom elements — with renderer (issue #16273)', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mdx-custom-elements/',
		});
	});

	describe('build', () => {
		before(async () => {
			await fixture.build();
		});

		// Primary regression assertion: before the fix, MDX would bypass the
		// renderer and output plain HTML; after the fix it matches .astro.
		it('invokes the renderer for <my-element> inside an .mdx file', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal(
				$('my-element[data-ssr="true"]').length,
				1,
				'renderer should be invoked for the MDX custom element',
			);
		});

		it('invokes the renderer for <my-element> inside an .astro file', async () => {
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal(
				$('my-element[data-ssr="true"]').length,
				1,
				'renderer should be invoked for the .astro custom element too',
			);
		});

		// Parity assertion: the core purpose of the fix — MDX and .astro agree.
		it('.astro and .mdx pages both invoke the renderer for custom elements', async () => {
			const astroHtml = await fixture.readFile('/index.html');
			const mdxHtml = await fixture.readFile('/mdx/index.html');
			const $a = cheerio.load(astroHtml);
			const $m = cheerio.load(mdxHtml);

			assert.equal(
				$a('my-element[data-ssr="true"]').length,
				$m('my-element[data-ssr="true"]').length,
				'.astro and .mdx pages should have the same number of SSR-rendered custom elements',
			);
		});

		it('renderer output preserves the element tag name', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			assert.ok(html.includes('<my-element'), 'element tag must appear in output');
		});

		it('renderer output preserves explicit props (id)', async () => {
			const html = await fixture.readFile('/mdx/index.html');
			const $ = cheerio.load(html);
			assert.equal(
				$('my-element#mdx-element').length,
				1,
				'id prop from .mdx source should be forwarded by the renderer',
			);
		});
	});

	describe('dev', () => {
		let devServer: DevServer;

		before(async () => {
			devServer = await fixture.startDevServer();
		});

		after(async () => {
			await devServer.stop();
		});

		it('invokes the renderer for <my-element> in MDX during dev', async () => {
			const res = await fixture.fetch('/mdx');
			assert.equal(res.status, 200);
			const $ = cheerio.load(await res.text());
			assert.equal(
				$('my-element[data-ssr="true"]').length,
				1,
				'renderer must be invoked in dev mode for MDX',
			);
		});

		it('dev: .astro and .mdx pages both invoke the renderer', async () => {
			const [astroRes, mdxRes] = await Promise.all([
				fixture.fetch('/'),
				fixture.fetch('/mdx'),
			]);
			assert.equal(astroRes.status, 200);
			assert.equal(mdxRes.status, 200);

			const $a = cheerio.load(await astroRes.text());
			const $m = cheerio.load(await mdxRes.text());

			assert.equal($a('my-element[data-ssr="true"]').length, 1);
			assert.equal($m('my-element[data-ssr="true"]').length, 1);
		});
	});
});

// ─── Without renderer (fallback baseline) ────────────────────────────────────

describe('MDX custom elements — no renderer fallback', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/mdx-custom-elements-no-renderer/',
		});
		await fixture.build();
	});

	it('renders <my-element> as plain HTML when no renderer is registered', async () => {
		const html = await fixture.readFile('/mdx/index.html');
		const $ = cheerio.load(html);
		assert.ok($('my-element').length > 0, '<my-element> should appear as plain HTML');
		assert.equal(
			$('my-element[data-ssr]').length,
			0,
			'data-ssr must be absent — no renderer registered',
		);
	});

	it('.astro and .mdx both lack data-ssr when no renderer is registered', async () => {
		const astroHtml = await fixture.readFile('/index.html');
		const mdxHtml = await fixture.readFile('/mdx/index.html');
		const $a = cheerio.load(astroHtml);
		const $m = cheerio.load(mdxHtml);

		assert.equal($a('my-element[data-ssr]').length, 0);
		assert.equal($m('my-element[data-ssr]').length, 0);
		assert.ok($a('my-element').length > 0, '.astro page missing <my-element>');
		assert.ok($m('my-element').length > 0, '.mdx page missing <my-element>');
	});
});

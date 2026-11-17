import * as assert from 'node:assert/strict';
import path from 'node:path';
import { before, describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';

const selectors = [
	'counter',
	'shared-card',
	'island-a',
	'shared-badge',
	'shared-lightbox',
	'shared-note',
	'shared-tag',
	'svelte-shared',
	'svelte-panel',
] as const;

type Selector = (typeof selectors)[number];

/**
 * The classes whose styles each page must load exactly once. Every other class in `selectors`
 * must not be loaded at all.
 */
const expectedStyles: Record<string, Selector[]> = {
	// https://github.com/withastro/astro/issues/12303
	'/': ['counter'],
	// https://github.com/withastro/astro/issues/18677
	'/shared/': ['shared-card', 'island-a'],
	'/island-badge/': ['shared-badge'],
	'/script-badge/': ['shared-badge'],
	// https://github.com/withastro/astro/issues/18767
	'/gallery/': ['shared-lightbox'],
	'/lazy-lightbox/': ['shared-lightbox'],
	'/gallery-and-lazy-lightbox/': ['shared-lightbox'],
	'/lazy-panel/': ['shared-card'],
	'/client-only-lightbox/': ['shared-lightbox'],
	'/lazy-note/': ['shared-note'],
	// https://github.com/withastro/astro/issues/16119
	'/tag-island/': ['shared-tag'],
	'/tag-client-only-wrapper/': ['shared-tag'],
	// https://github.com/withastro/astro/issues/18123
	'/tag-static-and-client-only/': ['shared-tag'],
	'/svelte/static/': ['svelte-shared'],
	'/svelte/dynamic/': ['svelte-shared'],
	'/svelte/both/': ['svelte-shared'],
	// https://github.com/withastro/astro/issues/16251
	'/svelte/conditional/': ['svelte-panel'],
};

interface PageCss {
	/** Stylesheets in the page HTML, inline or linked */
	head: string[];
	/** CSS files that Vite's preload helper adds when the page's dynamic imports run */
	preloaded: string[];
	/** Referenced CSS and JS files that are not in the build output */
	missing: string[];
}

const importRE =
	/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s*)["'`]((?:\.\/|\/_astro\/)[^"'`]+\.js)["'`]/g;

/**
 * Collects the CSS a page loads once every dynamic import of its islands and scripts has run.
 * Like Vite's preload helper, it skips CSS files that the page already links.
 */
async function getPageCss(fixture: Fixture, pathname: string): Promise<PageCss> {
	const assets = new Set((await fixture.readdir('/_astro')).map((f) => `_astro/${f}`));
	const html = await fixture.readFile(`${pathname}index.html`);
	const result: PageCss = { head: [], preloaded: [], missing: [] };

	const linked = new Set<string>();
	for (const [, href] of html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="\/([^"]+)"/g)) {
		linked.add(href);
		if (assets.has(href)) result.head.push(await fixture.readFile(`/${href}`));
		else result.missing.push(href);
	}
	for (const [, css] of html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)) result.head.push(css);

	const entries = [
		...html.matchAll(/(?:component|renderer|before-hydration)-url="\/([^"]+)"/g),
		...html.matchAll(/<script[^>]*type="module"[^>]*src="\/([^"]+)"/g),
	].map((m) => m[1]);
	const visited = new Set<string>();
	const preloaded = new Set<string>();
	const visit = async (file: string) => {
		if (visited.has(file)) return;
		visited.add(file);
		if (!assets.has(file)) {
			result.missing.push(file);
			return;
		}
		const js = await fixture.readFile(`/${file}`);
		const deps = /m\.f=\[([^\]]*)\]/.exec(js)?.[1] ?? '';
		for (const [, css] of deps.matchAll(/["'`]\/?([^"'`]+\.css)["'`]/g)) {
			if (!assets.has(css)) result.missing.push(css);
			else if (!linked.has(css)) preloaded.add(css);
		}
		for (const [, specifier] of js.matchAll(importRE)) {
			await visit(
				specifier.startsWith('/')
					? specifier.slice(1)
					: path.posix.join(path.posix.dirname(file), specifier),
			);
		}
	};
	for (const entry of entries) await visit(entry);
	for (const css of preloaded) result.preloaded.push(await fixture.readFile(`/${css}`));
	return result;
}

/** Counts the rules for `.className`, in plain (`.a{`) and Svelte-scoped (`.a.svelte-x{`) form */
function countRules(css: string, className: string): number {
	return [...css.matchAll(new RegExp(`\\.${className}[.{]`, 'g'))].length;
}

describe('CSS deduplication for hydrated components', () => {
	for (const inlineStylesheets of ['never', 'auto', 'always'] as const) {
		describe(`inlineStylesheets: ${inlineStylesheets}`, () => {
			let fixture: Fixture;
			const pages = new Map<string, PageCss>();

			before(async () => {
				fixture = await loadFixture({
					site: 'https://test.dev/',
					root: './fixtures/css-deduplication/',
					build: { inlineStylesheets },
					outDir: `./dist/inline-stylesheets-${inlineStylesheets}`,
				});
				await fixture.build();
				for (const pathname of Object.keys(expectedStyles)) {
					pages.set(pathname, await getPageCss(fixture, pathname));
				}
			});

			for (const [pathname, expected] of Object.entries(expectedStyles)) {
				it(`loads the styles of ${pathname} exactly once`, () => {
					const { head, preloaded } = pages.get(pathname)!;
					const css = [...head, ...preloaded].join('\n');
					for (const className of selectors) {
						assert.equal(
							countRules(css, className),
							expected.includes(className) ? 1 : 0,
							`.${className} on ${pathname}`,
						);
					}
				});
			}

			it('only references CSS and JS files that exist', () => {
				for (const [pathname, { missing }] of pages) {
					assert.deepEqual(missing, [], `Missing files on ${pathname}`);
				}
			});

			// Styles that only arrive through Vite's preload helper are lost after a client-side
			// navigation, which replaces the head but keeps the helper's record of loaded files.
			it('puts the styles of dynamically imported modules in the page HTML', () => {
				for (const [pathname, { preloaded }] of pages) {
					assert.deepEqual(preloaded, [], `Preloaded CSS on ${pathname}`);
				}
			});

			it('does not emit CSS files that no page loads', async () => {
				const assets = await fixture.readdir('/_astro');
				const linked = new Set<string>();
				for (const pathname of Object.keys(expectedStyles)) {
					const html = await fixture.readFile(`${pathname}index.html`);
					for (const [, href] of html.matchAll(/href="\/_astro\/([^"]+\.css)"/g)) linked.add(href);
				}
				assert.deepEqual(
					assets.filter((f) => f.endsWith('.css') && !linked.has(f)),
					[],
				);
				if (inlineStylesheets === 'always') assert.equal(linked.size, 0);
			});
		});
	}
});

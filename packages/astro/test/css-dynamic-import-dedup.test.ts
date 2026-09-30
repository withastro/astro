import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

/**
 * Hydrated islands whose CSS is also bundled by the server build, and that are also
 * statically imported by a dynamically imported module:
 * - Grid is lazily loaded only on a page that also renders it, so the page already has
 *   its styles and Vite should not preload its CSS file.
 * - Card is lazily loaded by a page script, which the server build doesn't process, so
 *   that page needs the CSS file.
 */
async function getPreloadedCss(fixture: Fixture) {
	const assets = await fixture.readdir('/_astro');
	const preloaded = new Map<string, string | undefined>();
	for (const fileName of assets.filter((f) => f.endsWith('.js'))) {
		const code = await fixture.readFile(`/_astro/${fileName}`);
		for (const [, deps] of code.matchAll(/__vite__mapDeps=.*?\[([^\]]*)\]/g)) {
			for (const [, dep] of deps.matchAll(/"([^"]+\.css)"/g)) {
				const cssFileName = dep.split('/').pop()!;
				preloaded.set(
					dep,
					assets.includes(cssFileName)
						? await fixture.readFile(`/_astro/${cssFileName}`)
						: undefined,
				);
			}
		}
	}
	return preloaded;
}

async function getPageCss(fixture: Fixture, page: string) {
	const html = await fixture.readFile(page);
	let css = [...html.matchAll(/<style>(.*?)<\/style>/gs)].map((m) => m[1]).join('');
	for (const [, href] of html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)) {
		css += await fixture.readFile(href);
	}
	return css;
}

describe('CSS preloaded by a dynamic import of a hydrated component', () => {
	for (const inlineStylesheets of ['auto', 'never'] as const) {
		describe(`inlineStylesheets: ${inlineStylesheets}`, () => {
			let fixture: Fixture;
			let preloaded: Map<string, string | undefined>;

			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/css-dynamic-import-dedup/',
					build: { inlineStylesheets },
					outDir: `./dist/inline-stylesheets-${inlineStylesheets}`,
				});
				await fixture.build();
				preloaded = await getPreloadedCss(fixture);
			});

			it('emits every CSS file listed in dynamic import preload dependencies', () => {
				const missing = [...preloaded].filter(([, css]) => css === undefined).map(([dep]) => dep);
				assert.deepEqual(missing, []);
			});

			it('does not preload CSS that every page loading it already has', () => {
				const gridCss = [...preloaded.values()].filter((css) =>
					css?.includes('.dynamic-import-grid'),
				);
				assert.deepEqual(gridCss, []);
			});

			it('keeps the styles on a page that the server build did not style', async () => {
				const css = await getPageCss(fixture, '/script-card/index.html');
				assert.match(css, /\.dynamic-import-card\b/);
			});

			it('still renders the component styles on the page once', async () => {
				const indexCss = await getPageCss(fixture, '/index.html');
				assert.equal(indexCss.match(/\.dynamic-import-grid\b/g)?.length, 1);
				const cardCss = await getPageCss(fixture, '/static-card/index.html');
				assert.equal(cardCss.match(/\.dynamic-import-card\b/g)?.length, 1);
			});
		});
	}
});

import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { type Fixture, loadFixture } from './test-utils.ts';

/**
 * A hydrated island whose CSS is also bundled by the server build, and that is
 * also statically imported by a dynamically imported module. The client build
 * must not delete the island's CSS asset, because Vite lists it in the dynamic
 * import's preload dependencies.
 */
async function getMissingPreloadedCss(fixture: Fixture) {
	const assets = await fixture.readdir('/_astro');
	const missing: string[] = [];
	for (const fileName of assets.filter((f) => f.endsWith('.js'))) {
		const code = await fixture.readFile(`/_astro/${fileName}`);
		for (const [, deps] of code.matchAll(/__vite__mapDeps=.*?\[([^\]]*)\]/g)) {
			for (const [, dep] of deps.matchAll(/"([^"]+\.css)"/g)) {
				const cssFileName = dep.split('/').pop()!;
				if (!assets.includes(cssFileName)) missing.push(`${fileName} -> ${dep}`);
			}
		}
	}
	return missing;
}

describe('CSS preloaded by a dynamic import of a hydrated component', () => {
	for (const inlineStylesheets of ['auto', 'never'] as const) {
		describe(`inlineStylesheets: ${inlineStylesheets}`, () => {
			let fixture: Fixture;

			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/css-dynamic-import-dedup/',
					build: { inlineStylesheets },
					outDir: `./dist/inline-stylesheets-${inlineStylesheets}`,
				});
				await fixture.build();
			});

			it('emits every CSS file listed in dynamic import preload dependencies', async () => {
				assert.deepEqual(await getMissingPreloadedCss(fixture), []);
			});

			it('still renders the component styles on the page once', async () => {
				const html = await fixture.readFile('/index.html');
				const links = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"/g)].map((m) => m[1]);
				let pageCss = [...html.matchAll(/<style>(.*?)<\/style>/gs)].map((m) => m[1]).join('');
				for (const href of links) pageCss += await fixture.readFile(href);
				assert.equal(pageCss.match(/\.dynamic-import-grid\b/g)?.length, 1);
			});
		});
	}
});

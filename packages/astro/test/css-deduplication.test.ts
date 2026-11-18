import * as assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { loadFixture, type Fixture } from './test-utils.ts';

describe('CSS deduplication for hydrated components', () => {
	describe('inlineStylesheets: never', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				site: 'https://test.dev/',
				root: './fixtures/css-deduplication/',
				build: { inlineStylesheets: 'never' },
				outDir: './dist/inline-stylesheets-never',
			});
			await fixture.build();
		});

		it('should not duplicate CSS for hydrated components', async () => {
			const assets = await fixture.readdir('/_astro');

			// Generated file for Counter.css — find it dynamically since the hash may change
			const counterCssFile = assets.find((f) => f.startsWith('index.') && f.endsWith('.css'));
			assert.ok(counterCssFile, 'Expected a CSS file starting with "index."');
			const COUNTER_CSS_PATH = `/_astro/${counterCssFile}`;
			let file = await fixture.readFile(COUNTER_CSS_PATH);
			file = file.replace(/\s+/g, '');

			for (const fileName of assets) {
				const filePath = `/_astro/${fileName}`;
				if (filePath === COUNTER_CSS_PATH || !fileName.endsWith('.css')) {
					continue;
				}

				let r = await fixture.readFile(filePath);
				r = r.replace(/\s+/g, '');
				if (file.includes(r)) {
					assert.fail(`Duplicate CSS file: ${fileName}`);
				}
			}
			assert.ok(true);
		});

		it('does not emit client CSS for aliased islands or chunks they share', async () => {
			const assets = await fixture.readdir('/_astro');
			const cssFiles = assets.filter((f) => f.endsWith('.css'));
			const cssContents = await Promise.all(cssFiles.map((f) => fixture.readFile(`/_astro/${f}`)));

			const html = await fixture.readFile('/shared/index.html');
			const linkedCss = [...html.matchAll(/href="\/_astro\/([^"]+\.css)"/g)].map((m) => m[1]);
			assert.equal(linkedCss.length, 1);
			const linked = cssContents[cssFiles.indexOf(linkedCss[0])];
			assert.match(linked, /\.shared-card/);
			assert.match(linked, /\.island-a/);

			for (const [i, fileName] of cssFiles.entries()) {
				if (fileName === linkedCss[0]) continue;
				assert.doesNotMatch(
					cssContents[i],
					/\.shared-card|\.island-a/,
					`Duplicate CSS: ${fileName}`,
				);
			}

			// The preload list of the dynamic import must not reference CSS already on the page
			for (const fileName of assets.filter((f) => f.endsWith('.js'))) {
				const js = await fixture.readFile(`/_astro/${fileName}`);
				for (const [, cssFile] of js.matchAll(/_astro\/([^"'`]+\.css)/g)) {
					assert.ok(cssFiles.includes(cssFile), `${fileName} references missing ${cssFile}`);
					assert.doesNotMatch(cssContents[cssFiles.indexOf(cssFile)], /\.shared-card/);
				}
			}
		});

		it('keeps client CSS of chunks shared with islands that a script imports dynamically', async () => {
			const html = await fixture.readFile('/script-badge/index.html');
			const linkedCss = [...html.matchAll(/href="\/_astro\/([^"]+\.css)"/g)].map((m) => m[1]);
			assert.equal(linkedCss.length, 1);
			const linked = await fixture.readFile(`/_astro/${linkedCss[0]}`);
			assert.match(linked, /\.shared-badge/);
		});
	});

	describe('inlineStylesheets: always', () => {
		let fixture: Fixture;
		before(async () => {
			fixture = await loadFixture({
				site: 'https://test.dev/',
				root: './fixtures/css-deduplication/',
				build: { inlineStylesheets: 'always' },
				outDir: './dist/inline-stylesheets-always',
			});
			await fixture.build();
		});

		it('should not emit any .css file when inlineStylesheets is always', async () => {
			const assets = await fixture.readdir('/_astro');
			assert.ok(!assets.some((f) => f.endsWith('.css')));
		});
	});
});

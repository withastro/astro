import * as assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { after, before, describe, it } from 'node:test';
import netlify from '@astrojs/netlify';
import * as cheerio from 'cheerio';
import { globSync } from 'tinyglobby';
import { loadFixture } from '../../../../astro/test/test-utils.js';

describe(
	'Included vite assets files',
	() => {
		let fixture;

		const root = new URL('./fixtures/includes/', import.meta.url);
		const expectedCwd = new URL('.netlify/v1/functions/ssr/packages/integrations/netlify/', root);

		const expectedAssetsInclude = ['./*.json'];
		const excludedAssets = ['./files/exclude-asset.json'];

		before(async () => {
			fixture = await loadFixture({
				root,
				vite: {
					assetsInclude: expectedAssetsInclude,
				},
				adapter: netlify({
					excludeFiles: excludedAssets,
				}),
			});
			await fixture.build();
		});

		it('Emits vite assets files', async () => {
			for (const pattern of expectedAssetsInclude) {
				const files = globSync(pattern);
				for (const file of files) {
					assert.ok(
						existsSync(new URL(file, expectedCwd)),
						`Expected file ${pattern} to exist in build`,
					);
				}
			}
		});

		it('Does not include vite assets files when excluded', async () => {
			for (const file of excludedAssets) {
				assert.ok(
					!existsSync(new URL(file, expectedCwd)),
					`Expected file ${file} to not exist in build`,
				);
			}
		});

		after(async () => {
			await fixture.clean();
		});
	},
	{
		timeout: 120000,
	},
);

describe(
	'Included files',
	() => {
		let fixture;

		const root = new URL('./fixtures/includes/', import.meta.url);
		const expectedCwd = new URL(
			'.netlify/v1/functions/ssr/packages/integrations/netlify/test/functions/fixtures/includes/',
			root,
		);

		const expectedFiles = [
			'./files/include-this.txt',
			'./files/also-this.csv',
			'./files/subdirectory/and-this.csv',
		];

		before(async () => {
			fixture = await loadFixture({
				root,
				adapter: netlify({
					includeFiles: expectedFiles,
				}),
			});
			await fixture.build();
		});

		it('Emits include files', async () => {
			for (const file of expectedFiles) {
				assert.ok(existsSync(new URL(file, expectedCwd)), `Expected file ${file} to exist`);
			}
		});

		it('Can load included files correctly', async () => {
			const entryURL = new URL(
				'./fixtures/includes/.netlify/v1/functions/ssr/ssr.mjs',
				import.meta.url,
			);
			const { default: handler } = await import(entryURL);
			const resp = await handler(new Request('http://example.com/?file=include-this.txt'), {});
			const html = await resp.text();
			const $ = cheerio.load(html);
			assert.equal($('h1').text(), 'hello');
		});

		it('Includes traced node modules with symlinks', async () => {
			const expected = new URL(
				'.netlify/v1/functions/ssr/node_modules/.pnpm/cowsay@1.6.0/node_modules/cowsay/cows/happy-whale.cow',
				root,
			);
			assert.ok(existsSync(expected, 'Expected excluded file to exist in default build'));
		});

		after(async () => {
			await fixture.clean();
		});
	},
	{
		timeout: 120000,
	},
);

describe(
	'Excluded files',
	() => {
		let fixture;

		const root = new URL('./fixtures/includes/', import.meta.url);
		const expectedCwd = new URL(
			'.netlify/v1/functions/ssr/packages/integrations/netlify/test/functions/fixtures/includes/',
			root,
		);

		const includeFiles = ['./files/**/*.txt'];
		const excludedTxt = ['./files/subdirectory/not-this.txt', './files/subdirectory/or-this.txt'];
		const excludeFiles = [...excludedTxt, '../../../../../../../node_modules/.pnpm/cowsay@*/**'];

		before(async () => {
			fixture = await loadFixture({
				root,
				adapter: netlify({
					includeFiles: includeFiles,
					excludeFiles: excludeFiles,
				}),
			});
			await fixture.build();
		});

		it('Excludes traced node modules', async () => {
			const expected = new URL(
				'.netlify/v1/functions/ssr/node_modules/.pnpm/cowsay@1.6.0/node_modules/cowsay/cows/happy-whale.cow',
				root,
			);
			assert.ok(!existsSync(expected), 'Expected excluded file to not exist in build');
		});

		it('Does not include files when excluded', async () => {
			for (const pattern of includeFiles) {
				const files = globSync(pattern, { ignore: excludedTxt });
				for (const file of files) {
					assert.ok(
						existsSync(new URL(file, expectedCwd)),
						`Expected file ${pattern} to exist in build`,
					);
				}
			}
			for (const file of excludedTxt) {
				assert.ok(
					!existsSync(new URL(file, expectedCwd)),
					`Expected file ${file} to not exist in build`,
				);
			}
		});

		after(async () => {
			await fixture.clean();
		});
	},
	{
		timeout: 120000,
	},
);

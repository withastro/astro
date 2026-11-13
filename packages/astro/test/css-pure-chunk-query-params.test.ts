import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('CSS pure chunk cleanup with assetQueryParams', () => {
	let fixture: Fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-pure-chunk-query-params/',
			output: 'server',
			adapter: testAdapter({
				extendAdapter: {
					client: {
						assetQueryParams: new URLSearchParams({ dpl: 'test-deploy-id' }),
					},
				},
			}),
			outDir: './dist/css-pure-chunk-query-params/',
		});
		await fixture.build();
	});

	it('does not leave dangling imports to deleted pure CSS chunks', async () => {
		const allFiles = await fixture.glob('client/**/*');
		const allFilenames = new Set(allFiles.map((f: string) => f.replace(/^client\//, '')));

		const jsFiles = await fixture.glob('client/**/*.js');
		assert.ok(jsFiles.length > 0, 'Should have at least one client JS file');

		for (const file of jsFiles) {
			const code = await fixture.readFile(`/${file}`);
			const dir = file.includes('/') ? file.replace(/\/[^/]+$/, '/').replace(/^client\//, '') : '';

			// Match static side-effect imports: import "./chunk.js" or import "./chunk.js?dpl=..."
			// and value imports: import { x } from "./chunk.js" or from "./chunk.js?dpl=..."
			const allImports = [
				...code.matchAll(/(?:from|import)\s*["'](\.\.?\/[^"'?]+\.(?:js|mjs))(?:\?[^"']*)?["']/g),
				...code.matchAll(/import\s*\(\s*["'](\.\.?\/[^"'?]+\.(?:js|mjs))(?:\?[^"']*)?["']\s*\)/g),
			];

			for (const match of allImports) {
				const specifier = match[1];
				// Resolve relative path
				const resolved = new URL(specifier, `file:///client/${dir}placeholder`).pathname.replace(
					/^\/client\//,
					'',
				);
				assert.ok(
					allFilenames.has(resolved),
					`Chunk "${file}" imports "${specifier}" which resolves to "${resolved}" ` +
						`but that file does not exist in the client output. ` +
						`This indicates a dangling import to a deleted pure CSS chunk.`,
				);
			}
		}
	});

	it('appends assetQueryParams to surviving JS imports', async () => {
		const jsFiles = await fixture.glob('client/**/*.js');

		let foundImportWithParams = false;
		for (const file of jsFiles) {
			const code = await fixture.readFile(`/${file}`);
			// Match relative JS imports with query params
			const imports = [
				...code.matchAll(/(?:from|import)\s*["'](\.\.?\/[^"']+\.(?:js|mjs)\?[^"']*)["']/g),
				...code.matchAll(/import\s*\(\s*["'](\.\.?\/[^"']+\.(?:js|mjs)\?[^"']*)["']\s*\)/g),
			];
			for (const match of imports) {
				foundImportWithParams = true;
				assert.match(
					match[1],
					/\?dpl=test-deploy-id/,
					`Import should include assetQueryParams: ${match[0]}`,
				);
			}
		}
		assert.ok(foundImportWithParams, 'Should have at least one JS import with query params');
	});
});

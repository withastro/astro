import assert from 'node:assert/strict';
import { describe, before, it } from 'node:test';
import { loadFixture } from './test-utils.js';

const cssAssetReferenceRegExp = /_astro\/[A-Za-z\d\-]+\.[\da-f]{8}\.css/g;

describe("When Vite's preloadModule polyfill is used", async () => {
	let fixture;

	before(async () => {
		fixture = await loadFixture({
			root: './fixtures/css-dangling-references/',
		});
		await fixture.build();
	});

	it('there are no references to deleted CSS chunks', async () => {
		const fileNames = await fixture.readdir('/_astro/');
		const filePaths = fileNames.map((filename) => '_astro/' + filename);

		const expectations = filePaths
			.filter((filePath) => filePath.endsWith('js'))
			.map(async (filePath) => {
				const contents = await fixture.readFile(filePath);
				const cssReferences = contents.match(cssAssetReferenceRegExp);

				if (cssReferences === null) return;
				assert.deepEqual(
					filePaths,
					cssReferences,
					filePath + ' contains a reference to a deleted css asset: ' + cssReferences
				);
			});

		await Promise.all(expectations);
	});
});

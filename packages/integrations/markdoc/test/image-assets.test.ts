import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import { parseHTML } from 'linkedom';
import { loadFixture, type Fixture } from './test-utils.ts';

const imageAssetsFixture = new URL('./fixtures/image-assets/', import.meta.url);
const imageAssetsCustomFixture = new URL('./fixtures/image-assets-custom/', import.meta.url);

describe('Markdoc - Image assets', () => {
	const configurations: [URL, string][] = [
		[imageAssetsFixture, 'Standard default image node rendering'],
		[imageAssetsCustomFixture, 'Custom default image node component'],
	];

	for (const [root, description] of configurations) {
		describe(description, () => {
			let baseFixture: Fixture;

			before(async () => {
				baseFixture = await loadFixture({
					root,
				});
			});

			describe('build', () => {
				before(async () => {
					await baseFixture.build();
				});

				it('uses public/ image paths unchanged', async () => {
					const html = await baseFixture.readFile('/index.html');
					const { document } = parseHTML(html);
					assert.equal(
						document.querySelector<HTMLImageElement>('#public > img')?.src,
						'/favicon.svg',
					);
				});

				it('transforms relative image paths to optimized path', async () => {
					const html = await baseFixture.readFile('/index.html');
					const { document } = parseHTML(html);
					assert.match(
						document.querySelector<HTMLImageElement>('#relative > img')!.src,
						/^\/_astro\/oar.*\.webp$/,
					);
				});

				it('transforms aliased image paths to optimized path', async () => {
					const html = await baseFixture.readFile('/index.html');
					const { document } = parseHTML(html);
					assert.match(
						document.querySelector<HTMLImageElement>('#alias > img')!.src,
						/^\/_astro\/cityscape.*\.webp$/,
					);
				});

				it('passes images inside image tags to configured image component', async () => {
					const html = await baseFixture.readFile('/index.html');
					const { document } = parseHTML(html);
					assert.equal(
						document.querySelector<HTMLImageElement>('#component > img')?.className,
						'custom-styles',
					);
					assert.match(
						document.querySelector<HTMLImageElement>('#component > img')!.src,
						/^\/_astro\/oar.*\.webp$/,
					);
				});
			});
		});
	}
});

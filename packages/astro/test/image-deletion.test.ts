import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';
import testAdapter from './test-adapter.ts';
import { testImageService } from './test-image-service.ts';
import { type Fixture, loadFixture } from './test-utils.ts';

describe('astro:assets - delete images that are unused', () => {
	let fixture: Fixture;

	describe('build ssg', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-deletion/',
				image: {
					service: testImageService(),
				},
				outDir: './dist/image-deletion-build-ssg/',
			});

			await fixture.build();
		});

		it('should delete images that are only used for optimization', async () => {
			const imagesOnlyOptimized = await fixture.glob('_astro/onlyone.*.*');
			assert.equal(imagesOnlyOptimized.length, 1);
		});

		it('should not delete images that are used in other contexts', async () => {
			const imagesUsedElsewhere = await fixture.glob('_astro/twoofus.*.*');
			assert.equal(imagesUsedElsewhere.length, 2);
		});

		it('should not delete images that are also used through query params', async () => {
			const imagesUsedElsewhere = await fixture.glob('_astro/url.*.*');
			assert.equal(imagesUsedElsewhere.length, 2);
		});

		it('should delete MDX images only used for optimization', async () => {
			const imagesOnlyOptimized = await fixture.glob('_astro/mdxDontExist.*.*');
			assert.equal(imagesOnlyOptimized.length, 1);
		});

		it('should always keep Markdoc images', async () => {
			const imagesUsedElsewhere = await fixture.glob('_astro/markdocStillExists.*.*');
			assert.equal(imagesUsedElsewhere.length, 2);
		});
	});

	describe('build ssr', () => {
		before(async () => {
			fixture = await loadFixture({
				root: './fixtures/core-image-deletion-ssr/',
				output: 'server',
				adapter: testAdapter(),
				image: {
					service: testImageService(),
				},
				outDir: './dist/image-deletion-build-ssr/',
			});

			await fixture.build();
		});

		it('should delete prerendered images that are only used for optimization', async () => {
			const imagesOnlyOptimized = await fixture.glob('client/_astro/onlyone.*.*');
			assert.equal(imagesOnlyOptimized.length, 1);
		});

		it('should not delete prerendered images that are used in other contexts', async () => {
			const imagesUsedElsewhere = await fixture.glob('client/_astro/twoofus.*.*');
			assert.equal(imagesUsedElsewhere.length, 2);
		});

		it('should not delete images that are used in both a prerendered and an SSR page', async () => {
			const imagesUsedInBoth = await fixture.glob('client/_astro/shared.*.*');
			assert.equal(imagesUsedInBoth.length, 2);
		});
	});
});

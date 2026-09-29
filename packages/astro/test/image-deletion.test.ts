import assert from 'node:assert/strict';
import fs from 'node:fs';
import { before, describe, it } from 'node:test';
import * as cheerio from 'cheerio';
import type { AstroIntegration } from '../dist/types/public/integrations.js';
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

		it('should generate images optimized in getStaticPaths', async () => {
			const $ = cheerio.load(await fixture.readFile('/paths/one/index.html'));
			const src = $('#from-paths').attr('src')!;
			assert.match(src, /^\/_astro\/staticPaths\.\w+_\w+\.webp$/);
			assert.ok(fixture.pathExists(src));
			assert.equal((await fixture.glob('_astro/staticPaths.*.*')).length, 1);
		});
	});

	describe('build ssg with a prerenderer wrapping the default one', () => {
		const hookCalls: string[] = [];

		before(async () => {
			const integration: AstroIntegration = {
				name: 'wrapping-prerenderer',
				hooks: {
					'astro:build:start': ({ setPrerenderer }) => {
						setPrerenderer((defaultPrerenderer) => ({
							name: 'wrapping-prerenderer',
							setup: () => defaultPrerenderer.setup!(),
							getStaticPaths: () => defaultPrerenderer.getStaticPaths(),
							render: (request, options) => defaultPrerenderer.render(request, options),
							async collectUnattributedMetadata() {
								hookCalls.push('collectUnattributedMetadata');
								return { staticImages: [], referencedImages: [] };
							},
							async collectStaticImages() {
								hookCalls.push('collectStaticImages');
								return new Map();
							},
							async generateImages(images) {
								hookCalls.push('generateImages');
								return images;
							},
							async teardown() {
								hookCalls.push('teardown');
							},
						}));
					},
				},
			};
			fixture = await loadFixture({
				root: './fixtures/core-image-deletion/',
				integrations: [integration],
				image: {
					service: testImageService(),
				},
				outDir: './dist/image-deletion-build-ssg-wrapped/',
				cacheDir: './node_modules/.astro-test/image-deletion-build-ssg-wrapped/',
			});
			await fs.promises.rm(new URL(fixture.config.cacheDir), { recursive: true, force: true });

			await fixture.build();
		});

		it('calls the image hooks in order', () => {
			assert.deepEqual(hookCalls, [
				'collectUnattributedMetadata',
				'collectStaticImages',
				'generateImages',
				'teardown',
			]);
		});

		it("generates images with the default prerenderer's image service", async () => {
			assert.equal((await fixture.glob('_astro/onlyone.*.webp')).length, 1);
			assert.equal((await fixture.glob('_astro/onlyone.*.*')).length, 1);
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

		it('should optimize images on demand once the build is done', async () => {
			const app = await fixture.loadTestAdapterApp();
			const response = await app.render(new Request('http://example.com/ssr-image'));
			const $ = cheerio.load(await response.text());
			assert.match($('img').attr('src')!, /^\/_image\?/);
		});
	});
});

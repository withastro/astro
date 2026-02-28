import * as assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import nodejs from '../dist/index.js';
import * as cheerio from 'cheerio';
import { loadFixture } from './test-utils.js';

// 5MB
const BUNDLE_SIZE_THRESHOLD = 1024 * 1024 * 5;

// `index.astro` (SSR) contains `<Code lang="js" />`
// `prerender.astro` (Prerendered) contains `<Code lang="rust" />`

describe('Shiki bundle size', () => {
	/** @type {import('./test-utils').Fixture} */
	let fixture;
	let devPreview;

	describe('SSR', () => {
		describe('default (unoptimized)', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/shiki-bundle-size/ssr-only/',
					output: 'server',
					adapter: nodejs({ mode: 'standalone' }),
				});
				await fixture.build();
				devPreview = await fixture.preview();
			});

			after(async () => {
				await devPreview.stop();
			});

			it('should include all languages and themes by default', async () => {
				const files = await fixture.readdir('server/chunks');
				const contents = await Promise.all(
					files.map((f) => fixture.readFile(`server/chunks/${f}`)),
				);
				const totalSize = contents.reduce((acc, content) => acc + content.length, 0);

				assert.ok(totalSize >= BUNDLE_SIZE_THRESHOLD);
			});

			it('should render the page successfully', async () => {
				const response = await fixture.fetch('/');

				assert.equal(response.status, 200);
			});

			it('should render highlighted code with correct inline styles', async () => {
				const response = await fixture.fetch('/');
				const html = await response.text();
				const $ = cheerio.load(html);
				const pre = $('pre');
				const segments = $('.line', pre).get(0).children;

				assert.equal(
					pre.attr('style'),
					'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
				);
				assert.equal(segments[0].attribs.style, 'color:#F97583');
				assert.equal(segments[1].attribs.style, 'color:#E1E4E8');
				assert.equal(segments[2].attribs.style, 'color:#F97583');
				assert.equal(segments[3].attribs.style, 'color:#9ECBFF');
				assert.equal(segments[4].attribs.style, 'color:#E1E4E8');
			});
		});

		describe('optimized', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/shiki-bundle-size/ssr-only/',
					output: 'server',
					adapter: nodejs({ mode: 'standalone' }),
					experimental: {
						optimizeShiki: {
							includeLangs: ['html', 'css', 'js'],
							includeThemes: ['github-dark'],
						},
					},
				});
				await fixture.build();
				devPreview = await fixture.preview();
			});

			after(async () => {
				await devPreview.stop();
			});

			it('should exclude languages and themes not in the allowlist', async () => {
				const excluded = ['c', 'cpp', 'rust', 'github-light'];
				const matches = await Promise.all(
					excluded.map((name) => fixture.glob(`server/chunks/${name}_*.mjs`)),
				);

				assert.equal(matches.flat().length, 0);
			});

			it('should include only specified languages and themes', async () => {
				// "js" resolves to "javascript" via alias, which Vite/Rollup bundles as "mjs_*.mjs"
				// since "mjs" is also an alias for "javascript".
				const included = ['html', 'css', 'mjs', 'github-dark'];
				const matches = await Promise.all(
					included.map((name) => fixture.glob(`server/chunks/${name}_*.mjs`)),
				);

				assert.equal(matches.flat().length, included.length);
			});

			it('should significantly reduce the total bundle size', async () => {
				const files = await fixture.readdir('server/chunks');
				const contents = await Promise.all(
					files.map((f) => fixture.readFile(`server/chunks/${f}`)),
				);
				const totalSize = contents.reduce((acc, content) => acc + content.length, 0);

				assert.ok(totalSize < BUNDLE_SIZE_THRESHOLD);
			});

			it('should render the page successfully', async () => {
				const response = await fixture.fetch('/');

				assert.equal(response.status, 200);
			});

			it('should render highlighted code successfully in optimized mode', async () => {
				const response = await fixture.fetch('/');
				const html = await response.text();
				const $ = cheerio.load(html);
				const pre = $('pre');
				const segments = $('.line', pre).get(0).children;

				assert.equal(
					pre.attr('style'),
					'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
				);
				assert.equal(segments[0].attribs.style, 'color:#F97583');
				assert.equal(segments[1].attribs.style, 'color:#E1E4E8');
				assert.equal(segments[2].attribs.style, 'color:#F97583');
				assert.equal(segments[3].attribs.style, 'color:#9ECBFF');
				assert.equal(segments[4].attribs.style, 'color:#E1E4E8');
			});
		});

		describe('optimized with aliases', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/shiki-bundle-size/ssr-only/',
					output: 'server',
					adapter: nodejs({ mode: 'standalone' }),
					experimental: {
						optimizeShiki: {
							// The `<Code />` component uses "js", but here we specify "javascript" as an alias to test alias resolution.
							includeLangs: ['html', 'css', 'javascript'],
							includeThemes: ['github-dark'],
						},
					},
				});
				await fixture.build();
				devPreview = await fixture.preview();
			});

			after(async () => {
				await devPreview.stop();
			});

			it('should resolve language aliases and render highlighted code correctly', async () => {
				const response = await fixture.fetch('/');
				const html = await response.text();
				const $ = cheerio.load(html);
				const pre = $('pre');
				const segments = $('.line', pre).get(0).children;

				assert.equal(
					pre.attr('style'),
					'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
				);
				assert.equal(segments[0].attribs.style, 'color:#F97583');
				assert.equal(segments[1].attribs.style, 'color:#E1E4E8');
				assert.equal(segments[2].attribs.style, 'color:#F97583');
				assert.equal(segments[3].attribs.style, 'color:#9ECBFF');
				assert.equal(segments[4].attribs.style, 'color:#E1E4E8');
			});
		});
	});

	describe('SSR & Prerender', () => {
		describe('optimized', () => {
			before(async () => {
				fixture = await loadFixture({
					root: './fixtures/shiki-bundle-size/ssr-and-prerender/',
					output: 'server',
					adapter: nodejs({ mode: 'standalone' }),
					experimental: {
						optimizeShiki: {
							// omit all languages for SSR pages
							includeLangs: [],
							includeThemes: ['github-dark'],
						},
					},
				});
				await fixture.build();
				devPreview = await fixture.preview();
			});

			after(async () => {
				await devPreview.stop();
			});

			it('should respect the allowlist in hybrid mode', async () => {
				const excluded = ['c', 'cpp', 'rust', 'github-light'];
				const matches = await Promise.all(
					excluded.map((name) => fixture.glob(`server/chunks/${name}_*.mjs`)),
				);

				assert.equal(matches.flat().length, 0);
			});

			it('should have a reduced bundle size in hybrid mode', async () => {
				const files = await fixture.readdir('server/chunks');
				const contents = await Promise.all(
					files.map((f) => fixture.readFile(`server/chunks/${f}`)),
				);
				const totalSize = contents.reduce((acc, content) => acc + content.length, 0);

				assert.ok(totalSize < BUNDLE_SIZE_THRESHOLD);
			});

			it('should render the SSR page successfully', async () => {
				const response = await fixture.fetch('/');

				assert.equal(response.status, 200);
			});

			it('should render plain text when the language is excluded from SSR', async () => {
				const response = await fixture.fetch('/');
				const html = await response.text();
				const $ = cheerio.load(html);
				const pre = $('pre');
				const segments = $('.line', pre).get(0).children;

				assert.equal(
					$('pre').attr('style'),
					'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
				);
				assert.equal(segments[0].attribs.style, undefined);
			});

			it('should still render highlighted code for prerendered pages', async () => {
				const response = await fixture.fetch('/prerender');
				const html = await response.text();
				const $ = cheerio.load(html);
				const pre = $('pre');
				const segments = $('.line', pre).get(0).children;

				assert.equal(
					pre.attr('style'),
					'background-color:#24292e;color:#e1e4e8; overflow-x: auto;',
				);
				assert.equal(segments[0].attribs.style, 'color:#F97583');
				assert.equal(segments[1].attribs.style, 'color:#E1E4E8');
				assert.equal(segments[2].attribs.style, 'color:#F97583');
				assert.equal(segments[3].attribs.style, 'color:#9ECBFF');
				assert.equal(segments[4].attribs.style, 'color:#E1E4E8');
			});
		});
	});
});

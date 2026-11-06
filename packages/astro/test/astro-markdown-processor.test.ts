import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { unified, type MarkdownRenderer } from '@astrojs/markdown-remark';
import * as cheerio from 'cheerio';
import { type AstroInlineConfig, loadFixture } from './test-utils.ts';

const FIXTURE_ROOT = './fixtures/astro-markdown-plugins/';

describe('markdown.processor', () => {
	describe('default processor', () => {
		it('renders markdown without an explicit processor', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-default/',
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('h1').first().text(), 'Hello world');
		});
	});

	describe('unified() processor', () => {
		it('applies remarkPlugins passed via unified({...})', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-unified-remark/',
				markdown: {
					processor: unified({
						remarkPlugins: [
							() => (tree) => {
								tree.children.push({
									type: 'paragraph',
									children: [{ type: 'text', value: 'remark plugin applied via unified()' }],
								});
							},
						],
					}),
				},
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			assert.ok(html.includes('remark plugin applied via unified()'));
		});

		it('applies rehypePlugins passed via unified({...})', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-unified-rehype/',
				markdown: {
					processor: unified({
						rehypePlugins: [
							() => (tree: any) => {
								tree.children.push({
									type: 'element',
									tagName: 'p',
									properties: { id: 'rehype-marker' },
									children: [{ type: 'text', value: 'rehype plugin applied via unified()' }],
								});
							},
						],
					}),
				},
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('#rehype-marker').length, 1);
		});

		it('forwards gfm and smartypants overrides on the processor', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-unified-gfm-off/',
				markdown: {
					processor: unified({ gfm: false, smartypants: false }),
				},
			});
			await fixture.build();
			const gfm = cheerio.load(await fixture.readFile('/with-gfm/index.html'));
			// GFM autolink would have produced an <a>; disabled here.
			assert.equal(gfm('a[href="https://example.com"]').length, 0);
			const sm = cheerio.load(await fixture.readFile('/with-smartypants/index.html'));
			assert.equal(sm('p').html(), '"Smartypants" is -- awesome ...');
		});
	});

	describe('legacy markdown.remarkPlugins (deprecated)', () => {
		it('still folds into the default unified() processor', async () => {
			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-legacy/',
				markdown: {
					remarkPlugins: [
						() => (tree) => {
							tree.children.push({
								type: 'paragraph',
								children: [{ type: 'text', value: 'legacy remarkPlugins still applied' }],
							});
						},
					],
				},
			});
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			assert.ok(html.includes('legacy remarkPlugins still applied'));
		});
	});

	describe('third-party processor', () => {
		it('uses the processor’s createRenderer for .md files', async () => {
			const calls: string[] = [];
			const dummyProcessor = {
				name: 'dummy',
				options: {},
				async createRenderer(): Promise<MarkdownRenderer> {
					return {
						async render(content) {
							calls.push(content);
							return {
								code: `<p data-from="dummy-processor">rendered ${content.length} chars</p>`,
								metadata: {
									headings: [],
									localImagePaths: [],
									remoteImagePaths: [],
									frontmatter: {},
								},
							};
						},
					};
				},
			};

			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-thirdparty/',
				markdown: {
					processor: dummyProcessor,
				},
			} as unknown as AstroInlineConfig);
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			const $ = cheerio.load(html);
			assert.equal($('[data-from="dummy-processor"]').length, 1);
			assert.ok(calls.length > 0, 'expected createRenderer().render() to have been called');
		});

		it('preserves a non-unified processor when legacy remarkPlugins are set', async () => {
			const dummyProcessor = {
				name: 'dummy',
				options: {},
				async createRenderer(): Promise<MarkdownRenderer> {
					return {
						async render() {
							return {
								code: '<p data-from="dummy-processor">dummy still ran</p>',
								metadata: {
									headings: [],
									localImagePaths: [],
									remoteImagePaths: [],
									frontmatter: {},
								},
							};
						},
					};
				},
			};

			const fixture = await loadFixture({
				root: FIXTURE_ROOT,
				outDir: './dist/markdown-processor-mismatch/',
				markdown: {
					processor: dummyProcessor,
					remarkPlugins: [
						() => (tree: any) => {
							tree.children.push({
								type: 'paragraph',
								children: [{ type: 'text', value: 'plugin should not run' }],
							});
						},
					],
				},
			} as unknown as AstroInlineConfig);
			await fixture.build();
			const html = await fixture.readFile('/index.html');
			// The user's chosen processor stays active; the legacy plugin is silently ignored
			// (a warning was emitted at validate time pointing the user at `unified()`).
			assert.ok(html.includes('dummy still ran'));
			assert.ok(!html.includes('plugin should not run'));
		});
	});
});

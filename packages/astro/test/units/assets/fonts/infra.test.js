// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BuildUrlProxyHashResolver } from '../../../../dist/assets/fonts/infra/build-url-proxy-hash-resolver.js';
import { BuildUrlResolver } from '../../../../dist/assets/fonts/infra/build-url-resolver.js';
import { CachedFontFetcher } from '../../../../dist/assets/fonts/infra/cached-font-fetcher.js';
import { CapsizeFontMetricsResolver } from '../../../../dist/assets/fonts/infra/capsize-font-metrics-resolver.js';
import { RealDataCollector } from '../../../../dist/assets/fonts/infra/data-collector.js';
import { DevUrlProxyHashResolver } from '../../../../dist/assets/fonts/infra/dev-url-proxy-hash-resolver.js';
import { DevUrlResolver } from '../../../../dist/assets/fonts/infra/dev-url-resolver.js';
import { RealFontTypeExtractor } from '../../../../dist/assets/fonts/infra/font-type-extractor.js';
import {
	handleValueWithSpaces,
	MinifiableCssRenderer,
	renderCssVariable,
	renderFontFace,
	withFamily,
} from '../../../../dist/assets/fonts/infra/minifiable-css-renderer.js';
import { FakeHasher, SpyStorage } from './utils.js';

describe('fonts infra', () => {
	describe('MinifiableCssRenderer', () => {
		describe('renderFontFace()', () => {
			it('filters undefined properties properly', () => {
				assert.equal(renderFontFace({ foo: 'test' }, true).includes('foo:test'), true);
				assert.equal(renderFontFace({ foo: 'test', bar: undefined }, true).includes('bar'), false);
			});

			it('formats properly', () => {
				assert.equal(renderFontFace({ foo: 'test' }, false), '@font-face {\n  foo: test;\n}\n');
				assert.equal(renderFontFace({ foo: 'test' }, true), '@font-face{foo:test;}');
			});
		});

		it('renderCssVariable()', () => {
			assert.equal(
				renderCssVariable('foo', ['bar', 'x y'], false),
				':root {\n  foo: bar, "x y";\n}\n',
			);
			assert.equal(renderCssVariable('foo', ['bar', 'x y'], true), ':root{foo:bar,"x y";}');
		});

		it('withFamily()', () => {
			assert.deepStrictEqual(withFamily('foo', { bar: 'baz' }), {
				'font-family': 'foo',
				bar: 'baz',
			});
			assert.deepStrictEqual(withFamily('x y', { bar: 'baz' }), {
				'font-family': '"x y"',
				bar: 'baz',
			});
		});

		it('handleValueWithSpaces()', () => {
			assert.equal(handleValueWithSpaces('foo'), 'foo');
			assert.equal(handleValueWithSpaces('x y'), '"x y"');
		});
	});

	it('RealDataCollector', () => {
		/** @type {import('../../../../dist/assets/fonts/types.js').FontFileDataMap} */
		const map = new Map();
		/** @type {Array<import('../../../../dist/assets/fonts/types.js').PreloadData>} */
		const preloadData = [];
		/** @type {Array<import('../../../../dist/assets/fonts/core/optimize-fallbacks.js').CollectedFontForMetrics>} */
		const collectedFonts = [];

		const dataCollector = new RealDataCollector({
			hasUrl: (hash) => map.has(hash),
			saveUrl: ({ hash, url, init }) => {
				map.set(hash, { url, init });
			},
			savePreload: (preload) => {
				preloadData.push(preload);
			},
			saveFontData: (collected) => {
				collectedFonts.push(collected);
			},
		});

		dataCollector.collect({
			hash: 'xxx',
			url: 'abc',
			preload: null,
			data: {
				weight: undefined,
				style: undefined,
				subset: undefined,
			},
			init: null,
		});
		dataCollector.collect({
			hash: 'yyy',
			url: 'def',
			preload: {
				type: 'woff2',
				url: 'def',
				weight: undefined,
				style: 'normal',
				subset: undefined,
			},
			data: {
				weight: undefined,
				style: undefined,
				subset: undefined,
			},
			init: null,
		});
		dataCollector.collect({
			hash: 'xxx',
			url: 'abc',
			preload: null,
			data: {
				weight: undefined,
				style: undefined,
				subset: undefined,
			},
			init: null,
		});

		assert.deepStrictEqual(
			[...map.entries()],
			[
				['xxx', { url: 'abc', init: null }],
				['yyy', { url: 'def', init: null }],
			],
		);
		assert.deepStrictEqual(preloadData, [
			{
				type: 'woff2',
				url: 'def',
				weight: undefined,
				style: 'normal',
				subset: undefined,
			},
		]);
		assert.deepStrictEqual(collectedFonts, [
			{
				hash: 'xxx',
				url: 'abc',
				data: {
					weight: undefined,
					style: undefined,
					subset: undefined,
				},
				init: null,
			},
			{
				hash: 'yyy',
				url: 'def',
				data: {
					weight: undefined,
					style: undefined,
					subset: undefined,
				},
				init: null,
			},
			{
				hash: 'xxx',
				url: 'abc',
				data: {
					weight: undefined,
					style: undefined,
					subset: undefined,
				},
				init: null,
			},
		]);
	});

	describe('CachedFontFetcher', () => {
		/**
		 *
		 * @param {{ ok: boolean }} param0
		 */
		function createReadFileMock({ ok }) {
			/** @type {Array<string>} */
			const filesUrls = [];
			return {
				filesUrls,
				/** @type {(url: string) => Promise<Buffer>} */
				readFile: async (url) => {
					filesUrls.push(url);
					if (!ok) {
						throw 'fs error';
					}
					return Buffer.from('');
				},
			};
		}

		/**
		 *
		 * @param {{ ok: boolean }} param0
		 */
		function createFetchMock({ ok }) {
			/** @type {Array<string>} */
			const fetchUrls = [];
			return {
				fetchUrls,
				/** @type {(url: string) => Promise<Response>} */
				fetch: async (url) => {
					fetchUrls.push(url);
					// @ts-expect-error
					return {
						ok,
						status: ok ? 200 : 500,
						arrayBuffer: async () => new ArrayBuffer(),
					};
				},
			};
		}

		it('caches work', async () => {
			const { filesUrls, readFile } = createReadFileMock({ ok: true });
			const { fetchUrls, fetch } = createFetchMock({ ok: true });
			const storage = new SpyStorage();
			const fontFetcher = new CachedFontFetcher({
				storage,
				readFile,
				fetch,
			});

			await fontFetcher.fetch({ hash: 'abc', url: 'def', init: null });
			await fontFetcher.fetch({ hash: 'foo', url: 'bar', init: null });
			await fontFetcher.fetch({ hash: 'abc', url: 'def', init: null });

			assert.deepStrictEqual([...storage.store.keys()], ['abc', 'foo']);
			assert.deepStrictEqual(filesUrls, []);
			assert.deepStrictEqual(fetchUrls, ['def', 'bar']);
		});

		it('reads files if path is absolute', async () => {
			const { filesUrls, readFile } = createReadFileMock({ ok: true });
			const { fetchUrls, fetch } = createFetchMock({ ok: true });
			const storage = new SpyStorage();
			const fontFetcher = new CachedFontFetcher({
				storage,
				readFile,
				fetch,
			});

			await fontFetcher.fetch({ hash: 'abc', url: '/foo/bar', init: null });

			assert.deepStrictEqual(filesUrls, ['/foo/bar']);
			assert.deepStrictEqual(fetchUrls, []);
		});

		it('fetches files if path is not absolute', async () => {
			const { filesUrls, readFile } = createReadFileMock({ ok: true });
			const { fetchUrls, fetch } = createFetchMock({ ok: true });
			const storage = new SpyStorage();
			const fontFetcher = new CachedFontFetcher({
				storage,
				readFile,
				fetch,
			});

			await fontFetcher.fetch({ hash: 'abc', url: 'https://example.com', init: null });

			assert.deepStrictEqual(filesUrls, []);
			assert.deepStrictEqual(fetchUrls, ['https://example.com']);
		});

		it('throws the right error kind', async () => {
			const { readFile } = createReadFileMock({ ok: false });
			const { fetch } = createFetchMock({ ok: false });
			const storage = new SpyStorage();
			const fontFetcher = new CachedFontFetcher({
				storage,
				readFile,
				fetch,
			});

			let error = await fontFetcher
				.fetch({ hash: 'abc', url: '/foo/bar', init: null })
				.catch((err) => err);
			assert.equal(error instanceof Error, true);
			assert.equal(error.cause, 'fs error');

			error = await fontFetcher
				.fetch({ hash: 'abc', url: 'https://example.com', init: null })
				.catch((err) => err);
			assert.equal(error instanceof Error, true);
			assert.equal(error.cause instanceof Error, true);
			assert.equal(error.cause.message.includes('Response was not successful'), true);
		});
	});

	describe('CapsizeFontMetricsResolver', () => {
		describe('generateFontFace()', () => {
			it('returns a src', () => {
				const fontMetricsResolver = new CapsizeFontMetricsResolver({
					cssRenderer: new MinifiableCssRenderer({ minify: true }),
					fontFetcher: {
						async fetch() {
							return Buffer.from('');
						},
					},
				});

				const css = fontMetricsResolver.generateFontFace({
					name: 'Roboto-xxx fallback: Arial',
					font: 'Arial',
					metrics: {
						ascent: 1,
						descent: 1,
						lineGap: 1,
						unitsPerEm: 1,
						xWidthAvg: 1,
					},
					fallbackMetrics: {
						ascent: 1,
						descent: 1,
						lineGap: 1,
						unitsPerEm: 1,
						xWidthAvg: 1,
					},
					properties: {
						src: undefined,
					},
				});

				assert.equal(css.includes('src:local("Arial")'), true);
			});
		});
	});

	it('RealFontTypeExtractor', () => {
		/** @type {Array<[string, false | string]>} */
		const data = [
			['', false],
			['.', false],
			['test.', false],
			['https://foo.bar/file', false],
			[
				'https://fonts.gstatic.com/s/roboto/v47/KFO5CnqEu92Fr1Mu53ZEC9_Vu3r1gIhOszmkC3kaSTbQWt4N.woff2',
				'woff2',
			],
			['/home/documents/project/font.ttf', 'ttf'],
		];

		const fontTypeExtractor = new RealFontTypeExtractor();

		for (const [input, check] of data) {
			try {
				const res = fontTypeExtractor.extract(input);
				if (check) {
					assert.equal(res, check);
				} else {
					assert.fail(`String ${JSON.stringify(input)} should not be valid`);
				}
			} catch (e) {
				if (check) {
					assert.fail(`String ${JSON.stringify(input)} should be valid`);
				} else {
					assert.equal(e instanceof Error, true);
				}
			}
		}
	});

	describe('DevUrlResolver', () => {
		it('works', () => {
			const resolver = new DevUrlResolver({
				base: 'base/_astro/fonts',
				searchParams: new URLSearchParams(),
			});
			assert.deepStrictEqual(resolver.cspResources, []);
			assert.equal(resolver.resolve('xxx.woff2'), '/base/_astro/fonts/xxx.woff2');
			assert.deepStrictEqual(resolver.cspResources, ["'self'"]);
		});

		it('works with searchParams', () => {
			const resolver = new DevUrlResolver({
				base: 'base/_astro/fonts',
				searchParams: new URLSearchParams([['v', '1.0']]),
			});
			assert.equal(resolver.resolve('xxx.woff2'), '/base/_astro/fonts/xxx.woff2?v=1.0');
		});
	});

	describe('BuildUrlResolver', () => {
		const base = 'foo/_custom/fonts';

		it('works with no assetsPrefix', () => {
			const resolver = new BuildUrlResolver({
				base,
				assetsPrefix: undefined,
				searchParams: new URLSearchParams(),
			});
			assert.deepStrictEqual(resolver.cspResources, []);
			assert.equal(resolver.resolve('abc.ttf'), '/foo/_custom/fonts/abc.ttf');
			assert.deepStrictEqual(resolver.cspResources, ["'self'"]);
		});

		it('works with assetsPrefix as string', () => {
			const resolver = new BuildUrlResolver({
				base,
				assetsPrefix: 'https://cdn.example.com',
				searchParams: new URLSearchParams(),
			});
			assert.deepStrictEqual(resolver.cspResources, []);
			assert.equal(
				resolver.resolve('foo.woff'),
				'https://cdn.example.com/foo/_custom/fonts/foo.woff',
			);
			assert.deepStrictEqual(resolver.cspResources, ['https://cdn.example.com']);
		});

		it('works with assetsPrefix object', () => {
			const resolver = new BuildUrlResolver({
				base,
				assetsPrefix: {
					woff2: 'https://fonts.cdn.example.com',
					fallback: 'https://cdn.example.com',
				},
				searchParams: new URLSearchParams(),
			});
			assert.deepStrictEqual(resolver.cspResources, []);
			assert.equal(
				resolver.resolve('bar.woff2'),
				'https://fonts.cdn.example.com/foo/_custom/fonts/bar.woff2',
			);
			assert.equal(
				resolver.resolve('xyz.ttf'),
				'https://cdn.example.com/foo/_custom/fonts/xyz.ttf',
			);
			assert.deepStrictEqual(resolver.cspResources, [
				'https://fonts.cdn.example.com',
				'https://cdn.example.com',
			]);
		});

		it('works with searchParams', () => {
			const resolver = new BuildUrlResolver({
				base,
				assetsPrefix: undefined,
				searchParams: new URLSearchParams([['v', '2.0']]),
			});
			assert.equal(resolver.resolve('test.woff2'), '/foo/_custom/fonts/test.woff2?v=2.0');
		});
	});

	it('BuildUrlProxyHashResolver', () => {
		const resolver = new BuildUrlProxyHashResolver({
			hasher: new FakeHasher(),
			contentResolver: {
				resolve: (url) => url,
			},
		});
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: {
					weight: undefined,
					style: undefined,
					subset: undefined,
				},
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'whatever.woff2',
		);
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: { weight: 400, style: 'italic', subset: 'latin' },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'whatever.woff2',
		);
	});

	it('DevUrlProxyHashResolver', () => {
		const resolver = new DevUrlProxyHashResolver({
			hasher: new FakeHasher(),
			contentResolver: {
				resolve: (url) => url,
			},
		});
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: {
					weight: undefined,
					style: undefined,
					subset: undefined,
				},
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-whatever.woff2',
		);
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: { weight: 400, style: 'italic', subset: 'latin' },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-400-italic-latin-whatever.woff2',
		);
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: { weight: '500', style: 'italic', subset: 'latin-ext' },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-500-italic-latin-ext-whatever.woff2',
		);
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: { weight: [100, 900], style: 'italic', subset: 'cyrillic' },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-100-900-italic-cyrillic-whatever.woff2',
		);
		assert.equal(
			resolver.resolve({
				cssVariable: '--foo',
				data: { weight: '200 700', style: 'italic', subset: 'cyrillic' },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-200-700-italic-cyrillic-whatever.woff2',
		);
	});
});

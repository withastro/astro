// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { defineFontProvider } from 'unifont';
import { BuildFontFileIdGenerator } from '../../../../dist/assets/fonts/infra/build-font-file-id-generator.js';
import { BuildUrlResolver } from '../../../../dist/assets/fonts/infra/build-url-resolver.js';
import { CachedFontFetcher } from '../../../../dist/assets/fonts/infra/cached-font-fetcher.js';
import { CapsizeFontMetricsResolver } from '../../../../dist/assets/fonts/infra/capsize-font-metrics-resolver.js';
import { DevFontFileIdGenerator } from '../../../../dist/assets/fonts/infra/dev-font-file-id-generator.js';
import { DevUrlResolver } from '../../../../dist/assets/fonts/infra/dev-url-resolver.js';
import { FsFontFileContentResolver } from '../../../../dist/assets/fonts/infra/fs-font-file-content-resolver.js';
import {
	handleValueWithSpaces,
	MinifiableCssRenderer,
	renderCssVariable,
	renderFontFace,
	withFamily,
} from '../../../../dist/assets/fonts/infra/minifiable-css-renderer.js';
import { NodeFontTypeExtractor } from '../../../../dist/assets/fonts/infra/node-font-type-extractor.js';
import { UnifontFontResolver } from '../../../../dist/assets/fonts/infra/unifont-font-resolver.js';
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

			await fontFetcher.fetch({ id: 'abc', url: 'def', init: undefined });
			await fontFetcher.fetch({ id: 'foo', url: 'bar', init: undefined });
			await fontFetcher.fetch({ id: 'abc', url: 'def', init: undefined });

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

			await fontFetcher.fetch({ id: 'abc', url: '/foo/bar', init: undefined });

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

			await fontFetcher.fetch({ id: 'abc', url: 'https://example.com', init: undefined });

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
				.fetch({ id: 'abc', url: '/foo/bar', init: undefined })
				.catch((err) => err);
			assert.equal(error instanceof Error, true);
			assert.equal(error.cause, 'fs error');

			error = await fontFetcher
				.fetch({ id: 'abc', url: 'https://example.com', init: undefined })
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

	it('NodeFontTypeExtractor', () => {
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

		const fontTypeExtractor = new NodeFontTypeExtractor();

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

	it('BuildFontFileIdGenerator', () => {
		const resolver = new BuildFontFileIdGenerator({
			hasher: new FakeHasher(),
			contentResolver: {
				resolve: (url) => url,
			},
		});
		assert.equal(
			resolver.generate({
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'whatever.woff2',
		);
		assert.equal(
			resolver.generate({
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'whatever.woff2',
		);
	});

	it('DevFontFileIdGenerator', () => {
		const resolver = new DevFontFileIdGenerator({
			hasher: new FakeHasher(),
			contentResolver: {
				resolve: (url) => url,
			},
		});
		assert.equal(
			resolver.generate({
				cssVariable: '--foo',
				font: { src: [] },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-whatever.woff2',
		);
		assert.equal(
			resolver.generate({
				cssVariable: '--foo',
				font: { weight: 400, style: 'italic', meta: { subset: 'latin' }, src: [] },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-400-italic-latin-whatever.woff2',
		);
		assert.equal(
			resolver.generate({
				cssVariable: '--foo',
				font: { weight: '500', style: 'italic', meta: { subset: 'latin-ext' }, src: [] },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-500-italic-latin-ext-whatever.woff2',
		);
		assert.equal(
			resolver.generate({
				cssVariable: '--foo',
				font: { weight: [100, 900], style: 'italic', meta: { subset: 'cyrillic' }, src: [] },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-100-900-italic-cyrillic-whatever.woff2',
		);
		assert.equal(
			resolver.generate({
				cssVariable: '--foo',
				font: { weight: '200 700', style: 'italic', meta: { subset: 'cyrillic' }, src: [] },
				originalUrl: 'whatever',
				type: 'woff2',
			}),
			'foo-200-700-italic-cyrillic-whatever.woff2',
		);
	});

	describe('UnifontFontResolver', () => {
		/**
		 * @param {string} name
		 * @param {any} [config]
		 * @returns {import('../../../../dist/index.js').FontProvider}
		 * */
		const createProvider = (name, config) => ({
			name,
			config,
			resolveFont: () => undefined,
		});

		describe('static extractUnifontProviders()', () => {
			it('deduplicates providers with no config', () => {
				const providers = UnifontFontResolver.extractUnifontProviders({
					hasher: new FakeHasher(),
					families: [
						{
							name: 'Foo',
							uniqueName: 'Foo-xxx',
							cssVariable: '--custom',
							provider: createProvider('test'),
						},
						{
							name: 'Bar',
							uniqueName: 'Bar-xxx',
							cssVariable: '--custom',
							provider: createProvider('test'),
						},
					],
					root: new URL(import.meta.url),
				});
				assert.equal(providers.length, 1);
			});

			it('deduplicates providers with the same config', () => {
				const providers = UnifontFontResolver.extractUnifontProviders({
					hasher: new FakeHasher(),
					families: [
						{
							name: 'Foo',
							uniqueName: 'Foo-xxx',
							cssVariable: '--custom',
							provider: createProvider('test', { x: 'y' }),
						},
						{
							name: 'Bar',
							uniqueName: 'Bar-xxx',
							cssVariable: '--custom',
							provider: createProvider('test', { x: 'y' }),
						},
					],
					root: new URL(import.meta.url),
				});
				assert.equal(providers.length, 1);
			});

			it('does not deduplicate providers with different configs', () => {
				const providers = UnifontFontResolver.extractUnifontProviders({
					hasher: new FakeHasher(),
					families: [
						{
							name: 'Foo',
							uniqueName: 'Foo-xxx',
							cssVariable: '--custom',
							provider: createProvider('test', { x: 'foo' }),
						},
						{
							name: 'Bar',
							uniqueName: 'Bar-xxx',
							cssVariable: '--custom',
							provider: createProvider('test', { x: 'bar' }),
						},
					],
					root: new URL(import.meta.url),
				});
				assert.equal(providers.length, 2);
			});
		});

		describe('static astroToUnifontProvider()', () => {
			it('works with a minimal provider', async () => {
				const providerFactory = UnifontFontResolver.astroToUnifontProvider(
					{
						name: 'test',
						resolveFont: () => ({
							fonts: [
								{
									src: [{ name: 'foo' }],
								},
							],
						}),
					},
					new URL(import.meta.url),
				);
				assert.equal(providerFactory._name, 'test');
				const provider = await providerFactory({ storage: new SpyStorage() });
				assert.deepStrictEqual(
					await provider?.resolveFont('', {
						formats: [],
						styles: [],
						subsets: [],
						weights: [],
					}),
					{
						fonts: [
							{
								src: [{ name: 'foo' }],
							},
						],
					},
				);
			});

			it('forwards the config', () => {
				const providerFactory = UnifontFontResolver.astroToUnifontProvider(
					{
						name: 'test',
						config: {
							foo: 'bar',
						},
						resolveFont: () => undefined,
					},
					new URL(import.meta.url),
				);
				assert.equal(providerFactory._name, 'test');
				assert.deepStrictEqual(providerFactory._options, {
					foo: 'bar',
				});
			});

			it('handles init()', async () => {
				let ran = false;

				const providerFactory = UnifontFontResolver.astroToUnifontProvider(
					{
						name: 'test',
						init: () => {
							ran = true;
						},
						resolveFont: () => undefined,
					},
					new URL(import.meta.url),
				);
				await providerFactory({ storage: new SpyStorage() });
				assert.equal(ran, true);
			});

			it('handles listFonts()', async () => {
				const providerFactory = UnifontFontResolver.astroToUnifontProvider(
					{
						name: 'test',
						resolveFont: () => undefined,
						listFonts: () => ['a', 'b', 'c'],
					},
					new URL(import.meta.url),
				);
				assert.equal(providerFactory._name, 'test');
				const provider = await providerFactory({ storage: new SpyStorage() });
				assert.deepStrictEqual(await provider?.listFonts?.(), ['a', 'b', 'c']);
			});

			it('handles unifont > astro > unifont', async () => {
				let ran = false;
				const unifontProvider = defineFontProvider('test', async () => {
					ran = true;
					return {
						resolveFont: () => ({
							fonts: [
								{
									src: [{ name: 'foo' }],
								},
							],
						}),
						listFonts: () => ['a', 'b', 'c'],
					};
				});
				/** @returns {import('../../../../dist/index.js').FontProvider} */
				const astroProvider = () => {
					const provider = unifontProvider();
					/** @type {import('unifont').InitializedProvider | undefined} */
					let initializedProvider;
					return {
						name: provider._name,
						async init(context) {
							initializedProvider = await provider(context);
						},
						async resolveFont({ familyName, ...rest }) {
							return await initializedProvider?.resolveFont(familyName, rest);
						},
						async listFonts() {
							return await initializedProvider?.listFonts?.();
						},
					};
				};

				const providerFactory = UnifontFontResolver.astroToUnifontProvider(
					astroProvider(),
					new URL(import.meta.url),
				);
				assert.equal(providerFactory._name, 'test');
				const provider = await providerFactory({ storage: new SpyStorage() });
				assert.equal(ran, true);
				assert.deepStrictEqual(
					await provider?.resolveFont('', {
						formats: [],
						styles: [],
						subsets: [],
						weights: [],
					}),
					{
						fonts: [
							{
								src: [{ name: 'foo' }],
							},
						],
					},
				);
				assert.deepStrictEqual(await provider?.listFonts?.(), ['a', 'b', 'c']);
			});
		});

		it('resolveFont() works', async () => {
			const fontResolver = await UnifontFontResolver.create({
				families: [
					{
						name: 'Foo',
						uniqueName: 'Foo-xxx',
						cssVariable: '--foo',
						provider: {
							name: 'foo',
							resolveFont: () => undefined,
						},
					},
					{
						name: 'Bar',
						uniqueName: 'Bar-xxx',
						cssVariable: '--bar',
						provider: {
							name: 'bar',
							resolveFont: () => ({
								fonts: [
									{
										src: [{ name: 'Bar' }],
									},
								],
							}),
						},
					},
				],
				hasher: new FakeHasher(),
				storage: new SpyStorage(),
				root: new URL(import.meta.url),
			});
			assert.deepStrictEqual(
				await fontResolver.resolveFont({
					familyName: 'Foo',
					provider: {
						name: 'foo',
						resolveFont: () => undefined,
					},
					weights: [],
					styles: [],
					subsets: [],
					formats: [],
					options: undefined,
				}),
				[],
			);
			assert.deepStrictEqual(
				await fontResolver.resolveFont({
					familyName: 'Bar',
					provider: {
						name: 'bar',
						resolveFont: () => undefined,
					},
					weights: [],
					styles: [],
					subsets: [],
					formats: [],
					options: undefined,
				}),
				[
					{
						src: [{ name: 'Bar' }],
					},
				],
			);
		});

		it('listFonts() works', async () => {
			const fontResolver = await UnifontFontResolver.create({
				families: [
					{
						name: 'Foo',
						uniqueName: 'Foo-xxx',
						cssVariable: '--foo',
						provider: {
							name: 'foo',
							resolveFont: () => undefined,
						},
					},
					{
						name: 'Bar',
						uniqueName: 'Bar-xxx',
						cssVariable: '--bar',
						provider: {
							name: 'bar',
							resolveFont: () => undefined,
							listFonts: () => ['a', 'b', 'c'],
						},
					},
				],
				hasher: new FakeHasher(),
				storage: new SpyStorage(),
				root: new URL(import.meta.url),
			});
			assert.deepStrictEqual(
				await fontResolver.listFonts({
					provider: {
						name: 'foo',
						resolveFont: () => undefined,
					},
				}),
				undefined,
			);
			assert.deepStrictEqual(
				await fontResolver.listFonts({
					provider: {
						name: 'bar',
						resolveFont: () => undefined,
					},
				}),
				['a', 'b', 'c'],
			);
		});
	});

	describe('FsFontFileContentResolver', () => {
		it('returns url as is when not absolute', () => {
			const url = 'https://example.com/foo.woff2';
			const fontFileIdContentResolver = new FsFontFileContentResolver({
				readFileSync: () => 'content',
			});
			assert.equal(fontFileIdContentResolver.resolve(url), url);
		});

		it('returns url and content when absolute', () => {
			const url = fileURLToPath(new URL(import.meta.url));
			const fontFileIdContentResolver = new FsFontFileContentResolver({
				readFileSync: () => 'content',
			});
			assert.equal(fontFileIdContentResolver.resolve(url), url + 'content');
		});
	});
});

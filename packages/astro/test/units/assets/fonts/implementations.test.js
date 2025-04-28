// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	handleValueWithSpaces,
	renderCssVariable,
	renderFontFace,
	withFamily,
} from '../../../../dist/assets/fonts/implementations/css-renderer.js';
import { createDataCollector } from '../../../../dist/assets/fonts/implementations/data-collector.js';
import { createAstroErrorHandler } from '../../../../dist/assets/fonts/implementations/error-handler.js';
import { createCachedFontFetcher } from '../../../../dist/assets/fonts/implementations/font-fetcher.js';
import { createFontTypeExtractor } from '../../../../dist/assets/fonts/implementations/font-type-extractor.js';
import { createSpyStorage, simpleErrorHandler } from './utils.js';

describe('fonts implementations', () => {
	describe('createMinifiableCssRenderer()', () => {
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

	it('createDataCollector()', () => {
		/** @type {Map<string, string>} */
		const map = new Map();
		/** @type {Array<import('../../../../dist/assets/fonts/types.js').PreloadData>} */
		const preloadData = [];
		/** @type {Array<import('../../../../dist/assets/fonts/logic/optimize-fallbacks.js').CollectedFontForMetrics>} */
		const collectedFonts = [];

		const dataCollector = createDataCollector({
			hasUrl: (hash) => map.has(hash),
			saveUrl: (hash, url) => {
				map.set(hash, url);
			},
			savePreload: (preload) => {
				preloadData.push(preload);
			},
			saveFontData: (collected) => {
				collectedFonts.push(collected);
			},
		});

		dataCollector.collect({ hash: 'xxx', originalUrl: 'abc', preload: null, data: {} });
		dataCollector.collect({
			hash: 'yyy',
			originalUrl: 'def',
			preload: { type: 'woff2', url: 'def' },
			data: {},
		});
		dataCollector.collect({ hash: 'xxx', originalUrl: 'abc', preload: null, data: {} });

		assert.deepStrictEqual(
			[...map.entries()],
			[
				['xxx', 'abc'],
				['yyy', 'def'],
			],
		);
		assert.deepStrictEqual(preloadData, [{ type: 'woff2', url: 'def' }]);
		assert.deepStrictEqual(collectedFonts, [
			{ hash: 'xxx', url: 'abc', data: {} },
			{ hash: 'yyy', url: 'def', data: {} },
			{ hash: 'xxx', url: 'abc', data: {} },
		]);
	});

	it('createAstroErrorHandler()', () => {
		const errorHandler = createAstroErrorHandler();
		assert.equal(
			errorHandler.handle({ type: 'cannot-extract-font-type', data: { url: '' }, cause: null })
				.name,
			'CannotExtractFontType',
		);
		assert.equal(
			errorHandler.handle({ type: 'cannot-fetch-font-file', data: { url: '' }, cause: null }).name,
			'CannotFetchFontFile',
		);
		assert.equal(
			errorHandler.handle({
				type: 'cannot-load-font-provider',
				data: { entrypoint: '' },
				cause: null,
			}).name,
			'CannotLoadFontProvider',
		);
		assert.equal(
			errorHandler.handle({ type: 'unknown-fs-error', data: {}, cause: null }).name,
			'UnknownFilesystemError',
		);

		assert.equal(
			errorHandler.handle({
				type: 'cannot-extract-font-type',
				data: { url: '' },
				cause: 'whatever',
			}).cause,
			'whatever',
		);
	});

	describe('createCachedFontFetcher()', () => {
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
			const { storage, store } = createSpyStorage();
			const fontFetcher = createCachedFontFetcher({
				storage,
				errorHandler: simpleErrorHandler,
				readFile,
				fetch,
			});

			await fontFetcher.fetch('abc', 'def');
			await fontFetcher.fetch('foo', 'bar');
			await fontFetcher.fetch('abc', 'def');

			assert.deepStrictEqual([...store.keys()], ['abc', 'foo']);
			assert.deepStrictEqual(filesUrls, []);
			assert.deepStrictEqual(fetchUrls, ['def', 'bar']);
		});

		it('reads files if path is absolute', async () => {
			const { filesUrls, readFile } = createReadFileMock({ ok: true });
			const { fetchUrls, fetch } = createFetchMock({ ok: true });
			const { storage } = createSpyStorage();
			const fontFetcher = createCachedFontFetcher({
				storage,
				errorHandler: simpleErrorHandler,
				readFile,
				fetch,
			});

			await fontFetcher.fetch('abc', '/foo/bar');

			assert.deepStrictEqual(filesUrls, ['/foo/bar']);
			assert.deepStrictEqual(fetchUrls, []);
		});

		it('fetches files if path is not absolute', async () => {
			const { filesUrls, readFile } = createReadFileMock({ ok: true });
			const { fetchUrls, fetch } = createFetchMock({ ok: true });
			const { storage } = createSpyStorage();
			const fontFetcher = createCachedFontFetcher({
				storage,
				errorHandler: simpleErrorHandler,
				readFile,
				fetch,
			});

			await fontFetcher.fetch('abc', 'https://example.com');

			assert.deepStrictEqual(filesUrls, []);
			assert.deepStrictEqual(fetchUrls, ['https://example.com']);
		});

		it('throws the right error kind', async () => {
			const { readFile } = createReadFileMock({ ok: false });
			const { fetch } = createFetchMock({ ok: false });
			const { storage } = createSpyStorage();
			const fontFetcher = createCachedFontFetcher({
				storage,
				errorHandler: simpleErrorHandler,
				readFile,
				fetch,
			});

			let error = await fontFetcher.fetch('abc', '/foo/bar').catch((err) => err);
			assert.equal(error instanceof Error, true);
			assert.equal(error.message, 'cannot-fetch-font-file');
			assert.equal(error.cause, 'fs error');

			error = await fontFetcher.fetch('abc', 'https://example.com').catch((err) => err);
			assert.equal(error instanceof Error, true);
			assert.equal(error.message, 'cannot-fetch-font-file');
			assert.equal(error.cause instanceof Error, true);
			assert.equal(error.cause.message.includes('Response was not successful'), true);
		});
	});

	// TODO: find a good way to test this
	// describe('createCapsizeFontMetricsResolver()', () => {});

	it('createFontTypeExtractor()', () => {
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

		const fontTypeExtractor = createFontTypeExtractor({ errorHandler: simpleErrorHandler });

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
});

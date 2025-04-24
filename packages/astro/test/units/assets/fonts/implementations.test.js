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

describe('astro fonts implementations', () => {
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

	// TODO: cover more implementations
});

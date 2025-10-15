// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createFontaceFontFileReader } from '../../../../dist/assets/fonts/implementations/font-file-reader.js';
import { createFontTypeExtractor } from '../../../../dist/assets/fonts/implementations/font-type-extractor.js';
import * as adobeEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/adobe.js';
import * as bunnyEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/bunny.js';
import * as fontshareEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontshare.js';
import * as fontsourceEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/fontsource.js';
import * as googleEntrypoint from '../../../../dist/assets/fonts/providers/entrypoints/google.js';
import { resolveLocalFont } from '../../../../dist/assets/fonts/providers/local.js';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { createSpyUrlProxy, simpleErrorHandler } from './utils.js';

describe('fonts providers', () => {
	describe('config objects', () => {
		it('references the right entrypoints', () => {
			assert.equal(
				fontProviders.adobe({ id: '' }).entrypoint,
				'astro/assets/fonts/providers/adobe',
			);
			assert.equal(fontProviders.bunny().entrypoint, 'astro/assets/fonts/providers/bunny');
			assert.equal(fontProviders.fontshare().entrypoint, 'astro/assets/fonts/providers/fontshare');
			assert.equal(
				fontProviders.fontsource().entrypoint,
				'astro/assets/fonts/providers/fontsource',
			);
			assert.equal(fontProviders.google().entrypoint, 'astro/assets/fonts/providers/google');
		});

		it('forwards the config', () => {
			assert.deepStrictEqual(fontProviders.adobe({ id: 'foo' }).config, {
				id: 'foo',
			});
		});
	});

	it('providers are correctly exported', () => {
		assert.equal(
			'provider' in adobeEntrypoint && typeof adobeEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in bunnyEntrypoint && typeof bunnyEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in fontshareEntrypoint && typeof fontshareEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in fontsourceEntrypoint && typeof fontsourceEntrypoint.provider === 'function',
			true,
		);
		assert.equal(
			'provider' in googleEntrypoint && typeof googleEntrypoint.provider === 'function',
			true,
		);
	});

	describe('resolveLocalFont()', () => {
		const fontTypeExtractor = createFontTypeExtractor({ errorHandler: simpleErrorHandler });

		it('proxies URLs correctly', () => {
			const { collected, urlProxy } = createSpyUrlProxy();
			resolveLocalFont({
				urlProxy,
				fontTypeExtractor,
				family: {
					name: 'Test',
					nameWithHash: 'Test-xxx',
					cssVariable: '--test',
					provider: 'local',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: '/test.woff2' }, { url: '/ignored.woff' }],
						},
						{
							weight: '500',
							style: 'normal',
							src: [{ url: '/2.woff2' }],
						},
					],
				},
				fontFileReader: createFontaceFontFileReader({ errorHandler: simpleErrorHandler }),
			});
			assert.deepStrictEqual(collected, [
				{
					url: '/test.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/2.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});

		it('collect preloads correctly', () => {
			const { collected, urlProxy } = createSpyUrlProxy();
			resolveLocalFont({
				urlProxy,
				fontTypeExtractor,
				family: {
					name: 'Test',
					nameWithHash: 'Test-xxx',
					cssVariable: '--test',
					provider: 'local',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: '/test.woff2' }, { url: '/ignored.woff' }],
						},
						{
							weight: '500',
							style: 'normal',
							src: [{ url: '/2.woff2' }, { url: '/also-ignored.woff' }],
						},
					],
				},
				fontFileReader: createFontaceFontFileReader({ errorHandler: simpleErrorHandler }),
			});
			assert.deepStrictEqual(collected, [
				{
					url: '/test.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '400', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/2.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
				{
					url: '/also-ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '500', style: 'normal', subset: undefined },
					init: null,
				},
			]);
		});

		it('computes the format correctly', () => {
			const { urlProxy } = createSpyUrlProxy();
			const { fonts } = resolveLocalFont({
				urlProxy,
				fontTypeExtractor,
				fontFileReader: createFontaceFontFileReader({ errorHandler: simpleErrorHandler }),
				family: {
					name: 'Test',
					nameWithHash: 'Test-xxx',
					cssVariable: '--test',
					provider: 'local',
					variants: [
						{
							weight: '400',
							style: 'normal',
							src: [{ url: '/test.woff2' }, { url: '/ignored.ttf' }],
						},
					],
				},
			});
			assert.deepStrictEqual(fonts, [
				{
					display: undefined,
					featureSettings: undefined,
					src: [
						{
							format: 'woff2',
							originalURL: '/test.woff2',
							tech: undefined,
							url: '/test.woff2',
						},
						{
							format: 'truetype',
							originalURL: '/ignored.ttf',
							tech: undefined,
							url: '/ignored.ttf',
						},
					],
					stretch: undefined,
					style: 'normal',
					unicodeRange: undefined,
					variationSettings: undefined,
					weight: '400',
				},
			]);
		});

		describe('properties inference', () => {
			it('infers properties correctly', async () => {
				const { collected, urlProxy } = createSpyUrlProxy();
				const { fonts } = resolveLocalFont({
					urlProxy,
					fontTypeExtractor,
					family: {
						name: 'Test',
						nameWithHash: 'Test-xxx',
						cssVariable: '--test',
						provider: 'local',
						variants: [
							{
								src: [{ url: '/test.woff2' }],
							},
						],
					},
					fontFileReader: {
						extract() {
							return {
								weight: '300',
								style: 'italic',
							};
						},
					},
				});

				assert.deepStrictEqual(fonts, [
					{
						display: undefined,
						featureSettings: undefined,
						src: [
							{
								format: 'woff2',
								originalURL: '/test.woff2',
								tech: undefined,
								url: '/test.woff2',
							},
						],
						stretch: undefined,
						style: 'italic',
						unicodeRange: undefined,
						variationSettings: undefined,
						weight: '300',
					},
				]);
				assert.deepStrictEqual(collected, [
					{
						url: '/test.woff2',
						collectPreload: true,
						type: 'woff2',
						data: { weight: '300', style: 'italic', subset: undefined },
						init: null,
					},
				]);
			});

			it('respects what property should be inferred', async () => {
				const { collected, urlProxy } = createSpyUrlProxy();
				const { fonts } = resolveLocalFont({
					urlProxy,
					fontTypeExtractor,
					family: {
						name: 'Test',
						nameWithHash: 'Test-xxx',
						cssVariable: '--test',
						provider: 'local',
						variants: [
							{
								style: 'normal',
								unicodeRange: ['bar'],
								src: [{ url: '/test.woff2' }],
							},
						],
					},
					fontFileReader: {
						extract() {
							return {
								weight: '300',
								style: 'italic',
								unicodeRange: ['foo'],
							};
						},
					},
				});

				assert.deepStrictEqual(fonts, [
					{
						display: undefined,
						featureSettings: undefined,
						src: [
							{
								format: 'woff2',
								originalURL: '/test.woff2',
								tech: undefined,
								url: '/test.woff2',
							},
						],
						stretch: undefined,
						style: 'normal',
						unicodeRange: ['bar'],
						variationSettings: undefined,
						weight: '300',
					},
				]);
				assert.deepStrictEqual(collected, [
					{
						url: '/test.woff2',
						collectPreload: true,
						type: 'woff2',
						data: { weight: '300', style: 'normal', subset: undefined },
						init: null,
					},
				]);
			});
		});
	});
});

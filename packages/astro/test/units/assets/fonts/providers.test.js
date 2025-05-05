// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
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
			});
			assert.deepStrictEqual(collected, [
				{
					url: '/test.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal' },
					init: null,
				},
				{
					url: '/ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '400', style: 'normal' },
					init: null,
				},
				{
					url: '/2.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal' },
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
			});
			assert.deepStrictEqual(collected, [
				{
					url: '/test.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '400', style: 'normal' },
					init: null,
				},
				{
					url: '/ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '400', style: 'normal' },
					init: null,
				},
				{
					url: '/2.woff2',
					type: 'woff2',
					collectPreload: true,
					data: { weight: '500', style: 'normal' },
					init: null,
				},
				{
					url: '/also-ignored.woff',
					type: 'woff',
					collectPreload: false,
					data: { weight: '500', style: 'normal' },
					init: null,
				},
			]);
		});

		it('computes the format correctly', () => {
			const { urlProxy } = createSpyUrlProxy();
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
	});
});

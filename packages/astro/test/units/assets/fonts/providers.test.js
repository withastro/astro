// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RealFontTypeExtractor } from '../../../../dist/assets/fonts/infra/font-type-extractor.js';
import { FontaceFontFileReader } from '../../../../dist/assets/fonts/infra/fontace-font-file-reader.js';
import { resolveLocalFont } from '../../../../dist/assets/fonts/providers/local.js';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import { SpyUrlProxy } from './utils.js';

describe('fonts providers', () => {
	describe('config objects', () => {
		it('references the right names', () => {
			assert.equal(fontProviders.adobe({ id: '' }).name, 'adobe');
			assert.equal(fontProviders.bunny().name, 'bunny');
			assert.equal(fontProviders.fontshare().name, 'fontshare');
			assert.equal(fontProviders.fontsource().name, 'fontsource');
			assert.equal(fontProviders.google().name, 'google');
		});

		it('forwards the config', () => {
			assert.deepStrictEqual(fontProviders.adobe({ id: 'foo' }).config, {
				id: 'foo',
			});
		});
	});

	describe('resolveLocalFont()', () => {
		const fontTypeExtractor = new RealFontTypeExtractor();

		it('proxies URLs correctly', () => {
			const urlProxy = new SpyUrlProxy();
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
				fontFileReader: new FontaceFontFileReader(),
			});
			assert.deepStrictEqual(urlProxy.collected, [
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
			const urlProxy = new SpyUrlProxy();
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
				fontFileReader: new FontaceFontFileReader(),
			});
			assert.deepStrictEqual(urlProxy.collected, [
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
			const urlProxy = new SpyUrlProxy();
			const fonts = resolveLocalFont({
				urlProxy,
				fontTypeExtractor,
				fontFileReader: new FontaceFontFileReader(),
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
				const urlProxy = new SpyUrlProxy();
				const fonts = resolveLocalFont({
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
				assert.deepStrictEqual(urlProxy.collected, [
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
				const urlProxy = new SpyUrlProxy();
				const fonts = resolveLocalFont({
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
				assert.deepStrictEqual(urlProxy.collected, [
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

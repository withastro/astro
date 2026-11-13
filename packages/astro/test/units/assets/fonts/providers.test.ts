import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { LocalFontProvider } from '../../../../dist/assets/fonts/providers/local.js';
import { fontProviders } from '../../../../dist/config/entrypoint.js';
import type { FontProviderInitContext } from '../../../../dist/assets/fonts/types.js';
import { createFixture } from '../../test-utils.ts';

describe('fonts providers', () => {
	describe('config objects', () => {
		it('references the right names', () => {
			assert.equal(fontProviders.adobe({ id: '' }).name, 'adobe');
			assert.equal(fontProviders.bunny().name, 'bunny');
			assert.equal(fontProviders.fontshare().name, 'fontshare');
			assert.equal(fontProviders.fontsource().name, 'fontsource');
			assert.equal(fontProviders.google().name, 'google');
			assert.equal(fontProviders.googleicons().name, 'googleicons');
			assert.equal(fontProviders.npm().name, 'npm');
			assert.equal(fontProviders.local().name, 'local');
		});

		it('forwards the config', () => {
			assert.deepStrictEqual(fontProviders.adobe({ id: 'foo' }).config, {
				id: 'foo',
			});
		});
	});

	describe('npm', () => {
		it('resolves installed font files to absolute paths with remote: false', async () => {
			const fixture = await createFixture({
				'package.json': JSON.stringify({ dependencies: { '@fontsource/foo': '1.0.0' } }),
				'node_modules/@fontsource/foo/package.json': JSON.stringify({ version: '1.0.0' }),
				'node_modules/@fontsource/foo/index.css':
					"@font-face{font-family:'Foo';font-style:normal;font-weight:400;src:url(./files/foo-latin-400-normal.woff2) format('woff2');}",
				'node_modules/@fontsource/foo/files/foo-latin-400-normal.woff2': '',
			});
			try {
				const provider = fontProviders.npm({ remote: false });
				const storage: FontProviderInitContext['storage'] = {
					getItem: async (_key: string, init?: () => unknown) => (await init?.()) ?? null,
					setItem: async () => {},
				};
				await provider.init?.({
					storage,
					root: pathToFileURL(`${fixture.path}/`),
					fetch: async (url) => {
						throw new Error(`Unexpected request to ${url}`);
					},
				});
				const result = await provider.resolveFont({
					familyName: 'Foo',
					formats: ['woff2'],
					weights: ['400'],
					styles: ['normal'],
					subsets: [],
					options: undefined,
				});
				assert.deepStrictEqual(
					result?.fonts.flatMap((font) => font.src.map((source) => 'url' in source && source.url)),
					[fixture.getPath('node_modules/@fontsource/foo/files/foo-latin-400-normal.woff2')],
				);
			} finally {
				await fixture.rm();
			}
		});
	});

	describe('LocalFontProvider', () => {
		it('handles no options', () => {
			const provider = new LocalFontProvider({
				fontFileReader: {
					extract: () => ({ weight: '400', style: 'normal' }),
				},
			});
			const { fonts } = provider.resolveFont({
				familyName: 'foo',
				formats: [],
				weights: [],
				styles: [],
				subsets: [],
				options: undefined,
			});
			assert.deepStrictEqual(fonts, []);
		});

		it('resolves URLs', () => {
			const provider = new LocalFontProvider({
				fontFileReader: {
					extract: () => ({ weight: '400', style: 'normal' }),
				},
			});
			const root = new URL(import.meta.url);
			provider.init({ root });
			const { fonts } = provider.resolveFont({
				familyName: 'foo',
				formats: [],
				weights: [],
				styles: [],
				subsets: [],
				options: {
					variants: [
						{
							src: [
								'./0.woff2',
								new URL('./1.woff2', root),
								{
									url: './0.woff2',
									tech: 'xxx',
								},
								{
									url: new URL('./1.woff2', root),
								},
							],
							weight: '700',
							style: 'italic',
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
							tech: undefined,
							url: fileURLToPath(new URL('./0.woff2', root)),
						},
						{
							tech: undefined,
							url: fileURLToPath(new URL('./1.woff2', root)),
						},
						{
							tech: 'xxx',
							url: fileURLToPath(new URL('./0.woff2', root)),
						},
						{
							tech: undefined,
							url: fileURLToPath(new URL('./1.woff2', root)),
						},
					],
					stretch: undefined,
					style: 'italic',
					unicodeRange: undefined,
					variationSettings: undefined,
					weight: '700',
				},
			]);
		});

		it('properties inference', () => {
			const provider = new LocalFontProvider({
				fontFileReader: {
					extract: () => ({ weight: '400', style: 'normal' }),
				},
			});
			const root = new URL(import.meta.url);
			provider.init({ root });
			const { fonts } = provider.resolveFont({
				familyName: 'foo',
				formats: [],
				weights: [],
				styles: [],
				subsets: [],
				options: {
					variants: [
						{
							src: ['./0.woff2'],
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
							tech: undefined,
							url: fileURLToPath(new URL('./0.woff2', root)),
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

		it('respects what property should be inferred', () => {
			const provider = new LocalFontProvider({
				fontFileReader: {
					extract: () => ({ weight: '400', style: 'normal' }),
				},
			});
			const root = new URL(import.meta.url);
			provider.init({ root });
			const { fonts } = provider.resolveFont({
				familyName: 'foo',
				formats: [],
				weights: [],
				styles: [],
				subsets: [],
				options: {
					variants: [
						{
							src: ['./0.woff2'],
							style: 'italic',
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
							tech: undefined,
							url: fileURLToPath(new URL('./0.woff2', root)),
						},
					],
					stretch: undefined,
					style: 'italic',
					unicodeRange: undefined,
					variationSettings: undefined,
					weight: '400',
				},
			]);
		});
	});
});

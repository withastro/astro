// @ts-check
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';
import { LocalFontProvider } from '../../../../dist/assets/fonts/providers/local.js';
import { fontProviders } from '../../../../dist/config/entrypoint.js';

describe('fonts providers', () => {
	describe('config objects', () => {
		it('references the right names', () => {
			assert.equal(fontProviders.adobe({ id: '' }).name, 'adobe');
			assert.equal(fontProviders.bunny().name, 'bunny');
			assert.equal(fontProviders.fontshare().name, 'fontshare');
			assert.equal(fontProviders.fontsource().name, 'fontsource');
			assert.equal(fontProviders.google().name, 'google');
			assert.equal(fontProviders.googleicons().name, 'googleicons');
			assert.equal(fontProviders.local().name, 'local');
		});

		it('forwards the config', () => {
			assert.deepStrictEqual(fontProviders.adobe({ id: 'foo' }).config, {
				id: 'foo',
			});
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

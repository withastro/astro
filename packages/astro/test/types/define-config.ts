import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { GoogleFamilyOptions, GoogleiconsFamilyOptions } from 'unifont';
import type { LocalFamilyOptions } from '../../dist/assets/fonts/providers/local.js';
import type { FontFamily, FontProvider } from '../../dist/assets/fonts/types.js';
import { defineConfig, fontProviders } from '../../dist/config/entrypoint.js';
import type { AstroUserConfig } from '../../dist/types/public/index.js';

function assertType<T>(data: T, cb: (data: NoInfer<T>) => void) {
	cb(data);
}

describe('defineConfig()', () => {
	it('Infers i18n generics correctly', () => {
		assertType(defineConfig({}), (config) => {
			expectTypeOf(config).toEqualTypeOf<AstroUserConfig<never, never, never>>();
			expectTypeOf(config.i18n!.defaultLocale).toEqualTypeOf<string>();
		});

		assertType(
			defineConfig({
				i18n: {
					locales: ['en'],
					defaultLocale: 'en',
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<AstroUserConfig<['en'], never, never>>();
				expectTypeOf(config.i18n!.defaultLocale).toEqualTypeOf<'en'>();
			},
		);

		assertType(
			defineConfig({
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'fr',
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<AstroUserConfig<['en', 'fr'], never, never>>();
				expectTypeOf(config.i18n!.defaultLocale).toEqualTypeOf<'en' | 'fr'>();
			},
		);

		assertType(
			defineConfig({
				i18n: {
					locales: ['en', { path: 'french', codes: ['fr', 'fr-FR'] }],
					defaultLocale: 'en',
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<
					AstroUserConfig<
						['en', { readonly path: 'french'; readonly codes: ['fr', 'fr-FR'] }],
						never,
						never
					>
				>();
				expectTypeOf(config.i18n!.defaultLocale).toEqualTypeOf<'en' | 'fr' | 'fr-FR'>();
			},
		);
	});

	it('Validates CSP hashes', () => {
		defineConfig({
			experimental: {
				csp: {
					scriptDirective: {
						hashes: ['sha256-xx', 'sha384-xx', 'sha512-xx'],
					},
					styleDirective: {
						hashes: ['sha256-xx', 'sha384-xx', 'sha512-xx'],
					},
				},
			},
		});
	});

	it('Infers font families correctly', () => {
		assertType(defineConfig({}), (config) => {
			expectTypeOf(config).toEqualTypeOf<AstroUserConfig<never, never, never>>();
			expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<Array<FontFamily>>();
		});

		assertType(
			defineConfig({
				experimental: {
					fonts: [
						{
							name: 'A',
							cssVariable: '--font-a',
							provider: fontProviders.local(),
							options: {
								variants: [{ src: [''] }],
							},
						},
						{
							name: 'B',
							cssVariable: '--font-b',
							provider: fontProviders.bunny(),
							options: undefined,
						},
						{
							name: 'C',
							cssVariable: '--font-c',
							provider: fontProviders.google(),
							options: {
								experimental: {
									glyphs: ['a'],
								},
							},
						},
						{
							name: 'D',
							cssVariable: '--font-d',
							provider: fontProviders.googleicons(),
							options: {
								experimental: {
									glyphs: ['a'],
								},
							},
						},
					],
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<
					AstroUserConfig<
						never,
						never,
						[
							FontProvider<LocalFamilyOptions>,
							FontProvider<never>,
							FontProvider<GoogleFamilyOptions | undefined>,
							FontProvider<GoogleiconsFamilyOptions | undefined>,
						]
					>
				>();
			},
		);
	});

	describe('it handles required/optional font provider options', () => {
		defineConfig({
			experimental: {
				fonts: [
					{
						name: 'A',
						cssVariable: '--font-a',
						provider: fontProviders.local(),
						options: {
							variants: [{ src: [''] }],
						},
					},
					{
						name: 'B',
						cssVariable: '--font-b',
						provider: {} as FontProvider<never>,
					},
					{
						name: 'C',
						cssVariable: '--font-c',
						provider: {} as FontProvider<never>,
						options: undefined,
					},
					{
						name: 'D',
						cssVariable: '--font-d',
						provider: {} as FontProvider<{ foo?: string } | undefined>,
					},
					{
						name: 'E',
						cssVariable: '--font-e',
						provider: {} as FontProvider<{ foo?: string } | undefined>,
						options: undefined,
					},
					{
						name: 'F',
						cssVariable: '--font-f',
						provider: {} as FontProvider<{ foo?: string } | undefined>,
						options: {
							foo: 'bar',
						},
					},
					// @ts-expect-error options is required
					{
						name: 'G',
						cssVariable: '--font-g',
						provider: {} as FontProvider<{ foo?: string }>,
					},
					{
						name: 'H',
						cssVariable: '--font-h',
						provider: {} as FontProvider<{ foo?: string }>,
						options: {
							foo: 'bar',
						},
					},
				],
			},
		});
	});
});

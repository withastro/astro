import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { AstroFontProvider, FontFamily } from '../../dist/assets/fonts/types.js';
import { defineAstroFontProvider, fontProviders } from '../../dist/config/entrypoint.js';
import { defineConfig } from '../../dist/config/index.js';
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

	it('Infers fonts generics correctly', () => {
		assertType(defineConfig({}), (config) => {
			expectTypeOf(config).toEqualTypeOf<AstroUserConfig<never, never, never>>();
			expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<FontFamily[]>();
		});

		assertType(
			defineConfig({
				experimental: {
					fonts: [],
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<AstroUserConfig<never, never, []>>();
				expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<[]>();
			},
		);

		const provider = defineAstroFontProvider({ entrypoint: '' });

		assertType(
			defineConfig({
				experimental: {
					fonts: [
						{
							name: 'bar',
							cssVariable: '--font-bar',
							provider: 'local',
							variants: [{ src: [''], weight: 400, style: 'normal' }],
						},
						{ name: 'baz', cssVariable: '--font-baz', provider },
					],
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<
					AstroUserConfig<
						never,
						never,
						[
							{
								readonly name: 'bar';
								readonly cssVariable: '--font-bar';
								readonly provider: 'local';
								readonly variants: [
									{ readonly src: ['']; readonly weight: 400; readonly style: 'normal' },
								];
							},
							{
								readonly name: 'baz';
								readonly cssVariable: '--font-baz';
								readonly provider: AstroFontProvider;
							},
						]
					>
				>();
				expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<
					[
						{
							readonly name: 'bar';
							readonly cssVariable: '--font-bar';
							readonly provider: 'local';
							readonly variants: [
								{ readonly src: ['']; readonly weight: 400; readonly style: 'normal' },
							];
						},
						{
							readonly name: 'baz';
							readonly cssVariable: '--font-baz';
							readonly provider: AstroFontProvider;
						},
					]
				>();
			},
		);
	});

	it('Allows disabling font fallbacks', () => {
		assertType(
			defineConfig({
				experimental: {
					fonts: [
						{
							provider: fontProviders.google(),
							name: 'Roboto',
							fallbacks: [],
							cssVariable: '--font-roboto',
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
							{
								readonly provider: {
									entrypoint: string | URL;
									config?: Record<string, any> | undefined;
								};
								readonly name: 'Roboto';
								readonly fallbacks: [];
								readonly cssVariable: '--font-roboto';
							},
						]
					>
				>();
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
});

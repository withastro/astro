import { describe, it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import { defineConfig } from '../../dist/config/index.js';
import type { AstroUserConfig } from '../../dist/types/public/index.js';
import type { BuiltInProvider, FontFamily, FontProvider } from '../../dist/assets/fonts/types.js';
import { fontProviders } from '../../dist/config/entrypoint.js';

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
			expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<
				FontFamily<BuiltInProvider | FontProvider<string>>[]
			>();
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

		assertType(
			defineConfig({
				experimental: {
					fonts: [
						{ name: 'foo', provider: 'google' },
						{ name: 'bar', provider: 'local', src: [] },
						{ name: 'baz', provider: fontProviders.fontsource() },
					],
				},
			}),
			(config) => {
				expectTypeOf(config).toEqualTypeOf<
					AstroUserConfig<
						never,
						never,
						[
							{ readonly name: 'foo'; readonly provider: 'google' },
							{ readonly name: 'bar'; readonly provider: 'local'; readonly src: [] },
							{ readonly name: 'baz'; readonly provider: FontProvider<'fontsource'> },
						]
					>
				>();
				expectTypeOf(config.experimental!.fonts!).toEqualTypeOf<
					[
						{ readonly name: 'foo'; readonly provider: 'google' },
						{ readonly name: 'bar'; readonly provider: 'local'; readonly src: [] },
						{ readonly name: 'baz'; readonly provider: FontProvider<'fontsource'> },
					]
				>();
			},
		);
	});
});

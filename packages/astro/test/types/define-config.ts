import { describe, it } from 'node:test';
import { defineConfig } from '../../dist/config/index.js';
import type { AstroUserDefineConfig } from '../../dist/types/public/config.js';
import { expectTypeOf } from 'expect-type';

describe('defineConfig()', () => {
	it('Infers generics correctly', () => {
		const config_0 = defineConfig({});
		expectTypeOf(config_0).toEqualTypeOf<AstroUserDefineConfig<never>>();
		expectTypeOf(config_0.i18n!.defaultLocale).toEqualTypeOf<string>();

		const config_1 = defineConfig({
			i18n: {
				locales: ['en'],
				defaultLocale: 'en',
			},
		});
		expectTypeOf(config_1).toEqualTypeOf<AstroUserDefineConfig<['en']>>();
		expectTypeOf(config_1.i18n!.defaultLocale).toEqualTypeOf<'en'>();

		const config_2 = defineConfig({
			i18n: {
				locales: ['en', 'fr'],
				defaultLocale: 'fr',
			},
		});
		expectTypeOf(config_2).toEqualTypeOf<AstroUserDefineConfig<['en', 'fr']>>();
		expectTypeOf(config_2.i18n!.defaultLocale).toEqualTypeOf<'en' | 'fr'>();

		const config_3 = defineConfig({
			i18n: {
				locales: ['en', { path: 'french', codes: ['fr', 'fr-FR'] }],
				defaultLocale: 'en',
			},
		});
		expectTypeOf(config_3).toEqualTypeOf<
			AstroUserDefineConfig<['en', { readonly path: 'french'; readonly codes: ['fr', 'fr-FR'] }]>
		>();
		expectTypeOf(config_3.i18n!.defaultLocale).toEqualTypeOf<'en' | 'fr' | 'fr-FR'>();
	});
});

import { describe, it } from 'node:test';
import { defineConfig } from '../../dist/config';
import type { AstroUserDefineConfig } from '../../dist/types/public/config';
import { expectTypeOf } from 'expect-type';

describe('defineConfig()', () => {
	it('Infers generics correctly', () => {
		expectTypeOf(defineConfig({})).toEqualTypeOf<AstroUserDefineConfig<never>>();

		expectTypeOf(
			defineConfig({
				i18n: {
					locales: ['en'],
					defaultLocale: 'en',
				},
			}),
		).toEqualTypeOf<AstroUserDefineConfig<['en']>>();

		expectTypeOf(
			defineConfig({
				i18n: {
					locales: ['en', 'fr'],
					defaultLocale: 'fr',
				},
			}),
		).toEqualTypeOf<AstroUserDefineConfig<['en', 'fr']>>();

		expectTypeOf(
			defineConfig({
				i18n: {
					locales: ['en', { path: 'french', codes: ['fr', 'fr-FR'] }],
					defaultLocale: 'en',
				},
			}),
		).toEqualTypeOf<
			AstroUserDefineConfig<['en', { readonly path: 'french'; readonly codes: ['fr', 'fr-FR'] }]>
		>();
	});
});

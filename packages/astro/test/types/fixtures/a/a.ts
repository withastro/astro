import './a-env.d.ts';
import '../../../../client.d.ts';
import { it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { APIContext } from '../../../../dist/types/public/context.js';

it('Astro features A', () => {
	expectTypeOf<APIContext['site']>().not.toBeNullable();
	expectTypeOf<APIContext['session']>().not.toBeNullable();
	expectTypeOf<APIContext['csp']>().not.toBeNullable();
	expectTypeOf<APIContext['currentLocale']>().toEqualTypeOf<'en' | 'fr'>();
	expectTypeOf<APIContext['preferredLocale']>().toEqualTypeOf<'en' | 'fr' | undefined>();
	expectTypeOf<APIContext['preferredLocaleList']>().toEqualTypeOf<Array<'en' | 'fr'>>();
	expectTypeOf<APIContext['routePattern']>().toEqualTypeOf<'foo' | 'bar'>();

	expectTypeOf<typeof import('astro:config/server')['i18n']>().not.toBeNullable();
	expectTypeOf<
		typeof import('astro:config/server')['i18n']['defaultLocale']
	>().toEqualTypeOf<'en'>();
	expectTypeOf<typeof import('astro:config/server')['site']>().not.toBeNullable();

	expectTypeOf<typeof import('astro:config/client')['i18n']>().not.toBeNullable();
	expectTypeOf<
		typeof import('astro:config/client')['i18n']['defaultLocale']
	>().toEqualTypeOf<'en'>();
	expectTypeOf<typeof import('astro:config/client')['site']>().not.toBeNullable();
});

import './b-env.d.ts';
import '../../../../client.d.ts';
import { it } from 'node:test';
import { expectTypeOf } from 'expect-type';
import type { APIContext } from '../../../../dist/types/public/context.js';

it('Astro features B', () => {
	expectTypeOf<APIContext['site']>().toBeNullable();
	expectTypeOf<APIContext['session']>().toBeNullable();
	expectTypeOf<APIContext['csp']>().toBeNullable();
	expectTypeOf<APIContext['currentLocale']>().toEqualTypeOf<string | undefined>();
	expectTypeOf<APIContext['preferredLocale']>().toEqualTypeOf<string | undefined>();
	expectTypeOf<APIContext['preferredLocaleList']>().toEqualTypeOf<Array<string> | undefined>();
	expectTypeOf<APIContext['routePattern']>().toEqualTypeOf<'bar' | 'baz'>();

	expectTypeOf<typeof import('astro:config/server')['i18n']>().toBeNullable();
	expectTypeOf<
		NonNullable<typeof import('astro:config/server')['i18n']>['defaultLocale']
	>().toEqualTypeOf<string>();
	expectTypeOf<typeof import('astro:config/server')['site']>().toBeNullable();

	expectTypeOf<typeof import('astro:config/client')['i18n']>().toBeNullable();
	expectTypeOf<
		NonNullable<typeof import('astro:config/client')['i18n']>['defaultLocale']
	>().toEqualTypeOf<string>();
	expectTypeOf<typeof import('astro:config/client')['site']>().toBeNullable();
});

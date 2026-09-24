import { describe, it } from 'node:test';
import '../../client.d.ts';
import type { I18nMiddlewareOptions } from 'astro:i18n';

describe('astro:i18n', () => {
	it('middleware', () => {
		({
			fallbackType: 'rewrite',
			prefixDefaultLocale: false,
			redirectToDefaultLocale: false,
		}) satisfies I18nMiddlewareOptions;
		({
			fallbackType: 'rewrite',
			prefixDefaultLocale: false,
			redirectToDefaultLocale: true,
			// @ts-expect-error invalid combination
		}) satisfies I18nMiddlewareOptions;
		({
			fallbackType: 'rewrite',
			prefixDefaultLocale: true,
			redirectToDefaultLocale: false,
		}) satisfies I18nMiddlewareOptions;
		({
			fallbackType: 'rewrite',
			prefixDefaultLocale: true,
			redirectToDefaultLocale: true,
		}) satisfies I18nMiddlewareOptions;
	});
});

import type { ActionClient, ActionReturnType } from '../../actions/runtime/types.js';
import type { CacheLike } from '../../core/cache/runtime/cache.js';
import type { AstroSession } from '../../core/session/runtime.js';

export type {
	APIContext,
	APIContextExtensions,
	AstroRuntimeLogger,
} from '@astrojs/vite-plugin-router';
export type { AstroGlobal } from '@astrojs/vite-plugin-astro';

declare module '@astrojs/vite-plugin-router' {
	interface APIContextExtensions<
		Props extends Record<string, any>,
		Params extends Record<string, string | undefined>,
	> {
		/**
		 * An object containing utilities for handling sessions in on-demand rendered routes.
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#session)
		 */
		session: AstroSession | undefined;

		/**
		 * An object for controlling route-level caching of SSR responses.
		 *
		 * Use `cache.set()` to configure caching options, `cache.tags` to read accumulated tags,
		 * and `cache.invalidate()` to purge cached entries.
		 *
		 * In dev mode, the cache object is available but performs no caching.
		 */
		cache: CacheLike;

		/**
		 * A function that returns the result of an Action submission when using a form POST.
		 *
		 * This accepts an action function as an argument and returns a type-safe
		 * data or error object when a submission is received. Otherwise, it will
		 * return undefined.
		 *
		 * @param {TAction} action - The action function to process.
		 * @returns {ActionReturnType<TAction> | undefined} An object describing the result of an action.
		 *
		 * ## Example
		 *
		 * ```astro
		 * import { actions } from 'astro:actions';
		 *
		 * const result = Astro.getActionResult(actions.myAction);
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#getactionresult)
		 */
		getActionResult: <TAction extends ActionClient<any, any, any>>(
			action: TAction,
		) => ActionReturnType<TAction> | undefined;

		/**
		 * A function used to call an Action handler directly from your Astro
		 * component or API endpoint.
		 *
		 * This accepts an Action function and a type-safe action input, and returns
		 * the result of the action as a Promise.
		 *
		 * ## Example
		 *
		 * ```typescript
		 * import { actions } from 'astro:actions';
		 *
		 * const result = await Astro.callAction(actions.getPost, { postId: 'test' });
		 * ```
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#callaction)
		 *
		 * @param {TAction} action - Any Action function.
		 * @param {Parameters<TAction>[0]} input - Any input that the given action receives.
		 */
		callAction: <
			TAction extends ActionClient<any, any, any> | ActionClient<any, any, any>['orThrow'],
		>(
			action: TAction,
			input: Parameters<TAction>[0],
		) => Promise<ActionReturnType<TAction>>;

		/**
		 * A computed value to find the best match between your visitor’s browser
		 * language preferences and the locales supported by your site.
		 *
		 * This property is only available for routes rendered on demand and cannot
		 * be used on prerendered, static pages.
		 *
		 * The preferred locale of the user is computed by checking the supported
		 * locales in `i18n.locales` and locales supported by the users's browser via
		 * the header `Accept-Language`.
		 *
		 * ## Example
		 *
		 * Given `i18n.locales` equals `['fr', 'de']`, and the `Accept-Language` value equals `en, de;q=0.2, fr;q=0.6`, the
		 * `Astro.preferredLanguage` will be `fr` because `en` is not supported, its [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values) is the highest.
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#preferredlocale)
		 */
		preferredLocale: string | undefined;

		/**
		 * Represents the list of all locales, sorted via [quality value](https://developer.mozilla.org/en-US/docs/Glossary/Quality_values), that are both
		 * requested by the browser and supported by your website.
		 *
		 * This property is only available for routes rendered on demand and cannot
		 * be used on prerendered, static pages.
		 *
		 * When the `Accept-Header` is `*`, the original `i18n.locales` are returned.
		 * The value `*` means no preferences, so Astro returns all the supported locales.
		 *
		 * ## Example
		 *
		 * Given `i18n.locales` equals `['fr', 'pt', 'de']`, and the
		 * `Accept-Language` value equals `en, de;q=0.2, fr;q=0.6`, the
		 * `Astro.preferredLocaleList` will be equal to `['fs', 'de']` because `en`
		 * isn't supported, and `pt` isn't part of the locales contained in the
		 * header.
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#preferredlocalelist)
		 */
		preferredLocaleList: string[] | undefined;

		/**
		 * The current locale computed from the URL of the request. It matches the locales in `i18n.locales`, and returns `undefined` otherwise.
		 *
		 * [Astro reference](https://docs.astro.build/en/reference/api-reference/#currentlocale)
		 */
		currentLocale: string | undefined;
	}
}

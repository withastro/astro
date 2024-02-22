import type { APIContext, Locales, Params } from '../../@types/astro.js';
import { ASTRO_VERSION, clientAddressSymbol, clientLocalsSymbol } from '../constants.js';
import type { AstroCookies } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
	type RoutingStrategies,
} from '../../i18n/utils.js';

type CreateAPIContext = {
	request: Request;
	params: Params;
	site?: string;
	props: Record<string, any>;
	adapterName?: string;
	locales: Locales | undefined;
	routingStrategy: RoutingStrategies | undefined;
	defaultLocale: string | undefined;
	route: string;
	cookies: AstroCookies;
};

/**
 * Creates a context that holds all the information needed to handle an Astro endpoint.
 *
 * @param {CreateAPIContext} payload
 */
export function createAPIContext({
	request,
	params,
	site,
	props,
	adapterName,
	locales,
	routingStrategy,
	defaultLocale,
	route,
	cookies,
}: CreateAPIContext): APIContext {
	let preferredLocale: string | undefined = undefined;
	let preferredLocaleList: string[] | undefined = undefined;
	let currentLocale: string | undefined = undefined;

	const context = {
		cookies,
		request,
		params,
		site: site ? new URL(site) : undefined,
		generator: `Astro v${ASTRO_VERSION}`,
		props,
		redirect(path, status) {
			return new Response(null, {
				status: status || 302,
				headers: {
					Location: path,
				},
			});
		},
		get preferredLocale(): string | undefined {
			if (preferredLocale) {
				return preferredLocale;
			}
			if (locales) {
				preferredLocale = computePreferredLocale(request, locales);
				return preferredLocale;
			}

			return undefined;
		},
		get preferredLocaleList(): string[] | undefined {
			if (preferredLocaleList) {
				return preferredLocaleList;
			}
			if (locales) {
				preferredLocaleList = computePreferredLocaleList(request, locales);
				return preferredLocaleList;
			}

			return undefined;
		},
		get currentLocale(): string | undefined {
			if (currentLocale) {
				return currentLocale;
			}
			if (locales) {
				currentLocale = computeCurrentLocale(route, locales, routingStrategy, defaultLocale);
			}

			return currentLocale;
		},
		url: new URL(request.url),
		get clientAddress() {
			if (clientAddressSymbol in request) {
				return Reflect.get(request, clientAddressSymbol) as string;
			}
			if (adapterName) {
				throw new AstroError({
					...AstroErrorData.ClientAddressNotAvailable,
					message: AstroErrorData.ClientAddressNotAvailable.message(adapterName),
				});
			} else {
				throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
			}
		},
		get locals() {
			let locals = Reflect.get(request, clientLocalsSymbol);

			if (locals === undefined) {
				locals = {};
				Reflect.set(request, clientLocalsSymbol, locals);
			}

			if (typeof locals !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			}

			return locals;
		},
		// We define a custom property, so we can check the value passed to locals
		set locals(val) {
			if (typeof val !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			} else {
				Reflect.set(request, clientLocalsSymbol, val);
			}
		},
	} satisfies APIContext;

	return context;
}

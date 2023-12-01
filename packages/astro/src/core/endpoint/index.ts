import type {
	APIContext,
	EndpointHandler,
	Locales,
	MiddlewareHandler,
	Params,
} from '../../@types/astro.js';
import { renderEndpoint } from '../../runtime/server/index.js';
import { ASTRO_VERSION } from '../constants.js';
import { AstroCookies, attachCookiesToResponse } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { callMiddleware } from '../middleware/callMiddleware.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../render/context.js';
import { type Environment, type RenderContext } from '../render/index.js';

const clientAddressSymbol = Symbol.for('astro.clientAddress');
const clientLocalsSymbol = Symbol.for('astro.locals');

type CreateAPIContext = {
	request: Request;
	params: Params;
	site?: string;
	props: Record<string, any>;
	adapterName?: string;
	locales: Locales | undefined;
	routingStrategy: 'prefix-always' | 'prefix-other-locales' | undefined;
	defaultLocale: string | undefined;
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
}: CreateAPIContext): APIContext {
	let preferredLocale: string | undefined = undefined;
	let preferredLocaleList: string[] | undefined = undefined;
	let currentLocale: string | undefined = undefined;

	const context = {
		cookies: new AstroCookies(request),
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
				currentLocale = computeCurrentLocale(request, locales, routingStrategy, defaultLocale);
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

export async function callEndpoint(
	mod: EndpointHandler,
	env: Environment,
	ctx: RenderContext,
	onRequest: MiddlewareHandler | undefined
): Promise<Response> {
	const context = createAPIContext({
		request: ctx.request,
		params: ctx.params,
		props: ctx.props,
		site: env.site,
		adapterName: env.adapterName,
		routingStrategy: ctx.routing,
		defaultLocale: ctx.defaultLocale,
		locales: ctx.locales,
	});

	let response;
	if (onRequest) {
		response = await callMiddleware(onRequest, context, async () => {
			return await renderEndpoint(mod, context, env.ssr, env.logger);
		});
	} else {
		response = await renderEndpoint(mod, context, env.ssr, env.logger);
	}

	attachCookiesToResponse(response, context.cookies);
	return response;
}

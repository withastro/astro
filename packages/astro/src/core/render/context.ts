import type {
	ComponentInstance,
	Params,
	Props,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../@types/astro.js';
import { normalizeTheLocale } from '../../i18n/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import type { Environment } from './environment.js';
import { getParamsAndProps } from './params-and-props.js';

const clientLocalsSymbol = Symbol.for('astro.locals');

/**
 * The RenderContext represents the parts of rendering that are specific to one request.
 */
export interface RenderContext {
	request: Request;
	pathname: string;
	scripts?: Set<SSRElement>;
	links?: Set<SSRElement>;
	styles?: Set<SSRElement>;
	componentMetadata?: SSRResult['componentMetadata'];
	route: RouteData;
	status?: number;
	params: Params;
	props: Props;
	locals?: object;
	locales: string[] | undefined;
	defaultLocale: string | undefined;
	routingStrategy: 'prefix-always' | 'prefix-other-locales' | undefined;
}

export type CreateRenderContextArgs = Partial<
	Omit<RenderContext, 'params' | 'props' | 'locals'>
> & {
	route: RouteData;
	request: RenderContext['request'];
	mod: ComponentInstance | undefined;
	env: Environment;
};

export async function createRenderContext(
	options: CreateRenderContextArgs
): Promise<RenderContext> {
	const request = options.request;
	const pathname = options.pathname ?? new URL(request.url).pathname;
	const [params, props] = await getParamsAndProps({
		mod: options.mod as any,
		route: options.route,
		routeCache: options.env.routeCache,
		pathname: pathname,
		logger: options.env.logger,
		ssr: options.env.ssr,
	});

	const context: RenderContext = {
		...options,
		pathname,
		params,
		props,
		locales: options.locales,
		routingStrategy: options.routingStrategy,
		defaultLocale: options.defaultLocale,
	};

	// We define a custom property, so we can check the value passed to locals
	Object.defineProperty(context, 'locals', {
		enumerable: true,
		get() {
			return Reflect.get(request, clientLocalsSymbol);
		},
		set(val) {
			if (typeof val !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			} else {
				Reflect.set(request, clientLocalsSymbol, val);
			}
		},
	});

	return context;
}

type BrowserLocale = {
	locale: string;
	qualityValue: number | undefined;
};

/**
 * Parses the value of the `Accept-Header` language:
 *
 * More info: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language
 *
 * Complex example: `fr-CH, fr;q=0.9, en;q=0.8, de;q=0.7, *;q=0.5`
 *
 */
export function parseLocale(header: string): BrowserLocale[] {
	// Any language, early return
	if (header === '*') {
		return [{ locale: header, qualityValue: undefined }];
	}
	const result: BrowserLocale[] = [];
	// we split by `,` and trim the white spaces
	const localeValues = header.split(',').map((str) => str.trim());

	for (const localeValue of localeValues) {
		// split the locale name from the quality value
		const split = localeValue.split(';').map((str) => str.trim());
		const localeName: string = split[0];
		const qualityValue: string | undefined = split[1];

		if (!split) {
			// invalid value
			continue;
		}

		// we check if the quality value is present, and it is actually `q=`
		if (qualityValue && qualityValue.startsWith('q=')) {
			const qualityValueAsFloat = Number.parseFloat(qualityValue.slice('q='.length));
			// The previous operation can return a `NaN`, so we check if it is a safe operation
			if (Number.isNaN(qualityValueAsFloat) || qualityValueAsFloat > 1) {
				result.push({
					locale: localeName,
					qualityValue: undefined,
				});
			} else {
				result.push({
					locale: localeName,
					qualityValue: qualityValueAsFloat,
				});
			}
		} else {
			result.push({
				locale: localeName,
				qualityValue: undefined,
			});
		}
	}

	return result;
}

function sortAndFilterLocales(browserLocaleList: BrowserLocale[], locales: string[]) {
	const normalizedLocales = locales.map(normalizeTheLocale);
	return browserLocaleList
		.filter((browserLocale) => {
			if (browserLocale.locale !== '*') {
				return normalizedLocales.includes(normalizeTheLocale(browserLocale.locale));
			}
			return true;
		})
		.sort((a, b) => {
			if (a.qualityValue && b.qualityValue) {
				if (a.qualityValue > b.qualityValue) {
					return -1;
				} else if (a.qualityValue < b.qualityValue) {
					return 1;
				}
			}
			return 0;
		});
}

/**
 * Set the current locale by parsing the value passed from the `Accept-Header`.
 *
 * If multiple locales are present in the header, they are sorted by their quality value and the highest is selected as current locale.
 *
 */
export function computePreferredLocale(request: Request, locales: string[]): string | undefined {
	const acceptHeader = request.headers.get('Accept-Language');
	let result: string | undefined = undefined;
	if (acceptHeader) {
		const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);

		const firstResult = browserLocaleList.at(0);
		if (firstResult) {
			if (firstResult.locale !== '*') {
				result = locales.find(
					(locale) => normalizeTheLocale(locale) === normalizeTheLocale(firstResult.locale)
				);
			}
		}
	}

	return result;
}

export function computePreferredLocaleList(request: Request, locales: string[]) {
	const acceptHeader = request.headers.get('Accept-Language');
	let result: string[] = [];
	if (acceptHeader) {
		const browserLocaleList = sortAndFilterLocales(parseLocale(acceptHeader), locales);

		// SAFETY: bang operator is safe because checked by the previous condition
		if (browserLocaleList.length === 1 && browserLocaleList.at(0)!.locale === '*') {
			return locales;
		} else if (browserLocaleList.length > 0) {
			for (const browserLocale of browserLocaleList) {
				const found = locales.find(
					(l) => normalizeTheLocale(l) === normalizeTheLocale(browserLocale.locale)
				);
				if (found) {
					result.push(found);
				}
			}
		}
	}

	return result;
}

export function computeCurrentLocale(
	request: Request,
	locales: string[],
	routingStrategy: 'prefix-always' | 'prefix-other-locales' | undefined,
	defaultLocale: string | undefined
): undefined | string {
	const requestUrl = new URL(request.url);
	for (const segment of requestUrl.pathname.split('/')) {
		for (const locale of locales) {
			if (normalizeTheLocale(locale) === normalizeTheLocale(segment)) {
				return locale;
			}
		}
	}
	if (routingStrategy === 'prefix-other-locales') {
		return defaultLocale;
	}
	return undefined;
}

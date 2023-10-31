import type {
	ComponentInstance,
	Params,
	Props,
	RouteData,
	SSRElement,
	SSRResult,
} from '../../@types/astro.js';
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
	preferredLocale: string | undefined;
	preferredLocaleList: string[] | undefined;
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
		preferredLocale: options.preferredLocale,
		preferredLocaleList: options.preferredLocaleList,
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

/**
 * Set the current locale by parsing the value passed from the `Accept-Header`.
 *
 * If multiple locales are present in the header, they are sorted by their quality value and the highest is selected as current locale.
 *
 */
export function computePreferredLocales(
	request: Request
): [preferredLocaleList: string[] | undefined, preferredLocale: string | undefined] {
	const acceptHeader = request.headers.get('Accept-Language');
	const result: [preferredLocaleList: string[] | undefined, preferredLocale: string | undefined] = [
		undefined,
		undefined,
	];
	if (acceptHeader) {
		const parsedResult = parseLocale(acceptHeader);
		if (parsedResult) {
			parsedResult.sort((a, b) => {
				if (a.qualityValue && b.qualityValue) {
					if (a.qualityValue > b.qualityValue) {
						return -1;
					} else if (a.qualityValue < b.qualityValue) {
						return 1;
					}
				}
				return 0;
			});
			result[0] = parsedResult.map((item) => {
				return item.locale;
			});
			const firstResult = parsedResult.at(0);
			if (firstResult) {
				if (firstResult.locale !== '*') {
					result[1] = firstResult.locale;
				}
			}
		}
	}

	return result;
}

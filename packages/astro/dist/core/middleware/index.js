import { createCallAction, createGetActionResult } from '../../actions/utils.js';
import {
	computeCurrentLocale,
	computePreferredLocale,
	computePreferredLocaleList,
} from '../../i18n/utils.js';
import { DisabledAstroCache } from '../cache/runtime/noop.js';
import { ASTRO_GENERATOR } from '../constants.js';
import { AstroCookies } from '../cookies/index.js';
import { AstroError, AstroErrorData } from '../errors/index.js';
import { getOriginPathname } from '../routing/rewrite.js';
import { sequence } from './sequence.js';
function createContext({
	request,
	params = {},
	userDefinedLocales = [],
	defaultLocale = '',
	locals = {},
	clientAddress,
}) {
	let preferredLocale = void 0;
	let preferredLocaleList = void 0;
	let currentLocale = void 0;
	const url = new URL(request.url);
	const route = url.pathname;
	const rewrite = (_reroutePayload) => {
		return Promise.resolve(new Response(null));
	};
	const context = {
		cookies: new AstroCookies(request),
		request,
		params,
		site: void 0,
		generator: ASTRO_GENERATOR,
		props: {},
		rewrite,
		routePattern: '',
		redirect(path, status) {
			return new Response(null, {
				status: status || 302,
				headers: {
					Location: path,
				},
			});
		},
		isPrerendered: false,
		get preferredLocale() {
			return (preferredLocale ??= computePreferredLocale(request, userDefinedLocales));
		},
		get preferredLocaleList() {
			return (preferredLocaleList ??= computePreferredLocaleList(request, userDefinedLocales));
		},
		get currentLocale() {
			return (currentLocale ??= computeCurrentLocale(route, userDefinedLocales, defaultLocale));
		},
		url,
		get originPathname() {
			return getOriginPathname(request);
		},
		get clientAddress() {
			if (clientAddress) {
				return clientAddress;
			}
			throw new AstroError(AstroErrorData.StaticClientAddressNotAvailable);
		},
		get locals() {
			if (typeof locals !== 'object') {
				throw new AstroError(AstroErrorData.LocalsNotAnObject);
			}
			return locals;
		},
		set locals(_) {
			throw new AstroError(AstroErrorData.LocalsReassigned);
		},
		session: void 0,
		cache: new DisabledAstroCache(),
		csp: void 0,
		logger: void 0,
	};
	return Object.assign(context, {
		getActionResult: createGetActionResult(context.locals),
		callAction: createCallAction(context),
	});
}
function isLocalsSerializable(value) {
	const stack = [value];
	while (stack.length > 0) {
		const current = stack.pop();
		const type = typeof current;
		if (current === null || type === 'string' || type === 'number' || type === 'boolean') {
			continue;
		}
		if (Array.isArray(current)) {
			stack.push(...current);
			continue;
		}
		if (type === 'object' && isPlainObject(current)) {
			stack.push(...Object.values(current));
			continue;
		}
		return false;
	}
	return true;
}
function isPlainObject(value) {
	if (typeof value !== 'object' || value === null) return false;
	let proto = Object.getPrototypeOf(value);
	if (proto === null) return true;
	let baseProto = proto;
	while (Object.getPrototypeOf(baseProto) !== null) {
		baseProto = Object.getPrototypeOf(baseProto);
	}
	return proto === baseProto;
}
function trySerializeLocals(value) {
	if (isLocalsSerializable(value)) {
		return JSON.stringify(value);
	} else {
		throw new Error("The passed value can't be serialized.");
	}
}
import { defineMiddleware } from './defineMiddleware.js';
export { createContext, defineMiddleware, isLocalsSerializable, sequence, trySerializeLocals };

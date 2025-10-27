import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';
import { internalFetchHeaders } from 'virtual:astro:adapter-config/client';
import type { APIContext } from '../../types/public/context.js';
import type { ActionClient, SafeResult } from './server.js';
import {
	ACTION_QUERY_PARAMS,
	ActionError,
	appendForwardSlash,
	astroCalledServerError,
	deserializeActionResult,
	getActionQueryString,
} from './shared.js';

export * from 'virtual:astro:actions/runtime';

const apiContextRoutesSymbol = Symbol.for('context.routes');
const ENCODED_DOT = '%2E';

function toActionProxy(actionCallback: Record<string | symbol, any> = {}, aggregatedPath = '') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			if (target.hasOwnProperty(objKey) || typeof objKey === 'symbol') {
				return target[objKey];
			}
			// Add the key, encoding dots so they're not interpreted as nested properties.
			const path =
				aggregatedPath + encodeURIComponent(objKey.toString()).replaceAll('.', ENCODED_DOT);
			function action(this: APIContext | undefined, param: any) {
				return handleAction(param, path, this);
			}

			Object.assign(action, {
				queryString: getActionQueryString(path),
				toString: () => (action as any).queryString,
				// redefine prototype methods as the object's own property, not the prototype's
				bind: action.bind,
				valueOf: () => action.valueOf,
				// Progressive enhancement info for React.
				$$FORM_ACTION: function () {
					const searchParams = new URLSearchParams(action.toString());
					return {
						method: 'POST',
						// `name` creates a hidden input.
						// It's unused by Astro, but we can't turn this off.
						// At least use a name that won't conflict with a user's formData.
						name: '_astroAction',
						action: '?' + searchParams.toString(),
					};
				},
				// Note: `orThrow` does not have progressive enhancement info.
				// If you want to throw exceptions,
				//  you must handle those exceptions with client JS.
				async orThrow(this: APIContext | undefined, param: any) {
					const { data, error } = await handleAction(param, path, this);
					if (error) throw error;
					return data;
				},
			});

			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

function _getActionPath(toString: () => string) {
	let path = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/_actions/${new URLSearchParams(toString()).get(ACTION_QUERY_PARAMS.actionName)}`;
	if (shouldAppendTrailingSlash) {
		path = appendForwardSlash(path);
	}
	return path;
}

export function getActionPath(action: ActionClient<any, any, any>) {
	return _getActionPath(action.toString);
}

async function handleAction(
	param: any,
	path: string,
	context: APIContext | undefined,
): Promise<SafeResult<any, any>> {
	// When running server-side, import the action and call it.
	if (import.meta.env.SSR && context) {
		const pipeline = Reflect.get(context, apiContextRoutesSymbol);
		if (!pipeline) {
			throw astroCalledServerError();
		}
		const action = await pipeline.getAction(path);
		if (!action) throw new Error(`Action not found: ${path}`);
		return action.bind(context)(param);
	}

	// When running client-side, make a fetch request to the action path.
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	// Apply adapter-specific headers for internal fetches
	for (const [key, value] of Object.entries(internalFetchHeaders)) {
		headers.set(key, value);
	}
	let body = param;
	if (!(body instanceof FormData)) {
		try {
			body = JSON.stringify(param);
		} catch (e) {
			throw new ActionError({
				code: 'BAD_REQUEST',
				message: `Failed to serialize request body to JSON. Full error: ${(e as Error).message}`,
			});
		}
		if (body) {
			headers.set('Content-Type', 'application/json');
		} else {
			headers.set('Content-Length', '0');
		}
	}
	const rawResult = await fetch(
		_getActionPath(() => getActionQueryString(path)),
		{
			method: 'POST',
			body,
			headers,
		},
	);

	if (rawResult.status === 204) {
		return deserializeActionResult({ type: 'empty', status: 204 });
	}

	const bodyText = await rawResult.text();

	if (rawResult.ok) {
		return deserializeActionResult({
			type: 'data',
			body: bodyText,
			status: 200,
			contentType: 'application/json+devalue',
		});
	}

	return deserializeActionResult({
		type: 'error',
		body: bodyText,
		status: rawResult.status,
		contentType: 'application/json',
	});
}

export const actions = toActionProxy();

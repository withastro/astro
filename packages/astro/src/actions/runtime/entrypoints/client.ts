import { shouldAppendTrailingSlash } from 'virtual:astro:actions/options';
import { internalFetchHeaders } from 'virtual:astro:adapter-config/client';
import {
	ActionError,
	createActionsProxy,
	createGetActionPath,
	deserializeActionResult,
	getActionPathFromString,
	getActionQueryString,
} from '../client.js';

export { ACTION_QUERY_PARAMS } from '../../consts.js';
export {
	ActionError,
	isActionError,
	isInputError,
} from '../client.js';
export type {
	ActionAPIContext,
	ActionClient,
	ActionErrorCode,
	ActionInputSchema,
	ActionReturnType,
	SafeResult,
} from '../types.js';

export function defineAction() {
	throw new Error('[astro:actions] `defineAction()` unexpectedly used on the client.');
}

export function getActionContext() {
	throw new Error('[astro:actions] `getActionContext()` unexpectedly used on the client.');
}

export const getActionPath = createGetActionPath({
	baseUrl: import.meta.env.BASE_URL,
	shouldAppendTrailingSlash,
});

export const actions = createActionsProxy({
	handleAction: async (param, path) => {
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
			getActionPathFromString({
				baseUrl: import.meta.env.BASE_URL,
				shouldAppendTrailingSlash,
				path: getActionQueryString(path),
			}),
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
	},
});

import { yellow } from 'kleur/colors';
import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import {
	ActionQueryStringInvalidError,
	ActionsUsedWithForGetError,
} from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/errors.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { getActionQueryString } from './virtual/shared.js';

export type Locals = {
	_actionsInternal: {
		getActionResult: APIContext['getActionResult'];
		actionResult?: ReturnType<APIContext['getActionResult']>;
	};
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	const { request } = context;
	// Actions middleware may have run already after a path rewrite.
	// See https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md#ctxrewrite
	// `_actionsInternal` is the same for every page,
	// so short circuit if already defined.
	if (locals._actionsInternal) return ApiContextStorage.run(context, () => next());

	// Heuristic: If body is null, Astro might've reset this for prerendering.
	// Stub with warning when `getActionResult()` is used.
	if (request.method === 'POST' && request.body === null) {
		return nextWithStaticStub(next, context);
	}

	const actionName = context.url.searchParams.get('_astroAction');

	if (context.request.method === 'POST' && actionName) {
		return handlePost({ context, next, actionName });
	}

	if (context.request.method === 'GET' && actionName) {
		throw new AstroError({
			...ActionsUsedWithForGetError,
			message: ActionsUsedWithForGetError.message(actionName),
		});
	}

	if (context.request.method === 'POST') {
		return handlePostLegacy({ context, next });
	}

	return nextWithLocalsStub(next, context);
});

async function handlePost({
	context,
	next,
	actionName,
}: { context: APIContext; next: MiddlewareNext; actionName: string }) {
	const { request } = context;

	const action = await getAction(actionName);
	if (!action) {
		throw new AstroError({
			...ActionQueryStringInvalidError,
			message: ActionQueryStringInvalidError.message(actionName),
		});
	}

	const contentType = request.headers.get('content-type');
	let formData: FormData | undefined;
	if (contentType && hasContentType(contentType, formContentTypes)) {
		formData = await request.clone().formData();
	}
	const actionResult = await ApiContextStorage.run(context, () => action(formData));

	return handleResult({ context, next, actionName, actionResult });
}

function handleResult({
	context,
	next,
	actionName,
	actionResult,
}: { context: APIContext; next: MiddlewareNext; actionName: string; actionResult: any }) {
	const actionsInternal: Locals['_actionsInternal'] = {
		getActionResult: (actionFn) => {
			if (actionFn.toString() !== getActionQueryString(actionName)) {
				return Promise.resolve(undefined);
			}
			return actionResult;
		},
		actionResult,
	};
	const locals = context.locals as Locals;
	Object.defineProperty(locals, '_actionsInternal', { writable: false, value: actionsInternal });

	return ApiContextStorage.run(context, async () => {
		const response = await next();
		if (actionResult.error) {
			return new Response(response.body, {
				status: actionResult.error.status,
				statusText: actionResult.error.type,
				headers: response.headers,
			});
		}
		return response;
	});
}

async function handlePostLegacy({ context, next }: { context: APIContext; next: MiddlewareNext }) {
	const { request } = context;

	// We should not run a middleware handler for fetch()
	// requests directly to the /_actions URL.
	// Otherwise, we may handle the result twice.
	if (context.url.pathname.startsWith('/_actions')) return nextWithLocalsStub(next, context);

	const contentType = request.headers.get('content-type');
	let formData: FormData | undefined;
	if (contentType && hasContentType(contentType, formContentTypes)) {
		formData = await request.clone().formData();
	}

	if (!formData) return nextWithLocalsStub(next, context);

	const actionName = formData.get('_astroAction') as string;
	if (!actionName) return nextWithLocalsStub(next, context);

	const action = await getAction(actionName);
	if (!action) {
		throw new AstroError({
			...ActionQueryStringInvalidError,
			message: ActionQueryStringInvalidError.message(actionName),
		});
	}

	const actionResult = await ApiContextStorage.run(context, () => action(formData));
	return handleResult({ context, next, actionName, actionResult });
}

function nextWithStaticStub(next: MiddlewareNext, context: APIContext) {
	Object.defineProperty(context.locals, '_actionsInternal', {
		writable: false,
		value: {
			getActionResult: () => {
				console.warn(
					yellow('[astro:actions]'),
					'`getActionResult()` should not be called on prerendered pages. Astro can only handle actions for pages rendered on-demand.'
				);
				return undefined;
			},
		},
	});
	return ApiContextStorage.run(context, () => next());
}

function nextWithLocalsStub(next: MiddlewareNext, context: APIContext) {
	Object.defineProperty(context.locals, '_actionsInternal', {
		writable: false,
		value: {
			getActionResult: () => undefined,
		},
	});
	return ApiContextStorage.run(context, () => next());
}

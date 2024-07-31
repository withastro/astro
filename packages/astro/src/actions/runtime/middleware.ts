import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import {
	ActionQueryStringInvalidError,
	ActionsUsedWithForGetError,
} from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/errors.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';

export type Locals = {
	_actionsInternal: {
		actionResult: ReturnType<APIContext['getActionResult']>;
		actionName: string;
	};
};

export const onRequest = defineMiddleware(async (context, next) => {
	const locals = context.locals as Locals;
	const { request } = context;
	// Actions middleware may have run already after a path rewrite.
	// See https://github.com/withastro/roadmap/blob/feat/reroute/proposals/0047-rerouting.md#ctxrewrite
	// `_actionsInternal` is the same for every page,
	// so short circuit if already defined.
	if (locals._actionsInternal) return next();

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

	return next();
});

async function handlePost({
	context,
	next,
	actionName,
}: { context: APIContext; next: MiddlewareNext; actionName: string }) {
	const { request } = context;

	const baseAction = await getAction(actionName);
	if (!baseAction) {
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
	const action = baseAction.bind(context);
	const actionResult = await action(formData);

	return handleResult({ context, next, actionName, actionResult });
}

async function handleResult({
	context,
	next,
	actionName,
	actionResult,
}: { context: APIContext; next: MiddlewareNext; actionName: string; actionResult: any }) {
	const actionsInternal: Locals['_actionsInternal'] = {
		actionName,
		actionResult,
	};
	const locals = context.locals as Locals;
	Object.defineProperty(locals, '_actionsInternal', { writable: false, value: actionsInternal });

	const response = await next();
	if (actionResult.error) {
		return new Response(response.body, {
			status: actionResult.error.status,
			statusText: actionResult.error.type,
			headers: response.headers,
		});
	}
	return response;
}

async function handlePostLegacy({ context, next }: { context: APIContext; next: MiddlewareNext }) {
	const { request } = context;

	// We should not run a middleware handler for fetch()
	// requests directly to the /_actions URL.
	// Otherwise, we may handle the result twice.
	if (context.url.pathname.startsWith('/_actions')) return next();

	const contentType = request.headers.get('content-type');
	let formData: FormData | undefined;
	if (contentType && hasContentType(contentType, formContentTypes)) {
		formData = await request.clone().formData();
	}

	if (!formData) return next();

	const actionName = formData.get('_astroAction') as string;
	if (!actionName) return next();

	const baseAction = await getAction(actionName);
	if (!baseAction) {
		throw new AstroError({
			...ActionQueryStringInvalidError,
			message: ActionQueryStringInvalidError.message(actionName),
		});
	}

	const action = baseAction.bind(context);
	const actionResult = await action(formData);
	return handleResult({ context, next, actionName, actionResult });
}

function nextWithStaticStub(next: MiddlewareNext, context: APIContext) {
	Object.defineProperty(context.locals, '_actionsInternal', {
		writable: false,
		value: {
			actionResult: undefined,
			actionName: undefined,
			// getActionResult: () => {
			// 	console.warn(
			// 		yellow('[astro:actions]'),
			// 		'`getActionResult()` should not be called on prerendered pages. Astro can only handle actions for pages rendered on-demand.'
			// 	);
			// 	return undefined;
			// },
		},
	});
	return next();
}

function nextWithLocalsStub(next: MiddlewareNext, context: APIContext) {
	Object.defineProperty(context.locals, '_actionsInternal', {
		writable: false,
		value: {
			actionResult: undefined,
			actionName: undefined,
		},
	});
	return next();
}

function createCallAction(context: APIContext): APIContext['callAction'] {
	return (baseAction, input) => {
		const action = baseAction.bind(context);
		return action(input) as any;
	};
}

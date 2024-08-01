import { yellow } from 'kleur/colors';
import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import {
	ActionQueryStringInvalidError,
	ActionsUsedWithForGetError,
} from '../../core/errors/errors-data.js';
import { AstroError } from '../../core/errors/errors.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { formContentTypes, hasContentType } from './utils.js';
import {
	type SafeResult,
	type SerializedActionResult,
	serializeActionResult,
} from './virtual/shared.js';
import { getAction } from './virtual/get-action.js';

export type Locals = {
	_actionsInternal: {
		actionResult: SerializedActionResult;
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
	if (import.meta.env.DEV && request.method === 'POST' && request.body === null) {
		console.warn(
			yellow('[astro:actions]'),
			'POST requests should not be sent to prerendered pages. If you\'re using Actions, disable prerendering with `export const prerender = "false".'
		);
		return next();
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
}: {
	context: APIContext;
	next: MiddlewareNext;
	actionName: string;
	actionResult: SafeResult<any, any>;
}) {
	const locals = context.locals as Locals;
	locals._actionsInternal = {
		actionName,
		actionResult: serializeActionResult(actionResult),
	};

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

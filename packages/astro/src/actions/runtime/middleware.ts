import { yellow } from 'kleur/colors';
import type { APIContext, MiddlewareNext } from '../../@types/astro.js';
import { defineMiddleware } from '../../core/middleware/index.js';
import { getOriginPathname } from '../../core/routing/rewrite.js';
import { ACTION_QUERY_PARAMS } from '../consts.js';
import { ACTION_API_CONTEXT_SYMBOL, formContentTypes, hasContentType } from './utils.js';
import { getAction } from './virtual/get-action.js';
import {
	type SafeResult,
	type SerializedActionResult,
	serializeActionResult,
} from './virtual/shared.js';

export type ActionPayload = {
	actionResult: SerializedActionResult;
	actionName: string;
};

export type Locals = {
	_actionPayload: ActionPayload;
};

export const onRequest = defineMiddleware(async (context, next) => {
	if ((context as any)._isPrerendered) {
		if (context.request.method === 'POST') {
			console.warn(
				yellow('[astro:actions]'),
				"POST requests should not be sent to prerendered pages. If you're using Actions, disable prerendering with `export const prerender = false`.",
			);
		}
		return next();
	}

	const locals = context.locals as Locals;
	// Actions middleware may have run already after a path rewrite.
	// See https://github.com/withastro/roadmap/blob/main/proposals/0048-rerouting.md#ctxrewrite
	// `_actionPayload` is the same for every page,
	// so short circuit if already defined.
	if (locals._actionPayload) return next();

	const actionPayload = context.cookies.get(ACTION_QUERY_PARAMS.actionPayload)?.json();
	if (actionPayload) {
		if (!isActionPayload(actionPayload)) {
			throw new Error('Internal: Invalid action payload in cookie.');
		}
		return renderResult({ context, next, ...actionPayload });
	}

	const actionName = context.url.searchParams.get(ACTION_QUERY_PARAMS.actionName);

	if (context.request.method === 'POST' && actionName) {
		return handlePost({ context, next, actionName });
	}

	return next();
});

async function renderResult({
	context,
	next,
	actionResult,
	actionName,
}: {
	context: APIContext;
	next: MiddlewareNext;
	actionResult: SerializedActionResult;
	actionName: string;
}) {
	const locals = context.locals as Locals;

	locals._actionPayload = { actionResult, actionName };
	const response = await next();
	context.cookies.delete(ACTION_QUERY_PARAMS.actionPayload);

	if (actionResult.type === 'error') {
		return new Response(response.body, {
			status: actionResult.status,
			statusText: actionResult.type,
			headers: response.headers,
		});
	}
	return response;
}

async function handlePost({
	context,
	next,
	actionName,
}: {
	context: APIContext;
	next: MiddlewareNext;
	actionName: string;
}) {
	const { request } = context;
	const baseAction = await getAction(actionName);

	const contentType = request.headers.get('content-type');
	let formData: FormData | undefined;
	if (contentType && hasContentType(contentType, formContentTypes)) {
		formData = await request.clone().formData();
	}
	const { getActionResult, callAction, props, redirect, ...actionAPIContext } = context;
	Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
	const action = baseAction.bind(actionAPIContext);
	const actionResult = await action(formData);

	if (context.url.searchParams.get(ACTION_QUERY_PARAMS.actionRedirect) === 'false') {
		return renderResult({
			context,
			next,
			actionName,
			actionResult: serializeActionResult(actionResult),
		});
	}

	return redirectWithResult({ context, actionName, actionResult });
}

async function redirectWithResult({
	context,
	actionName,
	actionResult,
}: {
	context: APIContext;
	actionName: string;
	actionResult: SafeResult<any, any>;
}) {
	context.cookies.set(ACTION_QUERY_PARAMS.actionPayload, {
		actionName,
		actionResult: serializeActionResult(actionResult),
	});

	if (actionResult.error) {
		const referer = context.request.headers.get('Referer');
		if (!referer) {
			throw new Error('Internal: Referer unexpectedly missing from Action POST request.');
		}
		return context.redirect(referer);
	}

	const referer = getOriginPathname(context.request);
	if (referer) {
		return context.redirect(referer);
	}

	return context.redirect(context.url.pathname);
}

function isActionPayload(json: unknown): json is ActionPayload {
	if (typeof json !== 'object' || json == null) return false;

	if (!('actionResult' in json) || typeof json.actionResult !== 'object') return false;
	if (!('actionName' in json) || typeof json.actionName !== 'string') return false;
	return true;
}

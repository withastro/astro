import type { APIRoute } from '../../@types/astro.js';
import { ACTION_API_CONTEXT_SYMBOL, formContentTypes, hasContentType } from './utils.js';
import { getAction } from './virtual/get-action.js';
import { serializeActionResult } from './virtual/shared.js';

export const POST: APIRoute = async (context) => {
	const { request, url } = context;
	let baseAction;
	try {
		baseAction = await getAction(url.pathname);
	} catch (e) {
		if (import.meta.env.DEV) throw e;
		console.error(e);
		return new Response(e instanceof Error ? e.message : null, { status: 404 });
	}
	const contentType = request.headers.get('Content-Type');
	const contentLength = request.headers.get('Content-Length');
	let args: unknown;
	if (!contentType || contentLength === '0') {
		args = undefined;
	} else if (contentType && hasContentType(contentType, formContentTypes)) {
		args = await request.clone().formData();
	} else if (contentType && hasContentType(contentType, ['application/json'])) {
		args = await request.clone().json();
	} else {
		// 415: Unsupported media type
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/415
		return new Response(null, { status: 415 });
	}
	const { getActionResult, callAction, props, redirect, ...actionAPIContext } = context;
	Reflect.set(actionAPIContext, ACTION_API_CONTEXT_SYMBOL, true);
	const action = baseAction.bind(actionAPIContext);
	const result = await action(args);
	const serialized = serializeActionResult(result);

	if (serialized.type === 'empty') {
		return new Response(null, {
			status: serialized.status,
		});
	}

	return new Response(serialized.body, {
		status: serialized.status,
		headers: {
			'Content-Type': serialized.contentType,
		},
	});
};

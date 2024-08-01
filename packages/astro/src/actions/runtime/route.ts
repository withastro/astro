import type { APIRoute } from '../../@types/astro.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { serializeActionResult } from './virtual/shared.js';

export const POST: APIRoute = async (context) => {
	const { request, url } = context;
	const baseAction = await getAction(url.pathname);
	if (!baseAction) {
		return new Response(null, { status: 404 });
	}
	const contentType = request.headers.get('Content-Type');
	const contentLength = request.headers.get('Content-Length');
	let args: unknown;
	if (contentLength === '0') {
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
	const action = baseAction.bind(context);
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

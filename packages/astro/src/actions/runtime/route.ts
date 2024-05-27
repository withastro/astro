import type { APIRoute } from '../../@types/astro.js';
import { ApiContextStorage } from './store.js';
import { formContentTypes, getAction, hasContentType } from './utils.js';
import { callSafely } from './virtual/shared.js';

export const POST: APIRoute = async (context) => {
	const { request, url } = context;
	const action = await getAction(url.pathname);
	if (!action) {
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
	const result = await ApiContextStorage.run(context, () => callSafely(() => action(args)));
	if (result.error) {
		return new Response(
			JSON.stringify({
				...result.error,
				message: result.error.message,
				stack: import.meta.env.PROD ? undefined : result.error.stack,
			}),
			{
				status: result.error.status,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		);
	}
	return new Response(JSON.stringify(result.data), {
		status: result.data ? 200 : 204,
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

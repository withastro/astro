import type { APIRoute } from 'astro';
import { ApiContextStorage, formContentTypes, getAction } from './utils.js';
import { ActionError } from './virtual.js';

export const POST: APIRoute = async (context) => {
	const { request, url } = context;
	if (request.method !== 'POST') {
		return new Response(null, { status: 405 });
	}
	const actionPathKeys = url.pathname.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	const contentType = request.headers.get('Content-Type');
	let args: any;
	if (contentType === 'application/json') {
		args = await request.clone().json();
	}
	if (formContentTypes.some((f) => contentType?.startsWith(f))) {
		args = await request.clone().formData();
	}
	let result: unknown;
	try {
		result = await ApiContextStorage.run(context, () => action(args));
	} catch (e) {
		if (e instanceof ActionError) {
			return new Response(JSON.stringify(e), {
				status: 400,
				headers: {
					'Content-Type': 'application/json',
				},
			});
		}
		throw e;
	}
	return new Response(JSON.stringify(result), {
		headers: {
			'Content-Type': 'application/json',
		},
	});
};

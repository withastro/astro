import type { APIRoute } from '../../@types/astro.js';
import { ApiContextStorage, getAction } from './utils.js';
import { ActionError } from './virtual.js';

export const POST: APIRoute = async (context) => {
	const { request, url } = context;
	if (request.method !== 'POST') {
		return new Response(null, { status: 405 });
	}
	const actionPathKeys = url.pathname.replace('/_actions/', '').split('.');
	const action = await getAction(actionPathKeys);
	const contentType = request.headers.get('Content-Type');
	if (contentType !== 'application/json') {
		throw new ActionError({
			status: 'INTERNAL_SERVER_ERROR',
			message:
				'Called an action with a non-JSON body. To automatically convert form data requests to JSON, add `enhance: true` to your `defineAction()` config.',
		});
	}
	const args = await request.clone().json();
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

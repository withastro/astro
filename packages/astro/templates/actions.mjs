import { ActionError, callSafely } from 'astro:actions';

function toActionProxy(actionCallback = {}, aggregatedPath = '/_actions/') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			if (objKey in target) {
				return target[objKey];
			}
			const path = aggregatedPath + objKey.toString();
			const action = (clientParam) => actionHandler(clientParam, path);
			action.toString = () => path;
			action.safe = (input) => {
				return callSafely(() => action(input));
			};
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

/**
 * @param {*} clientParam argument passed to the action when used on the client.
 * @param {string} path Built path to call action on the server.
 * Usage: `actions.[name](clientParam)`.
 */
async function actionHandler(clientParam, path) {
	if (import.meta.env.SSR) {
		throw new ActionError({
			code: 'BAD_REQUEST',
			message:
				'Action unexpectedly called on the server. If this error is unexpected, share your feedback on our RFC discussion: https://github.com/withastro/roadmap/pull/912',
		});
	}
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	let body = clientParam;
	if (!(body instanceof FormData)) {
		try {
			body = clientParam ? JSON.stringify(clientParam) : undefined;
		} catch (e) {
			throw new ActionError({
				code: 'BAD_REQUEST',
				message: `Failed to serialize request body to JSON. Full error: ${e.message}`,
			});
		}
		headers.set('Content-Type', 'application/json');
		headers.set('Content-Length', body?.length.toString() ?? '0');
	}
	const res = await fetch(path, {
		method: 'POST',
		body,
		headers,
	});
	if (!res.ok) {
		throw await ActionError.fromResponse(res);
	}
	// Check if response body is empty before parsing.
	if (res.status === 204) return;

	const json = await res.json();
	return json;
}

export const actions = toActionProxy();

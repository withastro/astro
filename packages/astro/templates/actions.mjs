import { ActionError, callSafely } from 'astro:actions';

function toActionProxy(actionCallback = {}, aggregatedPath = '/_actions/') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			if (objKey in target) {
				return target[objKey];
			}
			const path = aggregatedPath + objKey.toString();
			const action = (param) => actionHandler(param, path);
			action.toString = () => path;
			action.safe = (input) => {
				return callSafely(() => action(input));
			};
			action.safe.toString = () => path;

			// Add progressive enhancement info for React.
			action.$$FORM_ACTION = function () {
				const data = new FormData();
				data.set('_astroAction', action.toString());
				return {
					method: 'POST',
					name: action.toString(),
					data,
				};
			};
			action.safe.$$FORM_ACTION = function () {
				const data = new FormData();
				data.set('_astroAction', action.toString());
				data.set('_astroActionSafe', 'true');
				return {
					method: 'POST',
					name: action.toString(),
					data,
				};
			};
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

/**
 * @param {*} param argument passed to the action when called server or client-side.
 * @param {string} path Built path to call action by path name.
 * Usage: `actions.[name](param)`.
 */
async function actionHandler(param, path) {
	// When running server-side, import the action and call it.
	if (import.meta.env.SSR) {
		const { getAction } = await import('astro/actions/runtime/utils.js');
		const action = await getAction(path);
		if (!action) throw new Error(`Action not found: ${path}`);

		return action(param);
	}

	// When running client-side, make a fetch request to the action path.
	const headers = new Headers();
	headers.set('Accept', 'application/json');
	let body = param;
	if (!(body instanceof FormData)) {
		try {
			body = param ? JSON.stringify(param) : undefined;
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

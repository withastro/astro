import { ActionError, callSafely, getActionQueryString } from 'astro:actions';

function toActionProxy(actionCallback = {}, aggregatedPath = '') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			if (objKey in target || typeof objKey === 'symbol') {
				return target[objKey];
			}
			const path = aggregatedPath + objKey.toString();
			const action = (param) => callSafely(() => actionHandler(param, path));

			Object.assign(action, {
				toString: () => getActionQueryString(path),
				queryString: action.toString(),
				orThrow: (param) => {
					return actionHandler(param, path);
				},
				// Add progressive enhancement info for React.
				$$FORM_ACTION: function () {
					const data = new FormData();
					data.set('_astroActionSafe', 'true');
					return {
						method: 'POST',
						// `name` creates a hidden input.
						// It's unused by Astro, but we can't turn this off.
						// At least use a name that won't conflict with a user's formData.
						name: '_astroAction',
						action: action.toString(),
						data,
					};
				},
			});

			Object.assign(action.orThrow, {
				toString: () => action.toString(),
				$$FORM_ACTION: function () {
					return {
						method: 'POST',
						name: '_astroAction',
						action: action.toString(),
					};
				},
			});

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
	const res = await fetch(`/_actions/${path}`, {
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
	console.log('$$$json', json);
	return json;
}

export const actions = toActionProxy();

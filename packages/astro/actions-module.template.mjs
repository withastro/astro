import { ActionError, callSafely } from 'astro:actions';

function toActionProxy(
	actionCallback = {},
	aggregatedPath = '/_actions/'
) {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			const path = aggregatedPath + objKey.toString();
			if (objKey in target) {
				return target[objKey];
			}
			async function action(param) {
				const headers = new Headers();
				headers.set('Accept', 'application/json');
				let body = param;
				if (!(body instanceof FormData)) {
					body = param ? JSON.stringify(param) : undefined;
					headers.set('Content-Type', 'application/json');
				}
				const res = await fetch(path, {
					method: 'POST',
					body,
					headers,
				});
				const json = await res.json();
				if (!res.ok) {
					throw await ActionError.fromResponse(res);
				}
				return json;
			}
			action.toString = () => path;
			action.safe = (input) => {
				return callSafely(action, input);
			}
			action.safe[Symbol.for('astro:action:safe')] = true;
			action.safe.toString = () => path;
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

export const actions = toActionProxy();

import { ActionError, ValidationError } from 'astro:actions';

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
					if (json.type === 'ValidationError') {
						throw new ValidationError(json.fieldErrors);
					}
					throw new ActionError(json);
				}
				return json;
			}
			action.toString = () => path;
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

export const actions = toActionProxy();

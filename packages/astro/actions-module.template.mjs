import { ActionError, callSafely } from 'astro:actions';

function toActionProxy(actionCallback = {}, aggregatedPath = '/_actions/') {
	return new Proxy(actionCallback, {
		get(target, objKey) {
			const path = aggregatedPath + objKey.toString();
			if (objKey in target) {
				return target[objKey];
			}
			async function action(param) {
				if (import.meta.env.SSR) {
					throw new ActionError({
						code: 'BAD_REQUEST',
						message:
							'Action unexpectedly called on the server. If this error is unexpected, share your feedback on our RFC discussion: https://github.com/withastro/roadmap/pull/912',
					});
				}
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
				}
				const res = await fetch(path, {
					method: 'POST',
					body,
					headers,
				});
				if (!res.ok) {
					throw await ActionError.fromResponse(res);
				}
				const json = await res.json();
				return json;
			}
			action.toString = () => path;
			action.safe = (input) => {
				return callSafely(() => action(input));
			};
			action.safe[Symbol.for('astro:action:safe')] = true;
			action.safe.toString = () => path;
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

export const actions = toActionProxy();

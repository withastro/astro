function toActionProxy(
	actionCallback = {},
	aggregatedPath = '/_actions/'
): Record<string | symbol, any> {
	return new Proxy(actionCallback, {
		get(target: Record<string | symbol, any>, objKey) {
			const path = aggregatedPath + objKey.toString();
			if (objKey in target) {
				return target[objKey];
			}
			async function action(param?: BodyInit) {
				const headers = new Headers();
				headers.set('Accept', 'application/json');
				let body = param;
				if (!(body instanceof FormData)) {
					body = JSON.stringify(param);
					headers.set('Content-Type', 'application/json');
				}
				const res = await fetch(path, {
					method: 'POST',
					body,
					headers,
				});
				return res.json();
			}
			action.toString = () => path;
			// recurse to construct queries for nested object paths
			// ex. actions.user.admins.auth()
			return toActionProxy(action, path + '.');
		},
	});
}

export const actions = toActionProxy();

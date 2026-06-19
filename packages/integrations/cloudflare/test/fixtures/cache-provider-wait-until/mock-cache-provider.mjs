export default function createCacheProvider() {
	return {
		name: 'wait-until-probe',
		async onRequest(context, next) {
			const response = await next();
			response.headers.set('x-cache-provider-waituntil', typeof context.waitUntil);
			return response;
		},
		async invalidate() {},
	};
}

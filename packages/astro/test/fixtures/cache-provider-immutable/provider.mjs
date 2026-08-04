/**
 * A cache provider whose `onRequest` serves responses straight from an
 * external source, the way a Cache API backed provider serves hits. Such
 * responses have immutable headers. The URL is read from an environment
 * variable so the test can point it at a data: URL or a local server.
 */
export default function passthroughProvider() {
	return {
		name: 'passthrough',
		async onRequest(_context, _next) {
			return fetch(process.env.CACHE_PROVIDER_IMMUTABLE_URL ?? 'data:text/plain,cache-hit');
		},
		setHeaders() {
			return new Headers();
		},
		async invalidate() {},
	};
}

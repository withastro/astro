/**
 * A CDN-style cache provider for testing.
 * Does NOT implement onRequest — just relies on CDN-Cache-Control / Cache-Tag headers.
 */
export default function createCacheProvider(_config) {
	return {
		name: 'mock-cdn-cache',
		async invalidate(_options) {
			// no-op for testing
		},
	};
}

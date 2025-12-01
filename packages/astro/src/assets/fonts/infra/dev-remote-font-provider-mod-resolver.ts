import type { ViteDevServer } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export function createDevServerRemoteFontProviderModResolver({
	server,
}: {
	server: ViteDevServer;
}): RemoteFontProviderModResolver {
	return {
		resolve(id) {
			return server.ssrLoadModule(id);
		},
	};
}

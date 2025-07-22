import type { ViteDevServer } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export function createBuildRemoteFontProviderModResolver(): RemoteFontProviderModResolver {
	return {
		resolve(id) {
			return import(id);
		},
	};
}

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

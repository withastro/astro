import type { ViteDevServer } from 'vite';
import { getRunnableEnvironment } from '../../../core/module-loader/index.js';
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
			const ssrEnvironment = getRunnableEnvironment(server);
			return ssrEnvironment.runner.import(id);
		},
	};
}

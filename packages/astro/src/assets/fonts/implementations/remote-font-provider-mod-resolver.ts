import type { RunnableDevEnvironment } from 'vite';
import type { RemoteFontProviderModResolver } from '../definitions.js';

export function createBuildRemoteFontProviderModResolver(): RemoteFontProviderModResolver {
	return {
		resolve(id) {
			return import(id);
		},
	};
}

export function createDevServerRemoteFontProviderModResolver({
	environment,
}: {
	environment: RunnableDevEnvironment;
}): RemoteFontProviderModResolver {
	return {
		resolve(id) {
			return environment.runner.import(id);
		},
	};
}

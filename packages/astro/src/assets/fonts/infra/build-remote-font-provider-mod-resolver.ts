import type { RemoteFontProviderModResolver } from '../definitions.js';

export function createBuildRemoteFontProviderModResolver(): RemoteFontProviderModResolver {
	return {
		resolve(id) {
			return import(id);
		},
	};
}

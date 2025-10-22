import type { PlatformProvider } from '../definitions.js';

export function createProcessPlatformProvider(): PlatformProvider {
	const platform = Boolean(process.env.GITPOD_REPO_ROOT) ? 'gitpod' : process.platform;
	return {
		get() {
			return platform;
		},
	};
}

import type { PlatformProvider } from '../definitions.js';

// TODO: probably needs another abstraction for the IDE (eg gitpod + stackblitz)
export function createProcessPlatformProvider(): PlatformProvider {
	const platform = Boolean(process.env.GITPOD_REPO_ROOT) ? 'gitpod' : process.platform;
	return {
		get() {
			return platform;
		},
	};
}

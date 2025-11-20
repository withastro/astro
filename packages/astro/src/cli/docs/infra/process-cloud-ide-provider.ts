import type { CloudIdeProvider } from '../definitions.js';

export function createProcessCloudIdeProvider(): CloudIdeProvider {
	return {
		get name() {
			return Boolean(process.env.GITPOD_REPO_ROOT) ? 'gitpod' : null;
		},
	};
}

import type { CloudIdeProvider } from '../definitions.js';

export function createProcessCloudIdeProvider(): CloudIdeProvider {
	return {
		getName() {
			return Boolean(process.env.GITPOD_REPO_ROOT) ? 'gitpod' : null;
		},
	};
}

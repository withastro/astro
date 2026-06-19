import type { CloudIdeProvider } from '../definitions.js';
import type { CloudIde } from '../domain/cloud-ide.js';

export class ProcessCloudIdeProvider implements CloudIdeProvider {
	readonly name: CloudIde | null = Boolean(process.env.GITPOD_REPO_ROOT) ? 'gitpod' : null;
}

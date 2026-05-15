import type { CloudIdeProvider } from '../definitions.js';
import type { CloudIde } from '../domain/cloud-ide.js';
export declare class ProcessCloudIdeProvider implements CloudIdeProvider {
	readonly name: CloudIde | null;
}

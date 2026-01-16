import type { CloudIde } from './domain/cloud-ide.js';

export interface CloudIdeProvider {
	readonly name: CloudIde | null;
}

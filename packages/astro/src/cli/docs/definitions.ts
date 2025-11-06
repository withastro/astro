import type { CloudIde } from './domain/cloud-ide.js';

export interface CloudIdeProvider {
	getName: () => CloudIde | null;
}
import type { NodeVersionProvider } from '../definitions.js';

export class ProcessNodeVersionProvider implements NodeVersionProvider {
	readonly version: string = process.version;
}

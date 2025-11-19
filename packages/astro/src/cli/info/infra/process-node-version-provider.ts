import type { NodeVersionProvider } from '../definitions.js';

export function createProcessNodeVersionProvider(): NodeVersionProvider {
	return {
		get() {
			return process.version;
		},
	};
}

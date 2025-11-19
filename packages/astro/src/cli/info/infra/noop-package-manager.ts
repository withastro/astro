import type { PackageManager } from '../definitions.js';

export function createNoopPackageManager(): PackageManager {
	return {
		getName() {
			return 'unknown';
		},
		async getPackageVersion() {
			return undefined;
		},
	};
}

import type { PackageManager } from '../definitions.js';

export function createBunPackageManager(): PackageManager {
	return {
		getName() {
			return 'bun';
		},
		async getPackageVersion() {
			return undefined;
		},
	};
}

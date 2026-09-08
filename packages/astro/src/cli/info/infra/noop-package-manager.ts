import type { PackageManager } from '../definitions.js';

export class NoopPackageManager implements PackageManager {
	readonly name: string = 'unknown';

	async getPackageVersion(): Promise<string | undefined> {
		return undefined;
	}
}

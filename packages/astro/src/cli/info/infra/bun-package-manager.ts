import type { PackageManager } from '../definitions.js';

export class BunPackageManager implements PackageManager {
	readonly name: string = 'bun';

	async getPackageVersion(): Promise<string | undefined> {
		return undefined;
	}
}

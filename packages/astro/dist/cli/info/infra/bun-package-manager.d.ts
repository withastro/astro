import type { PackageManager } from '../definitions.js';
export declare class BunPackageManager implements PackageManager {
	readonly name: string;
	getPackageVersion(): Promise<string | undefined>;
}

import type { PackageManager } from '../definitions.js';
export declare class NoopPackageManager implements PackageManager {
	readonly name: string;
	getPackageVersion(): Promise<string | undefined>;
}

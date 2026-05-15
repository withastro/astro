import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager } from '../definitions.js';
export declare class YarnPackageManager implements PackageManager {
	#private;
	readonly name: string;
	constructor({ commandExecutor }: { commandExecutor: CommandExecutor });
	getPackageVersion(name: string): Promise<string | undefined>;
}

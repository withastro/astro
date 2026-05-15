import type { CommandExecutor } from '../../definitions.js';
import type { PackageManager, PackageManagerUserAgentProvider } from '../definitions.js';
interface Options {
	packageManagerUserAgentProvider: PackageManagerUserAgentProvider;
	commandExecutor: CommandExecutor;
}
export declare function getPackageManager({
	packageManagerUserAgentProvider,
	commandExecutor,
}: Options): Promise<PackageManager>;
export {};

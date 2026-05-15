import type { AstroLogger } from '../../../core/logger/core.js';
import type { CommandExecutor, OperatingSystemProvider } from '../../definitions.js';
import type { CloudIdeProvider } from '../definitions.js';
interface Options {
	url: string;
	operatingSystemProvider: OperatingSystemProvider;
	logger: AstroLogger;
	commandExecutor: CommandExecutor;
	cloudIdeProvider: CloudIdeProvider;
}
export declare const openDocsCommand: {
	help: {
		commandName: string;
		tables: {
			Flags: [string, string][];
		};
		description: string;
	};
	run({
		url,
		operatingSystemProvider,
		logger,
		commandExecutor,
		cloudIdeProvider,
	}: Options): Promise<void>;
};
export {};

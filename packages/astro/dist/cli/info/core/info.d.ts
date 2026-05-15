import type { AstroLogger } from '../../../core/logger/core.js';
import type { Clipboard, DebugInfoFormatter, DebugInfoProvider } from '../definitions.js';
interface Options {
	debugInfoProvider: DebugInfoProvider;
	getDebugInfoFormatter: (options: { pretty: boolean }) => DebugInfoFormatter;
	logger: AstroLogger;
	clipboard: Clipboard;
}
export declare const infoCommand: {
	help: {
		commandName: string;
		tables: {
			Flags: [string, string][];
		};
		description: string;
	};
	run({ debugInfoProvider, getDebugInfoFormatter, logger, clipboard }: Options): Promise<void>;
};
export {};

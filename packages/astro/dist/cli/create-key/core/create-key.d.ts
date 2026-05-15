import type { AstroLogger } from '../../../core/logger/core.js';
import type { KeyGenerator } from '../definitions.js';
interface Options {
	logger: AstroLogger;
	keyGenerator: KeyGenerator;
}
export declare const createKeyCommand: {
	help: {
		commandName: string;
		tables: {
			Flags: [string, string][];
		};
		description: string;
	};
	run({ logger, keyGenerator }: Options): Promise<void>;
};
export {};

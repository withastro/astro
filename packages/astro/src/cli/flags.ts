import type { Arguments as Flags } from 'yargs-parser';
import type { AstroInlineConfig } from '../@types/astro.js';
import { Logger, type LogOptions } from '../core/logger/core.js';
import { nodeLogDestination } from '../core/logger/node.js';

export function flagsToAstroInlineConfig(flags: Flags): AstroInlineConfig {
	return {
		// Inline-only configs
		configFile: typeof flags.config === 'string' ? flags.config : undefined,
		mode: typeof flags.mode === 'string' ? (flags.mode as AstroInlineConfig['mode']) : undefined,
		logLevel: flags.verbose ? 'debug' : flags.silent ? 'silent' : undefined,

		// Astro user configs
		root: typeof flags.root === 'string' ? flags.root : undefined,
		site: typeof flags.site === 'string' ? flags.site : undefined,
		base: typeof flags.base === 'string' ? flags.base : undefined,
		markdown: {
			drafts: typeof flags.drafts === 'boolean' ? flags.drafts : undefined,
		},
		server: {
			port: typeof flags.port === 'number' ? flags.port : undefined,
			host:
				typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : undefined,
			open: typeof flags.open === 'boolean' ? flags.open : undefined,
		},
	};
}

/**
 * The `logging` is usually created from an `AstroInlineConfig`, but some flows like `add`
 * doesn't read the AstroConfig directly, so we create a `logging` object from the CLI flags instead.
 */
export function createLoggerFromFlags(flags: Flags): Logger {
	const logging: LogOptions = {
		dest: nodeLogDestination,
		level: 'info',
	};

	if (flags.verbose) {
		logging.level = 'debug';
	} else if (flags.silent) {
		logging.level = 'silent';
	}

	return new Logger(logging);
}

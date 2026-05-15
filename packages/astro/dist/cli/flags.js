import { createNodeLoggerFromFlags } from '../core/logger/impls/node.js';
import { createJsonLoggerFromFlags } from '../core/logger/impls/json.js';
function flagsToAstroInlineConfig(flags) {
	const inlineConfig = {
		// Inline-only configs
		configFile: typeof flags.config === 'string' ? flags.config : void 0,
		mode: typeof flags.mode === 'string' ? flags.mode : void 0,
		logLevel: flags.verbose ? 'debug' : flags.silent ? 'silent' : void 0,
		force: flags.force ? true : void 0,
		// Astro user configs
		root: typeof flags.root === 'string' ? flags.root : void 0,
		site: typeof flags.site === 'string' ? flags.site : void 0,
		base: typeof flags.base === 'string' ? flags.base : void 0,
		outDir: typeof flags.outDir === 'string' ? flags.outDir : void 0,
		server: {
			port: typeof flags.port === 'number' ? flags.port : void 0,
			host: typeof flags.host === 'string' || typeof flags.host === 'boolean' ? flags.host : void 0,
			open: typeof flags.open === 'string' || typeof flags.open === 'boolean' ? flags.open : void 0,
			allowedHosts:
				typeof flags.allowedHosts === 'string'
					? flags.allowedHosts.split(',')
					: typeof flags.allowedHosts === 'boolean' && flags.allowedHosts === true
						? flags.allowedHosts
						: [],
		},
	};
	if (flags.experimentalJson) {
		inlineConfig.experimental = {
			logger: {
				entrypoint: 'astro/logger/json',
			},
		};
	}
	return inlineConfig;
}
function createLoggerFromFlags(flags) {
	let logLevel = flags.level;
	if (flags.verbose) {
		logLevel = 'debug';
	} else if (flags.silent) {
		logLevel = 'silent';
	}
	if (flags.experimentalJson) {
		return createJsonLoggerFromFlags({ logLevel });
	} else {
		return createNodeLoggerFromFlags({ logLevel });
	}
}
export { createLoggerFromFlags, flagsToAstroInlineConfig };

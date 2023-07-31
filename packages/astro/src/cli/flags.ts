import type { Arguments as Flags } from 'yargs-parser';
import type { AstroInlineConfig } from '../@types/astro.js';

export function flagsToAstroInlineConfig(flags: Flags): AstroInlineConfig {
	return {
		configFile: typeof flags.config === 'string' ? flags.config : undefined,
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
		experimental: {
			assets: typeof flags.experimentalAssets === 'boolean' ? flags.experimentalAssets : undefined,
		},
	};
}

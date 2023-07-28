import type { Arguments as Flags } from 'yargs-parser';
import type { AstroInlineConfig } from '../@types/astro.js';
import { createSettings, resolveConfig } from '../core/config/index.js';
import { telemetry, eventCliSession } from '../events/index.js';

interface LoadSettingsOptions {
	cmd: string;
	flags: Flags;
}

export async function loadSettings({ cmd, flags }: LoadSettingsOptions) {
	const inlineConfig = flagsToAstroInlineConfig(flags);
	const { astroConfig: initialAstroConfig, userConfig: initialUserConfig } = await resolveConfig(
		inlineConfig,
		cmd
	);

	if (!initialAstroConfig) return;
	telemetry.record(eventCliSession(cmd, initialUserConfig, flags));
	return createSettings(initialAstroConfig, inlineConfig.root);
}

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

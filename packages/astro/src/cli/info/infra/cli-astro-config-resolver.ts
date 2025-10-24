import { resolveConfig } from '../../../core/config/config.js';
import type { Flags } from '../../flags.js';
import type { AstroConfigResolver } from '../definitions.js';

interface Options {
	// TODO: find something better
	flags: Flags;
}

export function createCliAstroConfigResolver({ flags }: Options): AstroConfigResolver {
	return {
		async resolve() {
			const { astroConfig } = await resolveConfig(
				{
					// Inline-only configs
					configFile: typeof flags.config === 'string' ? flags.config : undefined,
					mode: typeof flags.mode === 'string' ? flags.mode : undefined,
					logLevel: flags.verbose ? 'debug' : flags.silent ? 'silent' : undefined,
					force: flags.force ? true : undefined,

					// Astro user configs
					root: typeof flags.root === 'string' ? flags.root : undefined,
					site: typeof flags.site === 'string' ? flags.site : undefined,
					base: typeof flags.base === 'string' ? flags.base : undefined,
					outDir: typeof flags.outDir === 'string' ? flags.outDir : undefined,
					server: {
						port: typeof flags.port === 'number' ? flags.port : undefined,
						host:
							typeof flags.host === 'string' || typeof flags.host === 'boolean'
								? flags.host
								: undefined,
						open:
							typeof flags.open === 'string' || typeof flags.open === 'boolean'
								? flags.open
								: undefined,
						allowedHosts:
							typeof flags.allowedHosts === 'string'
								? flags.allowedHosts.split(',')
								: typeof flags.allowedHosts === 'boolean' && flags.allowedHosts === true
									? flags.allowedHosts
									: [],
					},
				},
				'info',
			);

			return astroConfig;
		},
	};
}

import { resolveConfig } from '../../../core/config/config.js';
import type { AstroConfig } from '../../../types/public/index.js';
import type { Flags } from '../../flags.js';
import type { AstroConfigResolver } from '../definitions.js';
export class CliAstroConfigResolver implements AstroConfigResolver {
	// TODO: find something better
	readonly #flags: Flags;

	constructor({ flags }: { flags: Flags }) {
		this.#flags = flags;
	}

	async resolve(): Promise<AstroConfig> {
		const { astroConfig } = await resolveConfig(
			// TODO: consider testing flags => astro inline config
			{
				// Inline-only configs
				configFile: typeof this.#flags.config === 'string' ? this.#flags.config : undefined,
				mode: typeof this.#flags.mode === 'string' ? this.#flags.mode : undefined,
				logLevel: this.#flags.verbose ? 'debug' : this.#flags.silent ? 'silent' : undefined,
				force: this.#flags.force ? true : undefined,

				// Astro user configs
				root: typeof this.#flags.root === 'string' ? this.#flags.root : undefined,
				site: typeof this.#flags.site === 'string' ? this.#flags.site : undefined,
				base: typeof this.#flags.base === 'string' ? this.#flags.base : undefined,
				outDir: typeof this.#flags.outDir === 'string' ? this.#flags.outDir : undefined,
				server: {
					port: typeof this.#flags.port === 'number' ? this.#flags.port : undefined,
					host:
						typeof this.#flags.host === 'string' || typeof this.#flags.host === 'boolean'
							? this.#flags.host
							: undefined,
					open:
						typeof this.#flags.open === 'string' || typeof this.#flags.open === 'boolean'
							? this.#flags.open
							: undefined,
					allowedHosts:
						typeof this.#flags.allowedHosts === 'string'
							? this.#flags.allowedHosts.split(',')
							: typeof this.#flags.allowedHosts === 'boolean' && this.#flags.allowedHosts === true
								? this.#flags.allowedHosts
								: [],
				},
			},
			'info',
		);

		return astroConfig;
	}
}

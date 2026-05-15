import { resolveConfig } from '../../../core/config/config.js';
class CliAstroConfigResolver {
	// TODO: find something better
	#flags;
	constructor({ flags }) {
		this.#flags = flags;
	}
	async resolve() {
		const { astroConfig } = await resolveConfig(
			// TODO: consider testing flags => astro inline config
			{
				// Inline-only configs
				configFile: typeof this.#flags.config === 'string' ? this.#flags.config : void 0,
				mode: typeof this.#flags.mode === 'string' ? this.#flags.mode : void 0,
				logLevel: this.#flags.verbose ? 'debug' : this.#flags.silent ? 'silent' : void 0,
				force: this.#flags.force ? true : void 0,
				// Astro user configs
				root: typeof this.#flags.root === 'string' ? this.#flags.root : void 0,
				site: typeof this.#flags.site === 'string' ? this.#flags.site : void 0,
				base: typeof this.#flags.base === 'string' ? this.#flags.base : void 0,
				outDir: typeof this.#flags.outDir === 'string' ? this.#flags.outDir : void 0,
				server: {
					port: typeof this.#flags.port === 'number' ? this.#flags.port : void 0,
					host:
						typeof this.#flags.host === 'string' || typeof this.#flags.host === 'boolean'
							? this.#flags.host
							: void 0,
					open:
						typeof this.#flags.open === 'string' || typeof this.#flags.open === 'boolean'
							? this.#flags.open
							: void 0,
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
export { CliAstroConfigResolver };

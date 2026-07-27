import { fileURLToPath } from 'node:url';
import type { Plugin as VitePlugin } from 'vite';
import type { AstroSettings } from '../../types/astro.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
import { normalizeLoggerConfig, type NormalizedLoggerConfig } from './utils.js';

export const VIRTUAL_LOGGER_ID = 'virtual:astro:logger';
const RESOLVED_VIRTUAL_LOGGER_ID = '\0' + VIRTUAL_LOGGER_ID;

export function vitePluginLogger({
	settings,
}: {
	settings: AstroSettings;
}): VitePlugin | undefined {
	const loggerConfig = settings.config.logger;
	if (!loggerConfig) {
		return;
	}

	return {
		name: VIRTUAL_LOGGER_ID,
		enforce: 'pre',

		resolveId: {
			filter: {
				id: new RegExp(`^${VIRTUAL_LOGGER_ID}$`),
			},
			handler() {
				return RESOLVED_VIRTUAL_LOGGER_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_VIRTUAL_LOGGER_ID}$`),
			},
			async handler() {
				// Use the project root as the importer so that user-provided handlers
				// resolve from the project's node_modules, not from astro core's location.
				const importerPath = fileURLToPath(new URL('package.json', settings.config.root));
				const imports: string[] = [];

				const createDestination = async (config: NormalizedLoggerConfig): Promise<string> => {
					let resolved;
					try {
						resolved = await this.resolve(config.entrypoint, importerPath);
					} catch {
						// Resolution can throw for invalid package specifiers
					}
					if (!resolved) {
						throw new AstroError({
							...UnableToLoadLogger,
							message: UnableToLoadLogger.message(config.entrypoint),
						});
					}

					const name = `_logger${imports.length}`;
					imports.push(`import ${name} from ${JSON.stringify(resolved.id)};`);

					// `astro/logger/compose` takes the composed destinations rather than
					// a serializable config, so its children are instantiated inline.
					if (config.loggers) {
						const destinations: string[] = [];
						for (const nested of config.loggers) {
							destinations.push(await createDestination(nested));
						}
						return `${name}([${destinations.join(', ')}])`;
					}

					return `${name}(${JSON.stringify(config.config) ?? 'undefined'})`;
				};

				const destination = await createDestination(normalizeLoggerConfig(loggerConfig));

				return {
					code: `${imports.join('\n')}\nexport default ${destination};\n`,
				};
			},
		},
	};
}

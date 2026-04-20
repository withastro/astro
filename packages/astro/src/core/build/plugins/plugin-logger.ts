import type { Plugin as VitePlugin } from 'vite';
import type { BuildInternals } from '../internal.js';
import type { StaticBuildOptions } from '../types.js';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../../constants.js';
import { addRollupInput } from '../add-rollup-input.js';
import { getServerOutputDirectory } from '../../../prerender/utils.js';
import {
	generateLoggerCode,
	LOGGER_MODULE_ID,
	RESOLVED_LOGGER_MODULE_ID,
} from '../../logger/shared.js';

export function pluginLogger(
	options: StaticBuildOptions,
	internals: BuildInternals,
): VitePlugin | undefined {
	const loggerConfig = options.settings.config.experimental.logger;
	if (!loggerConfig) {
		return undefined;
	}

	return {
		name: '@astro/plugin-logger-build',
		enforce: 'post',

		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.prerender
			);
		},

		resolveId: {
			filter: {
				id: new RegExp(`^${LOGGER_MODULE_ID}$`),
			},
			handler() {
				return RESOLVED_LOGGER_MODULE_ID;
			},
		},

		load: {
			filter: {
				id: new RegExp(`^${RESOLVED_LOGGER_MODULE_ID}$`),
			},
			handler() {
				return {
					code: generateLoggerCode(loggerConfig),
				};
			},
		},

		options(opts) {
			return addRollupInput(opts, [LOGGER_MODULE_ID]);
		},

		writeBundle(_, bundle) {
			for (const [chunkName, chunk] of Object.entries(bundle)) {
				if (chunk.type !== 'asset' && chunk.facadeModuleId === RESOLVED_LOGGER_MODULE_ID) {
					const outputDirectory = getServerOutputDirectory(options.settings);
					internals.loggerEntryPoint = new URL(chunkName, outputDirectory);
				}
			}
		},
	};
}

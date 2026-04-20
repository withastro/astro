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
import type { LoggerHandlerConfig } from '../../logger/config.js';

/**
 * Vite plugin that resolves `virtual:astro:logger` and optionally bundles it
 * as a separate chunk for SSR builds.
 *
 * When called with only a `LoggerHandlerConfig`, it acts as a pure resolution plugin
 * (used by `loadLogger` to load the logger in a throwaway Vite server).
 *
 * When called with `StaticBuildOptions` and `BuildInternals`, it additionally
 * registers the virtual module as a Rollup input and records the output chunk path
 * (used during the SSR build).
 */
export function pluginLogger(
	config: LoggerHandlerConfig,
	buildOptions?: StaticBuildOptions,
	internals?: BuildInternals,
): VitePlugin {
	return {
		name: LOGGER_MODULE_ID,
		applyToEnvironment(environment) {
			return (
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.ssr ||
				environment.name === ASTRO_VITE_ENVIRONMENT_NAMES.astro ||
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
					code: generateLoggerCode(config),
				};
			},
		},

		options(opts) {
			if (buildOptions) {
				return addRollupInput(opts, [LOGGER_MODULE_ID]);
			}
		},

		writeBundle(_, bundle) {
			if (buildOptions && internals) {
				for (const [chunkName, chunk] of Object.entries(bundle)) {
					if (chunk.type !== 'asset' && chunk.facadeModuleId === RESOLVED_LOGGER_MODULE_ID) {
						const outputDirectory = getServerOutputDirectory(buildOptions.settings);
						internals.loggerEntryPoint = new URL(chunkName, outputDirectory);
					}
				}
			}
		},
	};
}

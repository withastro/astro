import { fileURLToPath } from 'node:url';
import type { LoggerHandlerConfig } from './config.js';

export const COMPOSE_LOGGER_ENTRYPOINT = 'astro/logger/compose';

export interface NormalizedLoggerConfig {
	/** An absolute file path or a package specifier */
	entrypoint: string;
	/** Serializable options passed to the handler factory */
	config?: Record<string, any> | undefined;
	/** The composed handlers. Only set for `astro/logger/compose` */
	loggers?: NormalizedLoggerConfig[];
}

/**
 * Normalizes a user-provided logger config by turning its `entrypoint` into a string that
 * can be resolved as-is, either by Vite (see `vitePluginLogger`) or by Node
 * (see `loadLoggerDestination`), and by applying the same treatment to the handlers
 * composed through `astro/logger/compose`.
 *
 * Concretely, a `URL` entrypoint becomes an absolute file path — mirroring what session
 * drivers do, since both Vite and `import()` can handle those — while a string entrypoint,
 * e.g. a package specifier, is left untouched.
 */
export function normalizeLoggerConfig(logger: LoggerHandlerConfig): NormalizedLoggerConfig {
	const entrypoint = normalizeEntrypoint(logger.entrypoint);

	if (entrypoint === COMPOSE_LOGGER_ENTRYPOINT) {
		const loggers: LoggerHandlerConfig[] = logger.config?.loggers ?? [];
		return {
			entrypoint,
			loggers: loggers.map((nested) => normalizeLoggerConfig(nested)),
		};
	}

	return { entrypoint, config: logger.config };
}

function normalizeEntrypoint(entrypoint: LoggerHandlerConfig['entrypoint']): string {
	return entrypoint instanceof URL ? fileURLToPath(entrypoint) : entrypoint;
}

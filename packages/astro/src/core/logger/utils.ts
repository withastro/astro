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
 * Normalizes a user-provided logger config into something that can be resolved,
 * either by Vite (see `vitePluginLogger`) or by Node (see `loadLoggerDestination`).
 *
 * Mirrors what session drivers and cache providers do: `URL`s become file paths
 * and relative specifiers are resolved against the project root, so that
 * `./logger.js` refers to the user's project rather than to Astro's own location.
 */
export function normalizeLoggerConfig(
	logger: LoggerHandlerConfig,
	root: URL,
): NormalizedLoggerConfig {
	const entrypoint = normalizeEntrypoint(logger.entrypoint, root);

	if (entrypoint === COMPOSE_LOGGER_ENTRYPOINT) {
		const loggers: LoggerHandlerConfig[] = logger.config?.loggers ?? [];
		return {
			entrypoint,
			loggers: loggers.map((nested) => normalizeLoggerConfig(nested, root)),
		};
	}

	return { entrypoint, config: logger.config };
}

function normalizeEntrypoint(entrypoint: LoggerHandlerConfig['entrypoint'], root: URL): string {
	if (entrypoint instanceof URL) {
		return fileURLToPath(entrypoint);
	}
	if (entrypoint.startsWith('./') || entrypoint.startsWith('../')) {
		return fileURLToPath(new URL(entrypoint, root));
	}
	return entrypoint;
}

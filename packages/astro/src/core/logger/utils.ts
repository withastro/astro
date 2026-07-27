import { fileURLToPath } from 'node:url';
import { CyclicLoggerConfig } from '../errors/errors-data.js';
import { AstroError } from '../errors/index.js';
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
 * Mirrors what session drivers do: `URL`s become file paths, which both Vite and
 * `import()` can handle.
 */
export function normalizeLoggerConfig(
	logger: LoggerHandlerConfig,
	/**
	 * The composed loggers currently being normalized, i.e. the ancestors of `logger`.
	 * A composed logger nested inside itself would otherwise recurse forever. Reusing
	 * the same config object across sibling branches stays valid, so this tracks the
	 * current path rather than every config already seen.
	 */
	ancestors: ReadonlySet<LoggerHandlerConfig> = new Set(),
): NormalizedLoggerConfig {
	const entrypoint = normalizeEntrypoint(logger.entrypoint);

	if (entrypoint === COMPOSE_LOGGER_ENTRYPOINT) {
		if (ancestors.has(logger)) {
			throw new AstroError(CyclicLoggerConfig);
		}
		const nestedAncestors = new Set(ancestors).add(logger);
		const loggers: LoggerHandlerConfig[] = logger.config?.loggers ?? [];
		return {
			entrypoint,
			loggers: loggers.map((nested) => normalizeLoggerConfig(nested, nestedAncestors)),
		};
	}

	return { entrypoint, config: logger.config };
}

function normalizeEntrypoint(entrypoint: LoggerHandlerConfig['entrypoint']): string {
	return entrypoint instanceof URL ? fileURLToPath(entrypoint) : entrypoint;
}

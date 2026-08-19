import { isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { AstroLogger, type AstroLoggerDestination } from './core.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
import { createNodeLoggerFromFlags } from './impls/node.js';
import {
	COMPOSE_LOGGER_ENTRYPOINT,
	normalizeLoggerConfig,
	type NormalizedLoggerConfig,
} from './utils.js';

/**
 * Instantiates a logger destination in a Node context.
 *
 * This is the runtime counterpart of `emitDestination()` in `./vite-plugin.ts`: both walk
 * the same normalized config, but this one imports and instantiates the handler directly,
 * while the Vite one *generates code* doing so, to bundle the handler into the build output.
 */
async function createDestination(config: NormalizedLoggerConfig): Promise<AstroLoggerDestination> {
	// `normalizeLoggerConfig()` turns `URL` and relative entrypoints into absolute paths,
	// which `import()` only accepts as file URLs on Windows. Package entrypoints keep their
	// specifier and resolve through the regular module resolution.
	const specifier = isAbsolute(config.entrypoint)
		? pathToFileURL(config.entrypoint).href
		: config.entrypoint;
	const logger = await import(/* @vite-ignore */ specifier);

	// `astro/logger/compose` takes the composed destinations rather than a serializable config.
	if (config.entrypoint === COMPOSE_LOGGER_ENTRYPOINT) {
		return logger.default(await Promise.all((config.loggers ?? []).map(createDestination)));
	}

	return logger.default(config.config);
}

/**
 * Loads a logger destination in a Node context, i.e. outside of a built server bundle.
 * Inside the bundle, the destination comes from the `virtual:astro:logger` module instead.
 */
export async function loadLoggerDestination(
	config: LoggerHandlerConfig,
	/** The project root, which relative entrypoints are resolved against */
	root: URL,
): Promise<AstroLoggerDestination> {
	const normalized = normalizeLoggerConfig(config, root);

	try {
		return await createDestination(normalized);
	} catch (e: unknown) {
		const error = new AstroError({
			...UnableToLoadLogger,
			message: UnableToLoadLogger.message(normalized.entrypoint),
		});
		if (e instanceof Error) {
			error.cause = e;
		}
		throw error;
	}
}

/**
 * It attempts to load a logger from the entrypoint.
 * If not provided, it creates a new logger instance on the fly.
 * @param astroConfig
 * @param inlineAstroConfig
 */
export async function loadOrCreateNodeLogger(
	astroConfig: AstroConfig,
	inlineAstroConfig: AstroInlineConfig,
): Promise<AstroLogger> {
	// Internal testing shortcut: if a pre-built AstroLogger instance was
	// passed via the internal `_logger` property, use it directly.
	if (inlineAstroConfig._logger) return inlineAstroConfig._logger;

	try {
		if (astroConfig.logger) {
			return new AstroLogger({
				destination: await loadLoggerDestination(astroConfig.logger, astroConfig.root),
				level: inlineAstroConfig.logLevel ?? 'info',
			});
		} else {
			return createNodeLoggerFromFlags(inlineAstroConfig);
		}
	} catch {
		return createNodeLoggerFromFlags(inlineAstroConfig);
	}
}

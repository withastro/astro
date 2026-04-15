import { AstroLogger, type AstroLoggerDestination, type AstroLoggerLevel } from './core.js';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { createMinimalViteDevServer } from '../createMinimalViteDevServer.js';
import { isRunnableDevEnvironment, type RunnableDevEnvironment, type ViteDevServer } from 'vite';
import fsMod from 'node:fs';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig, AstroInlineConfig } from '../../types/public/index.js';
import { astroLoggerVitePlugin } from './vite.js';
import { createNodeLoggerFromFlags } from './impls/node.js';

async function loadLogger(
	config: LoggerHandlerConfig,
	root: AstroConfig['root'],
	level: AstroLoggerLevel = 'info',
	fs: typeof fsMod = fsMod,
): Promise<AstroLogger> {
	let server: ViteDevServer | undefined = undefined;
	let cause: Error | undefined = undefined;

	try {
		const plugins = [...loadFallbackPlugin({ fs, root }), astroLoggerVitePlugin({ config })];
		server = await createMinimalViteDevServer(plugins);

		if (isRunnableDevEnvironment(server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
			const environment = server.environments[
				ASTRO_VITE_ENVIRONMENT_NAMES.ssr
			] as RunnableDevEnvironment;
			const mod = await environment.runner.import('virtual:astro:logger');
			return new AstroLogger({
				destination: mod.default as AstroLoggerDestination,
				level,
			});
		}
	} catch (e: unknown) {
		if (e instanceof Error) {
			cause = e;
		}
	} finally {
		if (server) {
			await server.close();
		}
	}

	const error = new AstroError({
		...UnableToLoadLogger,
		message: UnableToLoadLogger.message(config.entrypoint),
	});
	if (cause) {
		error.cause = cause;
	}
	throw error;
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
) {
	try {
		if (astroConfig.experimental.logger) {
			return await loadLogger(
				astroConfig.experimental.logger,
				astroConfig.root,
				inlineAstroConfig.logLevel,
			);
		} else {
			return createNodeLoggerFromFlags(inlineAstroConfig);
		}
	} catch {
		return createNodeLoggerFromFlags(inlineAstroConfig);
	}
}

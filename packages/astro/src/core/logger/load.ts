import type { AstroLoggerDestination } from './core.js';
import loadFallbackPlugin from '../../vite-plugin-load-fallback/index.js';
import { createMinimalViteDevServer } from '../viteUtils.js';
import { isRunnableDevEnvironment, type RunnableDevEnvironment, type ViteDevServer } from 'vite';
import type fsMod from 'node:fs';
import { ASTRO_VITE_ENVIRONMENT_NAMES } from '../constants.js';
import { AstroError } from '../errors/index.js';
import { UnableToLoadLogger } from '../errors/errors-data.js';
import type { LoggerHandlerConfig } from './config.js';
import type { AstroConfig } from '../../types/public/index.js';
import { astroLoggerVitePlugin } from './vite.js';

export async function loadLogger(
	config: LoggerHandlerConfig,
	fs: typeof fsMod,
	root: AstroConfig['root'],
): Promise<AstroLoggerDestination> {
	let server: ViteDevServer | undefined = undefined;

	try {
		const plugins = [...loadFallbackPlugin({ fs, root }), astroLoggerVitePlugin({ config })];
		server = await createMinimalViteDevServer(plugins);

		if (isRunnableDevEnvironment(server.environments[ASTRO_VITE_ENVIRONMENT_NAMES.ssr])) {
			const environment = server.environments[
				ASTRO_VITE_ENVIRONMENT_NAMES.ssr
			] as RunnableDevEnvironment;
			const mod = await environment.runner.import('virtual:astro:logger');
			return mod.default as AstroLoggerDestination;
		}
	} catch (e) {
		console.error(e);
	} finally {
		if (server) {
			await server.close();
		}
	}

	throw new AstroError({
		...UnableToLoadLogger,
		message: UnableToLoadLogger.message(config.entrypoint),
	});
}

import { dim } from 'kleur/colors';
import fsMod from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { createServer, type HMRPayload } from 'vite';
import type { AstroInlineConfig, AstroSettings } from '../../@types/astro.js';
import { createContentTypesGenerator } from '../../content/index.js';
import { globalContentConfigObserver } from '../../content/utils.js';
import { telemetry } from '../../events/index.js';
import { eventCliSession } from '../../events/session.js';
import { runHookConfigSetup } from '../../integrations/index.js';
import { setUpEnvTs } from '../../vite-plugin-inject-env-ts/index.js';
import { getTimeStat } from '../build/util.js';
import { resolveConfig } from '../config/config.js';
import { createNodeLogger } from '../config/logging.js';
import { createSettings } from '../config/settings.js';
import { createVite } from '../create-vite.js';
import { AstroError, AstroErrorData, createSafeError, isAstroError } from '../errors/index.js';
import type { Logger } from '../logger/core.js';

export type ProcessExit = 0 | 1;

export type SyncOptions = {
	/**
	 * @internal only used for testing
	 */
	fs?: typeof fsMod;
};

export type SyncInternalOptions = SyncOptions & {
	logger: Logger;
};

/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
export default async function sync(
	inlineConfig: AstroInlineConfig,
	options?: SyncOptions
): Promise<ProcessExit> {
	const logger = createNodeLogger(inlineConfig);
	const { userConfig, astroConfig } = await resolveConfig(inlineConfig ?? {}, 'sync');
	telemetry.record(eventCliSession('sync', userConfig));

	const _settings = await createSettings(astroConfig, fileURLToPath(astroConfig.root));

	const settings = await runHookConfigSetup({
		settings: _settings,
		logger: logger,
		command: 'build',
	});

	return await syncInternal(settings, { ...options, logger });
}

/**
 * Generate content collection types, and then returns the process exit signal.
 *
 * A non-zero process signal is emitted in case there's an error while generating content collection types.
 *
 * This should only be used when the callee already has an `AstroSetting`, otherwise use `sync()` instead.
 * @internal
 *
 * @param {SyncOptions} options
 * @param {AstroSettings} settings Astro settings
 * @param {typeof fsMod} options.fs The file system
 * @param {LogOptions} options.logging Logging options
 * @return {Promise<ProcessExit>}
 */
export async function syncInternal(
	settings: AstroSettings,
	{ logger, fs }: SyncInternalOptions
): Promise<ProcessExit> {
	const timerStart = performance.now();
	// Needed to load content config
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false, watch: { ignored: ['**'] } },
				optimizeDeps: { disabled: true },
				ssr: { external: [] },
				logLevel: 'silent',
			},
			{ settings, logger, mode: 'build', command: 'build', fs }
		)
	);

	// Patch `ws.send` to bubble up error events
	// `ws.on('error')` does not fire for some reason
	const wsSend = tempViteServer.ws.send;
	tempViteServer.ws.send = (payload: HMRPayload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return wsSend(payload);
	};

	try {
		const contentTypesGenerator = await createContentTypesGenerator({
			contentConfigObserver: globalContentConfigObserver,
			logger: logger,
			fs: fs ?? fsMod,
			settings,
			viteServer: tempViteServer,
		});
		const typesResult = await contentTypesGenerator.init();

		const contentConfig = globalContentConfigObserver.get();
		if (contentConfig.status === 'error') {
			throw contentConfig.error;
		}

		if (typesResult.typesGenerated === false) {
			switch (typesResult.reason) {
				case 'no-content-dir':
				default:
					logger.info('content', 'No content directory found. Skipping type generation.');
					return 0;
			}
		}
	} catch (e) {
		const safeError = createSafeError(e);
		if (isAstroError(e)) {
			throw e;
		}
		throw new AstroError(
			{
				...AstroErrorData.GenerateContentTypesError,
				message: AstroErrorData.GenerateContentTypesError.message(safeError.message),
			},
			{ cause: e }
		);
	} finally {
		await tempViteServer.close();
	}

	logger.info('content', `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);
	await setUpEnvTs({ settings, logger, fs: fs ?? fsMod });

	return 0;
}

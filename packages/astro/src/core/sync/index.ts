import { dim } from 'kleur/colors';
import fsMod from 'node:fs';
import { performance } from 'node:perf_hooks';
import { fileURLToPath } from 'node:url';
import { type HMRPayload, createServer } from 'vite';
import type { AstroConfig, AstroSettings } from '../../@types/astro.js';
import { getPackage } from '../../cli/install-package.js';
import { createContentTypesGenerator } from '../../content/index.js';
import { globalContentConfigObserver } from '../../content/utils.js';
import { syncAstroEnv } from '../../env/sync.js';
import { runHookConfigSetup } from '../../integrations/hooks.js';
import { setUpEnvTs } from '../../vite-plugin-inject-env-ts/index.js';
import { getTimeStat } from '../build/util.js';
import { createSettings } from '../config/settings.js';
import { createVite } from '../create-vite.js';
import { collectErrorMetadata } from '../errors/dev/utils.js';
import {
	AstroError,
	AstroErrorData,
	AstroUserError,
	createSafeError,
	isAstroError,
} from '../errors/index.js';
import type { Logger } from '../logger/core.js';
import { formatErrorMessage } from '../messages.js';
import { ensureProcessNodeEnv } from '../util.js';

export type SyncOptions = {
	/**
	 * @internal only used for testing
	 */
	fs?: typeof fsMod;
	logger: Logger;
	astroConfig: AstroConfig;
	settings?: AstroSettings;
};

type DBPackage = {
	typegen?: (args: Pick<AstroConfig, 'root' | 'integrations'>) => Promise<void>;
};

/**
 * Generates TypeScript types for all Astro modules. This sets up a `src/env.d.ts` file for type inferencing,
 * and defines the `astro:content` module for the Content Collections API.
 *
 * @experimental The JavaScript API is experimental
 */
export default async function sync({
	astroConfig,
	logger,
	fs = fsMod,
	settings,
}: SyncOptions): Promise<AstroSettings> {
	ensureProcessNodeEnv('production');
	const cwd = fileURLToPath(astroConfig.root);

	settings ??= await createSettings(astroConfig, cwd);

	settings = await runHookConfigSetup({
		settings,
		logger,
		command: 'build',
	});

	const timerStart = performance.now();
	const dbPackage = await getPackage<DBPackage>(
		'@astrojs/db',
		logger,
		{
			optional: true,
			cwd,
		},
		[]
	);

	try {
		await dbPackage?.typegen?.(astroConfig);
		await syncContentCollections(settings, { fs, logger });
		syncAstroEnv(settings, fs);

		await setUpEnvTs({ settings, logger, fs });
		logger.info(null, `Types generated ${dim(getTimeStat(timerStart, performance.now()))}`);

		return settings;
	} catch (err) {
		const error = createSafeError(err);
		logger.error(
			'types',
			formatErrorMessage(collectErrorMetadata(error), logger.level() === 'debug') + '\n'
		);
		// Will return exit code 1 in CLI
		throw error;
	}
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
async function syncContentCollections(
	settings: AstroSettings,
	{ logger, fs }: Pick<SyncOptions, 'logger' | 'fs'>
): Promise<void> {
	// Needed to load content config
	const tempViteServer = await createServer(
		await createVite(
			{
				server: { middlewareMode: true, hmr: false, watch: null },
				optimizeDeps: { noDiscovery: true },
				ssr: { external: [] },
				logLevel: 'silent',
			},
			{ settings, logger, mode: 'build', command: 'build', fs, sync: true }
		)
	);

	// Patch `hot.send` to bubble up error events
	// `hot.on('error')` does not fire for some reason
	const hotSend = tempViteServer.hot.send;
	tempViteServer.hot.send = (payload: HMRPayload) => {
		if (payload.type === 'error') {
			throw payload.err;
		}
		return hotSend(payload);
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
					logger.debug('types', 'No content directory found. Skipping type generation.');
			}
		}
	} catch (e) {
		const safeError = createSafeError(e);
		if (isAstroError(e)) {
			throw e;
		}
		const hint = AstroUserError.is(e) ? e.hint : AstroErrorData.GenerateContentTypesError.hint;
		throw new AstroError(
			{
				...AstroErrorData.GenerateContentTypesError,
				hint,
				message: AstroErrorData.GenerateContentTypesError.message(safeError.message),
			},
			{ cause: e }
		);
	} finally {
		await tempViteServer.close();
	}
}
